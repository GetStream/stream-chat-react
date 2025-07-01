// vite.config.ts
import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

function createEnvReplacerPlugin(env: Record<string, string>): Plugin {
  const replacements = {
    REPLACE_WITH_API_KEY: env.VITE_API_KEY,
    REPLACE_WITH_USER_ID: env.VITE_USER_ID,
    REPLACE_WITH_USER_NAME: env.VITE_USER_NAME,
    REPLACE_WITH_USER_TOKEN: env.VITE_USER_TOKEN,
  };

  return {
    name: 'replace-placeholders-from-env',
    transform(code, id) {
      if (id.endsWith('.ts') || id.endsWith('.tsx')) {
        let transformedCode = code;
        for (const [placeholder, value] of Object.entries(replacements)) {
          if (value) {
            const escaped = placeholder.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
            transformedCode = transformedCode.replace(
              new RegExp(`['"]${escaped}['"]`, 'g'),
              JSON.stringify(value),
            );
          }
        }
        return {
          code: transformedCode,
          map: null,
        };
      }
      return null;
    },
  };
}

export default defineConfig(({ mode }) => {
  const rootDir = process.cwd();

  // Load shared .env file
  const env = loadEnv('', rootDir, ''); // loads .env
  const appName = mode;
  return {
    root: `src/${appName}`,
    plugins: [react(), createEnvReplacerPlugin(env)],
    build: {
      outDir: resolve(__dirname, 'dist', appName),
    },
    define: {
      'process.env': env, // optional if you need `process.env`
    },
  };
});
