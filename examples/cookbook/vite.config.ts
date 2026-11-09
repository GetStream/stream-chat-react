import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // `stream-chat-react` is consumed as a workspace dependency, so Vite serves
  // its built output from outside this app's root and resolves that copy's
  // `react` import separately from the app's. Without deduping, the SDK and the
  // app end up on two React instances and every hook call throws.
  resolve: {
    dedupe: ['react', 'react-dom'],
  },
});
