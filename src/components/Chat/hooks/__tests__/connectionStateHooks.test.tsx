import React from 'react';
import { act, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { NetworkStatusListenerRegistrar, StreamChat } from 'stream-chat';

import { Chat } from '../../Chat';
import { useNetworkConnectionState } from '../useNetworkConnectionState';
import { useNetworkConnectionStateSelector } from '../useNetworkConnectionState';
import { useWSConnectionState } from '../useWSConnectionState';
import { getTestClientWithUser } from '../../../../mock-builders';

/** An integrator's registration function, of the shape a platform API would be wrapped in. */
const platformListener = () => {
  let report: ((isOnline: boolean) => void) | undefined;
  const registrar: NetworkStatusListenerRegistrar = (onStatusChange) => {
    report = onStatusChange;
    return vi.fn();
  };
  return {
    registrar,
    report: (isOnline: boolean) => {
      if (!report) throw new Error('the registrar was never installed');
      act(() => report?.(isOnline));
    },
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
      // Worth stating explicitly: the SDK installs its built-in browser registrar whenever
      // `window.addEventListener` exists and `navigator.onLine` is a boolean — which is true in
      // jsdom. So a React test starts with a *known* status, not an unknown one, and the
      // `undefined` case has to be arranged deliberately (see the next test).
      const client = await getTestClientWithUser({ id: 'me' });
      const Consumer = () => {
        const state = useNetworkConnectionState();
        return <div data-testid='v'>{String(state?.isOnline)}</div>;
      };

      renderUnderChat(client, <Consumer />);

      expect(screen.getByTestId('v')).toHaveTextContent('true');
    });

    it('surfaces isOnline === undefined as-is where no registrar can be installed', async () => {
      // The React Native shape: `navigator` has no boolean `onLine`, so no default registrar is
      // installed and the status stays unknown. Stubbed before the client is constructed, because
      // the registrar installs and reports during construction.
      vi.stubGlobal('navigator', { userAgent: 'ReactNative' });
      const client = await getTestClientWithUser({ id: 'me' });
      const Consumer = () => {
        const state = useNetworkConnectionState();
        return <div data-testid='v'>{JSON.stringify(state?.isOnline ?? 'unknown')}</div>;
      };

      renderUnderChat(client, <Consumer />);

      // Not coerced to false, and nothing crashed on the absent value.
      expect(screen.getByTestId('v')).toHaveTextContent('"unknown"');
      vi.unstubAllGlobals();
    });

    it('re-renders when the registrar reports a change', async () => {
      const client = await getTestClientWithUser({ id: 'me' });
      const platform = platformListener();
      client.config.set({
        client: { networkConnection: { statusListenerRegistrar: platform.registrar } },
      });
      const Consumer = () => {
        const state = useNetworkConnectionState();
        return <div data-testid='v'>{String(state?.isOnline)}</div>;
      };

      renderUnderChat(client, <Consumer />);
      // Replacing the registrar does not reset the last known status — an edge is not a state — so
      // this starts from what the browser registrar already reported.
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
        client: { networkConnection: { statusListenerRegistrar: platform.registrar } },
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

      // `false` is a real change from the browser registrar's initial `true`.
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
      // If these two are not distinguishable, the feature has not delivered its point.
      const client = await getTestClientWithUser({ id: 'me' });
      const platform = platformListener();
      client.config.set({
        client: { networkConnection: { statusListenerRegistrar: platform.registrar } },
      });
      const Consumer = () => {
        // Aliased deliberately: both stores expose `isOnline`, so a blind destructure of both
        // would shadow one with the other.
        const { isOnline: networkOnline } = useNetworkConnectionState() ?? {};
        const { isOnline: socketOnline } = useWSConnectionState() ?? {};
        return (
          <div data-testid='v'>{`network=${String(networkOnline)} socket=${String(socketOnline)}`}</div>
        );
      };

      renderUnderChat(client, <Consumer />);
      // The mock client marks the socket up, so this is the interesting asymmetry: a device with no
      // network while the socket still believes it is fine.
      platform.report(false);
      expect(screen.getByTestId('v')).toHaveTextContent('network=false socket=true');

      // And the reverse: network fine, socket down.
      platform.report(true);
      act(() => {
        client.wsConnection.state.partialNext({ isOnline: false });
      });
      expect(screen.getByTestId('v')).toHaveTextContent('network=true socket=false');
    });
  });

  describe('useWSConnectionState', () => {
    it('reports the socket and its connection id', async () => {
      const client = await getTestClientWithUser({ id: 'me' });
      const Consumer = () => {
        const state = useWSConnectionState();
        return (
          <div data-testid='v'>{`${String(state?.isOnline)}/${String(state?.connectionId)}`}</div>
        );
      };

      renderUnderChat(client, <Consumer />);

      expect(screen.getByTestId('v')).toHaveTextContent('true/dummy_connection_id');
    });
  });
});
