import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The gallery renders the built package (`yarn build` at the root first), as an app would.
export default defineConfig({
  plugins: [react()],
  resolve: { dedupe: ['react', 'react-dom', '@a2ui/web_core', '@a2ui/react'] },
});
