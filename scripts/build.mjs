import { createHash } from 'node:crypto';
import { cp, mkdir, mkdtemp, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const specification = JSON.parse(await readFile(join(root, 'asset-host.json'), 'utf8'));
const source = JSON.parse(await readFile(join(root, 'source-manifest.json'), 'utf8'));
const runtime = JSON.parse(await readFile(join(root, 'runtime-assets.json'), 'utf8')).files;
const dist = join(root, 'dist');

function safePath(path) {
  if (!path || path.startsWith('/') || path.includes('\\') ||
      path.split('/').some(part => !part || part === '.' || part === '..')) {
    throw new Error(`Invalid asset path: ${path}`);
  }
  return path;
}

function digest(data) {
  return createHash('sha256').update(data).digest('hex');
}

function assertFile(entry, bytes) {
  if (bytes.length !== entry.bytes || digest(bytes) !== entry.sha256) {
    throw new Error(`Size or SHA-256 mismatch: ${entry.path}`);
  }
}

async function recover(entry, cache) {
  const path = safePath(entry.path);
  if (cache) return readFile(join(cache, path));
  const upstream = new URL(path.split('/').map(encodeURIComponent).join('/'), specification.deploy);
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const response = await fetch(upstream, { signal: AbortSignal.timeout(60000) });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return Buffer.from(await response.arrayBuffer());
    } catch (error) {
      if (attempt === 3) throw new Error(`Could not retrieve ${path}: ${error.message}`, { cause: error });
    }
  }
}

async function verifyBuild(directory) {
  const index = JSON.parse(await readFile(join(directory, 'asset-index.json'), 'utf8')).assets;
  const catalog = JSON.parse(await readFile(join(directory, 'models.json'), 'utf8'));
  let perspectives = 0;
  for (const model of catalog.models) {
    const scenes = JSON.parse(await readFile(join(directory, safePath(model.scenesUrl)), 'utf8'));
    if (scenes.length !== model.sceneCount || !scenes.some(scene => scene.name === model.sourceScene)) {
      throw new Error(`Scene catalog mismatch: ${model.name}`);
    }
    perspectives += scenes.length;
    const record = index[model.glb];
    if (!record) throw new Error(`Missing model manifest: ${model.name}`);
    const hash = createHash('sha256');
    let offset = 0;
    for (const part of record.chunks) {
      const bytes = await readFile(join(directory, safePath(part.path)));
      if (bytes.length !== part.bytes) throw new Error(`Model part size mismatch: ${part.path}`);
      if (offset === 0 && bytes.subarray(0, 4).toString('ascii') !== 'glTF') {
        throw new Error(`Invalid GLB header: ${model.name}`);
      }
      hash.update(bytes);
      offset += bytes.length;
    }
    const sha256 = hash.digest('hex');
    if (offset !== record.bytes || offset !== model.glbBytes ||
        sha256 !== record.sha256 || sha256 !== model.glbSha256) {
      throw new Error(`Reassembled GLB mismatch: ${model.name}`);
    }
    console.log(`${model.name}: ${scenes.length} perspectives, verified GLB`);
  }
  console.log(`${catalog.models.length} models and ${perspectives} perspectives verified.`);
}

if (process.argv.includes('--verify')) {
  await verifyBuild(dist);
} else {
  const target = await mkdtemp(join(root, '.viewer-build-'));
  try {
    const queue = [
      ...source.map(entry => ({ entry, cache: process.env.ATELIER_SOURCE_DIR })),
      ...runtime.map(entry => ({ entry, cache: process.env.ATELIER_RUNTIME_DIR })),
    ];
    const errors = await Promise.allSettled(Array.from({ length: 14 }, async () => {
      while (queue.length) {
        const { entry, cache } = queue.shift();
        const data = await recover(entry, cache);
        assertFile(entry, data);
        const output = join(target, entry.path);
        await mkdir(dirname(output), { recursive: true });
        await writeFile(output, data);
      }
    }));
    const failure = errors.find(result => result.status === 'rejected');
    if (failure) throw failure.reason;
    await cp(join(root, 'public'), target, { recursive: true });
    await verifyBuild(target);
    await rm(dist, { recursive: true, force: true });
    await rename(target, dist);
  } finally {
    await rm(target, { recursive: true, force: true });
  }
}
