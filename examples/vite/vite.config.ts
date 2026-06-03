import { existsSync, readFileSync } from 'node:fs';
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
  const streamChatJsRoot = env.STREAM_CHAT_JS_PATH
    ? resolve(rootDir, env.STREAM_CHAT_JS_PATH)
    : undefined;
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
      include: ['base64-js', 'form-data', 'isomorphic-ws', 'axios'],
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
