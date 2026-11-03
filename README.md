# Atelier / Modern Residences

Architectural viewing studio with eight updated R3 residences, 339 saved cameras,
16 detail views, current geometry reviews, and clearly labeled earlier renders.

## Netlify serves the interface; GitHub serves the large assets

- `public/` contains the viewer, local Three.js libraries, catalogs, scene JSON,
  navigation, and component credits.
- `runtime-assets/` contains only the browser runtime assets: 60 verified model
  parts, preview/review images, and three HDR lighting environments.
- The build creates `dist/` with an external asset configuration pinned to the
  exact GitHub commit. No model parts, preview JPGs or HDR binaries enter `dist/`.
- GLB geometry and textures are unchanged. Model downloads still assemble and
  SHA-256-check the complete source GLB. Files load as needed; the browser cache
  and three-part download concurrency remain enabled.

This public repository contains the browser-ready runtime assets. Its model files are downloadable.
The repository does not contain native SKP, IGZ, IFC, plan PDFs or owner archives.
Third-party component notices remain under `public/docs/updated-models/`.
No new license is granted for third-party models by publishing this repository.

## Deploy from this repository

Connect this repository to the intended Netlify site. Use:

```text
Build command: npm run build
Publish directory: dist
Node: 22
```

No dependencies, installation, GitHub token, or API key are required. Netlify's
`COMMIT_REF` pins the asset URLs to that deployment's GitHub commit. The build
verifies all runtime files and reassembled model hashes before publishing.
Do not publish the repository root or `public/` directly.

For a local build from a committed checkout:

```sh
npm test
npm run build
```

Alternatively, set `ASSET_REF` to an existing full 40-character GitHub commit.
A completed `dist/` folder can be zipped or dropped onto Netlify without a build.
The repository and pinned commit must remain publicly accessible.

## Updates

Commit the changed runtime assets and matching catalogs/manifests, then rebuild.
Every deployment uses an immutable commit URL; model parts are also content
addressed. Keep old deployed commits available. Code-only changes do not require
reuploading the models to Netlify. Do not commit generated `dist/`, ZIP archives,
credentials, or native authoring packages.

`ASSET_BASE_URL` can switch to a CORS-enabled HTTPS directory in a future build.
Preserve the paths below `runtime-assets/`. GitHub raw delivery is a hosting
dependency with its own availability and limits; moving assets does not reduce
the bytes needed to view a complete model or guarantee faster GPU rendering.

## Validation

`npm test` checks external URL mapping, path safety, scene/image retention and
the absence of runtime binaries in the interface source. `npm run check` verifies
all asset SHA-256 hashes and complete GLB reassembly. Original R3 geometry/camera
test records remain in `public/docs/`; those records describe the supplied
models, not a new GPU rendering test. Live GPU appearance remains unverified
in the cloud preview browser, which disables WebGL.

After deployment, open `deployment-check.html` to check asset reachability.

References:
- https://docs.github.com/en/rest/repos/contents
- https://docs.github.com/en/repositories/creating-and-managing-repositories/repository-limits
- https://docs.netlify.com/build/configure-builds/overview/

