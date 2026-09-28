import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getTestClientWithUser } from '../../../../mock-builders';
import { useLiveLocationSharingManager } from '../useLiveLocationSharingManager';

import type { StreamChat } from 'stream-chat';

/**
 * The manager has two teardowns with different lifetimes: `unregisterSubscriptions` is ref-counted and
 * releases the WS subscriptions, `dispose` releases the configuration subscription that the client's
 * configuration registry holds a handle to. The cleanup here has to run both, and has to stay correct
 * under StrictMode, which runs mount -> cleanup -> mount against one memoized instance.
 */
describe('useLiveLocationSharingManager', () => {
  let client: StreamChat;

  beforeEach(async () => {
    client = await getTestClientWithUser({ id: 'location-user' });
    vi.spyOn(client, 'getUserLiveLocations').mockResolvedValue({
      active_live_locations: [],
      duration: '',
    } as never);
  });

  const watchLocation = () => () => undefined;

  it('disposes the configuration subscription on unmount', async () => {
    const { result, unmount } = renderHook(() =>
      useLiveLocationSharingManager({ client, watchLocation }),
    );
    const manager = result.current!;
    await waitFor(() => expect(manager.hasSubscriptions).toBe(true));

    unmount();

    client.config.set({ liveLocationManager: { minUpdateThrottleMs: 7000 } });

    expect(manager.config.minUpdateThrottleMs).not.toBe(7000);
    expect(manager.hasSubscriptions).toBe(false);
  });

  it('keeps the manager configurable across a StrictMode remount', async () => {
    const { result } = renderHook(
      () => useLiveLocationSharingManager({ client, watchLocation }),
      { reactStrictMode: true },
    );
    const manager = result.current!;

    // StrictMode has already run mount -> cleanup -> mount, so the cleanup's `dispose` has fired once
    // against the instance still in use. `init` restores the subscription, but it awaits
    // `assureStateInit` first, so the recovery lands a microtask later than the render.
    await waitFor(() => expect(manager.hasSubscriptions).toBe(true));

    client.config.set({ liveLocationManager: { minUpdateThrottleMs: 7000 } });

    expect(manager.config.minUpdateThrottleMs).toBe(7000);
  });
});
