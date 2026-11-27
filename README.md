# Atelier Model Viewer

A FigCraft-designed interface for the eight Modern Residences originally published on `cmbimmodel.netlify.app`. The collection includes 339 saved perspectives and the existing Three.js viewer, floor-plan navigator, rendering modes, and model downloads.

## Build and verify

Run `npm run build` with Node.js 20 or newer. The build restores the original renderer and model assets from the pinned Netlify deploy in `asset-host.json`, applies the interface files in `public/`, and writes a complete static site to `dist/`. It checks all restored assets against the recorded hashes and verifies the GLB for each residence against the catalog. No package install is required.

If you have a local copy of the original site, set `ATELIER_SOURCE_DIR` and `ATELIER_RUNTIME_DIR` to its root to build from that copy. You can also run `npm test` after building to verify model and scene integrity again.

Serve `dist/` over HTTP for local review. Netlify builds use `npm run build` and publish `dist`. A full built folder can also be deployed directly as a static site. Keep the routes in the catalog and the individual model parts together.

The browser uses WebGL 2 for 3D. Current and earlier design images are available from the same perspective panel on browsers without WebGL 2. View links retain the selected model and perspective.
