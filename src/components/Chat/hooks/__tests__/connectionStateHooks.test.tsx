import React from 'react';
import { act, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { NetworkStatusReporter, StreamChat } from 'stream-chat';

import { Chat } from '../../Chat';
import { useNetworkConnectionState } from '../useNetworkConnectionState';
import { useNetworkConnectionStateSelector } from '../useNetworkConnectionState';
import { useWSConnectionState } from '../useWSConnectionState';
import {
  getTestClient,
  getTestClientWithUser,
  setWSConnectionStatus,
} from '../../../../mock-builders';

/** A fake platform listener: `report` pushes a status through the installed reporter. */
const platformListener = () => {
  let report: ((isOnline: boolean) => void) | undefined;
  const reporter: NetworkStatusReporter = (onStatusChange) => {
    report = onStatusChange;
    return vi.fn();
  };
  return {
    report: (isOnline: boolean) => {
      if (!report) throw new Error('the reporter was never installed');
      act(() => report?.(isOnline));
    },
    reporter,
  };
};

const renderUnderChat = (client: StreamChat, ui: React.ReactNode) =>
  render(<Chat client={client}>{ui}</Chat>);

describe('connection state hooks', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('useNetworkConnectionState', () => {
    it('starts online in jsdom, because jsdom is a browser', async () => {
      // The SDK installs its built-in browser reporter when `window.addEventListener` exists and
      // `navigator.onLine` is a boolean, as in jsdom. The status starts known, so the `undefined`
      // case needs the setup of the next test.
      const client = await getTestClientWithUser({ id: 'me' });
      const Consumer = () => {
        const state = useNetworkConnectionState();
        return <div data-testid='v'>{String(state?.isOnline)}</div>;
      };

      renderUnderChat(client, <Consumer />);

      expect(screen.getByTestId('v')).toHaveTextContent('true');
    });

    it('surfaces isOnline === undefined as-is until something has reported', () => {
      // React Native: `navigator` has no boolean `onLine`, so the browser reporter is not installed
      // and the socket-derived stand-in takes over. It reports nothing until the socket has been up
      // once, so a client that never connected stays unknown. Stubbed before the client is
      // constructed because a reporter installs and reports during construction.
      vi.stubGlobal('navigator', { userAgent: 'ReactNative' });
      const client = getTestClient();
      const Consumer = () => {
        const state = useNetworkConnectionState();
        return <div data-testid='v'>{JSON.stringify(state?.isOnline ?? 'unknown')}</div>;
      };

      renderUnderChat(client, <Consumer />);

      // Not coerced to false.
      expect(screen.getByTestId('v')).toHaveTextContent('"unknown"');
      vi.unstubAllGlobals();
    });

    it('follows the socket where no platform reporter can be installed', async () => {
      // Without a platform reporter the stand-in follows the socket. The two facts cannot disagree
      // under it, which is why a real reporter is still worth installing.
      vi.stubGlobal('navigator', { userAgent: 'ReactNative' });
      const client = await getTestClientWithUser({ id: 'me' });
      const Consumer = () => {
        const state = useNetworkConnectionState();
        return <div data-testid='v'>{String(state?.isOnline)}</div>;
      };

      renderUnderChat(client, <Consumer />);

      // The fixture marks the socket up, and the stand-in reports that as the device's status.
      expect(screen.getByTestId('v')).toHaveTextContent('true');

      act(() => setWSConnectionStatus(client, false));

      expect(screen.getByTestId('v')).toHaveTextContent('false');
      vi.unstubAllGlobals();
    });

    it('re-renders when the reporter reports a change', async () => {
      const client = await getTestClientWithUser({ id: 'me' });
      const platform = platformListener();
      client.config.set({
        client: { networkConnection: { statusReporter: platform.reporter } },
      });
      const Consumer = () => {
        const state = useNetworkConnectionState();
        return <div data-testid='v'>{String(state?.isOnline)}</div>;
      };

      renderUnderChat(client, <Consumer />);
      // Replacing the reporter does not reset the last known status, so this starts from what the
      // browser reporter reported.
      expect(screen.getByTestId('v')).toHaveTextContent('true');

      platform.report(false);
      expect(screen.getByTestId('v')).toHaveTextContent('false');

      platform.report(true);
      expect(screen.getByTestId('v')).toHaveTextContent('true');
    });
  });

  describe('useNetworkConnectionStateSelector', () => {
    it('does not re-render when an unselected field changes', async () => {
      const client = await getTestClientWithUser({ id: 'me' });
      const platform = platformListener();
      client.config.set({
        client: { networkConnection: { statusReporter: platform.reporter } },
      });
      const renders = vi.fn();
      const Consumer = () => {
        // `lastOnlineAt` and `lastOfflineAt` also change on every report; this selects neither.
        const selected = useNetworkConnectionStateSelector(({ isOnline }) => ({
          isOnline,
        }));
        renders();
        return <div data-testid='v'>{String(selected?.isOnline)}</div>;
      };

      renderUnderChat(client, <Consumer />);
      const initial = renders.mock.calls.length;

      // `false` is a real change from the browser reporter's initial `true`.
      platform.report(false);
      expect(renders.mock.calls.length).toBeGreaterThan(initial);
      const afterChange = renders.mock.calls.length;

      // A repeat of the same status is ignored by the observer, so nothing re-renders.
      platform.report(false);
      expect(renders.mock.calls.length).toBe(afterChange);
    });
  });

  describe('the two hooks together', () => {
    it('distinguishes network-up/socket-down from network-down/socket-up', async () => {
      const client = await getTestClientWithUser({ id: 'me' });
      const platform = platformListener();
      client.config.set({
        client: { networkConnection: { statusReporter: platform.reporter } },
      });
      const Consumer = () => {
        const { isOnline: networkOnline } = useNetworkConnectionState() ?? {};
        const { isHealthy: socketOnline } = useWSConnectionState() ?? {};
        return (
          <div data-testid='v'>{`network=${String(networkOnline)} socket=${String(socketOnline)}`}</div>
        );
      };

      renderUnderChat(client, <Consumer />);
      // The mock client marks the socket up, so this is a device with no network while the socket
      // still believes it is fine.
      platform.report(false);
      expect(screen.getByTestId('v')).toHaveTextContent('network=false socket=true');

      // The reverse: network up, socket down.
      platform.report(true);
      act(() => {
        client.wsConnection.state.partialNext({ isHealthy: false });
      });
      expect(screen.getByTestId('v')).toHaveTextContent('network=true socket=false');
    });
  });

  describe('useWSConnectionState', () => {
    it('reports the socket status', async () => {
      const client = await getTestClientWithUser({ id: 'me' });
      const Consumer = () => {
        const state = useWSConnectionState();
        return <div data-testid='v'>{String(state?.isHealthy)}</div>;
      };

      renderUnderChat(client, <Consumer />);

      expect(screen.getByTestId('v')).toHaveTextContent('true');
    });
  });
});
