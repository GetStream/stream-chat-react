import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react-swc';

// https://vitejs.dev/config/
export default defineConfig(() => {
  const rootDir = process.cwd();

  // Load shared .env file
  const env = loadEnv('', rootDir, '');
  return {
    plugins: [react()],
    define: {
      'process.env': env, // need `process.env` access
    },
  };
});
