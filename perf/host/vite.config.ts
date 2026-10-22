import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Three builds, one per row of the protocol (stream-chat-perf-cli WEB-PLAN.md §5.3):
//   dev        `vite`                        React development build + StrictMode (the `dev` config)
//   production `vite build`                  what end users run (the `prod` config)
//   profiling  `vite build --mode profiling` React's profiling build, unminified; render counts only
//
// Deliberately no babel-plugin-react-compiler (examples/vite uses it): the compiler memoizes the
// host's components automatically, and the host must not change how often the SDK re-renders.
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  define: {
    __PERF_BUILD__: JSON.stringify(mode),
  },
  resolve: {
    // `stream-chat-react` is a workspace dependency served from outside this app's root, and the host
    // has its own node_modules (installConfig.hoistingLimits). Without deduping, the SDK and the host
    // would each load their own copy: two Reacts (every hook call throws), and two `stream-chat`s (the
    // host's ChannelPaginator and the SDK's client would come from different module instances).
    dedupe: ['react', 'react-dom', 'stream-chat', '@stream-io/state-store'],
    // React's documented way to get the profiling build: alias the client entry only.
    alias:
      mode === 'profiling'
        ? [{ find: /^react-dom\/client$/, replacement: 'react-dom/profiling' }]
        : [],
  },
  build: {
    // Source maps keep trace stacks and LoAF `sourceURL`s pointing at SDK files; they don't change
    // runtime cost.
    sourcemap: true,
    // The profiling build stays readable so component names survive in traces. Otherwise Vite's
    // default minifier (Oxc in Vite 8, which no longer ships esbuild).
    minify: mode !== 'profiling',
  },
}));
