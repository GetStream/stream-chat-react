import type { NextConfig } from 'next';

/**
 * `installConfig.hoistingLimits: workspaces` installs this app's dependencies — `stream-chat` and
 * its `@stream-io/state-store` among them — in its own `node_modules`, while the linked
 * `stream-chat-react` workspace resolves the copies at the repository root. The SDK and the client
 * hand each other store instances, so the app must run exactly one copy of each: point every
 * import, the SDK's included, at the app's own.
 */
const singleCopyPackages = {
  '@stream-io/state-store': './node_modules/@stream-io/state-store',
  'stream-chat': './node_modules/stream-chat',
};

const nextConfig: NextConfig = {
  turbopack: {
    resolveAlias: singleCopyPackages,
  },
};

export default nextConfig;
