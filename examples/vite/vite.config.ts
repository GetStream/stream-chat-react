import { existsSync, readFileSync, realpathSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { defineConfig, loadEnv } from 'vite';
import babel from 'vite-plugin-babel';
import react from '@vitejs/plugin-react';

const require = createRequire(import.meta.url);

// Resolve the actual installed package root from the example app's dependency graph.
// This avoids assuming a fixed sibling-repo layout and works with portal/symlinked installs.
const getPackageRoot = (packageName: string, fromDirectory: string) => {
  const packageEntry = require.resolve(packageName, { paths: [fromDirectory] });
  let currentDirectory = dirname(packageEntry);

  while (true) {
    const packageJsonPath = resolve(currentDirectory, 'package.json');

    if (existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8')) as {
        name?: string;
      };

      if (packageJson.name === packageName) {
        return currentDirectory;
      }
    }

    const parentDirectory = dirname(currentDirectory);

    if (parentDirectory === currentDirectory) {
      throw new Error(`Could not locate package root for "${packageName}"`);
    }

    currentDirectory = parentDirectory;
  }
};

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const rootDir = process.cwd();
  const streamChatReactRoot = getPackageRoot('stream-chat-react', rootDir);

  // Load shared .env file
  const env = loadEnv(mode, rootDir, '');
  /**
   * Resolved through any symlinks, which is not cosmetic.
   *
   * `STREAM_CHAT_JS_PATH` is normally `../../node_modules/stream-chat` — a symlink into a
   * `stream-chat-js` worktree. Served under that literal path, every module of the SDK sits below
   * `node_modules`, and Vite's watcher ignores `**\/node_modules/**` by default. Rebuilding the SDK then
   * changes nothing the dev server can see: the browser keeps the module it loaded at startup and fails
   * with "does not provide an export named …" for anything newly added, until the server is restarted.
   *
   * Pointing at the real directory puts the files back inside watched territory, so a rebuild reloads the
   * page on its own.
   */
  const configuredStreamChatJsRoot = env.STREAM_CHAT_JS_PATH
    ? resolve(rootDir, env.STREAM_CHAT_JS_PATH)
    : undefined;
  // `realpathSync` throws on a path that does not exist, which would replace the explicit error below
  // with a raw ENOENT. Left as configured when missing, so the message that names the problem still wins.
  const streamChatJsRoot =
    configuredStreamChatJsRoot && existsSync(configuredStreamChatJsRoot)
      ? realpathSync(configuredStreamChatJsRoot)
      : configuredStreamChatJsRoot;
  const localStreamChatEntry = streamChatJsRoot
    ? resolve(streamChatJsRoot, 'dist/esm/index.mjs')
    : undefined;

  if (localStreamChatEntry && !existsSync(localStreamChatEntry)) {
    throw new Error(
      `STREAM_CHAT_JS_PATH must point to a built stream-chat-js checkout. Missing ${localStreamChatEntry}`,
    );
  }

  return {
    plugins: [
      ...(localStreamChatEntry
        ? [
            {
              enforce: 'pre' as const,
              name: 'resolve-local-stream-chat',
              resolveId(source: string) {
                if (source === 'stream-chat') {
                  return localStreamChatEntry;
                }
              },
            },
          ]
        : []),
      react(),
      babel({
        babelConfig: {
          plugins: ['babel-plugin-react-compiler'],
        },
      }),
    ],
    define: {
      'process.env': env, // need `process.env` access
    },
    optimizeDeps: {
      // Keep local `stream-chat` out of Vite's prebundle so the browser loads the
      // SDK build directly and DevTools can follow its sourcemaps back to source files.
      // Its local ESM build still imports a few CommonJS deps that need Vite interop.
      include: [
        'base64-js',
        'form-data',
        'isomorphic-ws',
        'axios',
        // The shared i18n layer in `stream-chat` pulls in dayjs, which ships as a
        // UMD bundle with no ESM entry. Excluded deps are not crawled by the
        // dep scanner, so these have to be named explicitly to get CJS interop.
        'dayjs',
        'dayjs/plugin/calendar.js',
        'dayjs/plugin/duration.js',
        'dayjs/plugin/localeData.js',
        'dayjs/plugin/localizedFormat.js',
        'dayjs/plugin/relativeTime.js',
        'dayjs/plugin/timezone.js',
        'dayjs/plugin/updateLocale.js',
        'dayjs/plugin/utc.js',
      ],
      exclude: localStreamChatEntry ? ['stream-chat'] : [],
    },
    server: {
      fs: {
        allow: [
          rootDir,
          streamChatReactRoot,
          ...(streamChatJsRoot ? [streamChatJsRoot] : []),
        ],
      },
    },
  };
});
