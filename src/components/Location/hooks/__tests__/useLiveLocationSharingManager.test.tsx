import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getTestClientWithUser } from '../../../../mock-builders';
import { useLiveLocationSharingManager } from '../useLiveLocationSharingManager';

import type { StreamChat } from 'stream-chat';

// The cleanup has to run both teardowns (`unregisterSubscriptions` for the WebSocket subscriptions,
// `dispose` for the configuration subscription) and stay correct under StrictMode, which runs
// mount -> cleanup -> mount against one memoized instance, and while the load of the active live
// locations is still pending.

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

    // The cleanup's `dispose` already fired once against the instance still in use; the second
    // mount's `init` restores the subscription.
    await waitFor(() => expect(manager.hasSubscriptions).toBe(true));

    client.config.set({ liveLocationManager: { minUpdateThrottleMs: 7000 } });

    expect(manager.config.minUpdateThrottleMs).toBe(7000);
  });

  describe('while the active live locations load', () => {
    beforeEach(() => {
      vi.spyOn(client, 'getUserLiveLocations').mockReturnValue(new Promise(() => null));
    });

    it('leaves no subscriptions when unmounted before the load resolves', () => {
      const { result, unmount } = renderHook(() =>
        useLiveLocationSharingManager({ client, watchLocation }),
      );
      const manager = result.current!;
      expect(manager.hasSubscriptions).toBe(true);

      unmount();

      expect(manager.hasSubscriptions).toBe(false);
    });

    it('registers once under StrictMode and leaves no subscriptions on unmount', () => {
      const { result, unmount } = renderHook(
        () => useLiveLocationSharingManager({ client, watchLocation }),
        { reactStrictMode: true },
      );
      const manager = result.current!;
      expect(manager.hasSubscriptions).toBe(true);

      unmount();

      expect(manager.hasSubscriptions).toBe(false);
    });
  });

  it('keeps the subscriptions when the load of the active live locations fails', async () => {
    const error = new Error('location sharing is not enabled for this app');
    vi.spyOn(client, 'getUserLiveLocations').mockRejectedValue(error);
    const { result, unmount } = renderHook(() =>
      useLiveLocationSharingManager({ client, watchLocation }),
    );
    const manager = result.current!;

    await waitFor(() =>
      expect(manager.state.getLatestValue().lastQueryError).toBe(error),
    );
    expect(manager.hasSubscriptions).toBe(true);

    unmount();

    expect(manager.hasSubscriptions).toBe(false);
  });
});
