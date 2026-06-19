import { existsSync } from 'node:fs';

// husky installs this repo's local git hooks and is a dev-only dependency. It is
// invoked from a presence-guarded postinstall (see package.json) so it never runs
// for consumers — this file is intentionally not published. The .git check is a
// secondary guard for non-checkout environments; husky's own default() already
// no-ops gracefully on a missing .git or HUSKY=0, and any genuine setup error is
// left to surface rather than be swallowed. See GetStream/stream-chat-js#1763.
if (existsSync('.git')) {
  (await import('husky')).default();
}
