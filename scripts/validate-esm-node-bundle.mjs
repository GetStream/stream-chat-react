// ESM counterpart to validate-cjs-node-bundle.cjs.
//
// Node's native ESM loader is stricter than any bundler: it requires file
// extensions on subpath imports of dependencies that ship no "exports" map
// (e.g. `dayjs/plugin/calendar` must be written as `dayjs/plugin/calendar.js`).
// Such specifiers resolve fine through Turbopack/Webpack/Vite but throw
// ERR_MODULE_NOT_FOUND under Node — the same path Next.js takes when it loads
// this package as a server external. Importing the built ESM bundle here catches
// that class of breakage before it ships.

import '../dist/es/index.mjs';
