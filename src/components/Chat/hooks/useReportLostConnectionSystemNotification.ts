import { useCallback, useEffect, useRef } from 'react';
import type { ConnectionType } from 'stream-chat';

import { useChatContext } from '../../../context/ChatContext';
import { useTranslationContext } from '../../../context/TranslationContext';
import { useNotificationApi } from '../../Notifications/hooks/useNotificationApi';

/**
 * Publishes a persistent system notification while this client cannot reach Stream, and removes it
 * when it can again. Must run under `ChatProvider` and `TranslationProvider` (e.g. from a child of
 * `<Chat>`).
 *
 * **Two facts, two messages.** The device losing its network and this client's WebSocket dying are
 * different things, and they disagree in both directions — a socket dies on working Wi-Fi when the
 * server closes it, the token expires or a health check times out. This hook used to publish
 * "Waiting for network…" off the socket alone, so it told users their network was down when it was
 * fine. It now reads both and picks the wording:
 *
 * - the device reports no network → the network message
 * - the network is up (or unknown) and the socket is down → the reconnecting message
 *
 * Choosing that grouping is a copy decision rather than a fact about connectivity, which is why the
 * SDK publishes no combined status and why the decision is made here, in the component that renders
 * the copy.
 *
 * Both signals are subscribed **imperatively** rather than through the `useNetworkConnectionState` /
 * `useWSConnectionState` hooks: `<Chat>` calls this, and re-rendering the whole tree on every network
 * flap is exactly what those hooks exist to let consumers avoid.
 *
 * **A drop is held before it is shown.** The socket retries on its own and most drops resolve in well
 * under a second, so announcing them immediately makes a working application look broken. A drop is
 * therefore held for `client.wsConnection.config.offlineNotificationDisplayDelayMs` and dropped
 * entirely if the socket returns inside that window. The client used to do this before publishing the
 * status; it now publishes every transition as it happens, and the waiting is done here — with the
 * length of the wait left in configuration so an integrator can change it without replacing this
 * hook, and so React Native does not pick a different number. The device's network is not held back:
 * a browser reports that accurately, and it does not flap the way a socket does.
 */
export const useReportLostConnectionSystemNotification = () => {
  const { t } = useTranslationContext();
  const { client } = useChatContext();
  const { addSystemNotification, removeNotification } = useNotificationApi();
  const notificationIdRef = useRef<string | null>(null);
  /** Outside the effect, so re-establishing the subscriptions does not republish what is showing. */
  const reasonRef = useRef<ConnectionType | null>(null);
  /**
   * The socket's status as last *shown*, which is not the same as `client.wsConnection.state`: a drop
   * the store has already published may still be inside its holding window here.
   *
   * It lives outside the effect because the effect re-runs for unrelated reasons (`t` is replaced
   * when `Streami18n.init()` resolves) and the store cannot be used to re-seed it, which would
   * discard a drop still being held. Seeded from the store once, on mount, because an application
   * that starts up with no connection should say so immediately rather than after the window.
   */
  const socketOnlineRef = useRef<boolean | null>(null);
  /** The drop being held, so the socket returning can cancel it. */
  const heldDropRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelHeldDrop = useCallback(() => {
    if (heldDropRef.current === null) return;
    clearTimeout(heldDropRef.current);
    heldDropRef.current = null;
  }, []);

  const dismissConnectionLostNotification = useCallback(() => {
    if (!notificationIdRef.current) return;
    removeNotification(notificationIdRef.current);
    notificationIdRef.current = null;
    reasonRef.current = null;
  }, [removeNotification]);

  /**
   * Dismissal is scoped to the mount, not to the subscriptions below.
   *
   * Their dependencies change for reasons that have nothing to do with the connection — `t` is
   * replaced when `Streami18n.init()` resolves, asynchronously. When dismissal was part of that
   * effect's cleanup, a socket dropping before init finished had its notification published and then
   * immediately removed, leaving no banner on an offline app launch or behind a captive portal.
   */
  useEffect(
    () => () => {
      cancelHeldDrop();
      dismissConnectionLostNotification();
    },
    [cancelHeldDrop, dismissConnectionLostNotification],
  );

  useEffect(() => {
    if (!t || !client) return;

    // Keyed by `ConnectionType` rather than a local union, so a connection type added to the client
    // breaks `yarn build` here (`tsconfig.lib.json`) until someone decides what the banner should say
    // about it. Verified by widening the type: `Property 'sse' is missing`. Note `yarn types` does
    // *not* catch it — without `strictNullChecks` the absent key is `undefined`, which is assignable
    // to `string`.
    const messages: Record<ConnectionType, string> = {
      network: t('chat.reportLostConnection.waitingNetwork.text', 'Waiting for network…'),
      ws: t('chat.reportLostConnection.reconnecting.text', 'Reconnecting…'),
    };

    const show = (reason: ConnectionType) => {
      if (reasonRef.current === reason) return;
      // Replaced rather than left alone: a network drop while "Reconnecting…" is showing needs the
      // more specific message.
      dismissConnectionLostNotification();
      reasonRef.current = reason;
      notificationIdRef.current = addSystemNotification({
        duration: 0,
        emitter: 'Chat',
        message: messages[reason],
        severity: 'loading',
        // One type for both messages, deliberately. Consumers filter banners on it — the SDK's own
        // cookbook recipe does — so splitting it would silently stop those filters seeing the socket
        // case. The `network` in the name is historical; the message is what was wrong.
        type: 'system:network:connection:lost',
      });
    };

    if (socketOnlineRef.current === null) {
      socketOnlineRef.current = client.wsConnection.isOnline;
    }

    // `=== false` for the network, never `!networkOnline`: `undefined` means nobody has told us, and
    // on a host whose reporter cannot answer that must not read as offline. The socket's is a plain
    // boolean.
    let networkOnline = client.networkConnection.isOnline;

    const sync = () => {
      if (networkOnline === false) return show('network');
      if (!socketOnlineRef.current) return show('ws');
      dismissConnectionLostNotification();
    };

    const unsubscribeNetwork = client.networkConnection.state.subscribeWithSelector(
      ({ isOnline }) => ({ isOnline }),
      ({ isOnline }) => {
        networkOnline = isOnline;
        sync();
      },
    );

    // `subscribeWithSelector` calls back immediately with the current value. That call is the seed
    // above rather than a transition, and holding it would delay the banner on an application that
    // starts up with no connection.
    let seeded = false;

    const unsubscribeSocket = client.wsConnection.state.subscribeWithSelector(
      ({ isOnline }) => ({ isOnline }),
      ({ isOnline }) => {
        if (!seeded) {
          seeded = true;
          return;
        }

        if (isOnline) {
          // Coming back is not held: there is no reason to sit on good news, and a drop still inside
          // its window is cancelled rather than shown, so a brief flap produces nothing at all.
          cancelHeldDrop();
          socketOnlineRef.current = true;
          sync();
          return;
        }

        // Already holding one. A second drop without an intervening recovery cannot happen, but a
        // re-subscription during the window can, and restarting the timer would extend the wait.
        if (heldDropRef.current !== null) return;

        heldDropRef.current = setTimeout(() => {
          heldDropRef.current = null;
          socketOnlineRef.current = false;
          sync();
          // Read when the drop happens rather than captured, so a change to it reaches the next
          // drop without this effect being re-established.
        }, client.wsConnection.config.offlineNotificationDisplayDelayMs);
      },
    );

    // Read the current state rather than waiting for a transition — a client already offline when
    // this mounts showed nothing at all before.
    sync();

    return () => {
      unsubscribeNetwork();
      unsubscribeSocket();
    };
  }, [
    addSystemNotification,
    cancelHeldDrop,
    client,
    dismissConnectionLostNotification,
    t,
  ]);
};
