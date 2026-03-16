import path from 'node:path';
import { defineConfig, loadEnv } from 'vite';
import babel from 'vite-plugin-babel';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(() => {
  const rootDir = process.cwd();
  const streamChatPath = path.resolve(rootDir, '../../node_modules/stream-chat');

  // Load shared .env file
  const env = loadEnv('', rootDir, '');
  return {
    plugins: [
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
    resolve: {
      alias: {
        'stream-chat': streamChatPath,
      },
    },
  };
});
