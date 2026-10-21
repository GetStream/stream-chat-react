import { useCallback, useEffect, useRef } from 'react';
import type { ConnectionType } from 'stream-chat';

import { useChatContext } from '../../../context/ChatContext';
import { useTranslationContext } from '../../../context/TranslationContext';
import { useNotificationApi } from '../../Notifications/hooks/useNotificationApi';

/**
 * Publishes a persistent system notification while the client cannot reach Stream, and removes it
 * when it can again. Must run under `ChatProvider` and `TranslationProvider`, e.g. from a child of
 * `<Chat>`.
 *
 * The device network and the WebSocket are read separately because either can fail alone. A network
 * report of no connection shows the network message; otherwise a down socket shows the reconnecting
 * message. Both stores are subscribed imperatively so a network flap does not re-render the caller.
 *
 * A socket drop is held for `client.wsConnection.config.offlineNotificationDisplayDelayMs` and
 * cancelled if the socket returns inside that window, since most drops resolve quickly. A network
 * drop is shown immediately.
 */
export const useReportLostConnectionSystemNotification = () => {
  const { t } = useTranslationContext();
  const { client } = useChatContext();
  const { addSystemNotification, removeNotification } = useNotificationApi();
  const notificationIdRef = useRef<string | null>(null);
  /** The reason being shown. A ref so re-subscribing does not republish what is showing. */
  const reasonRef = useRef<ConnectionType | null>(null);
  /**
   * The socket status as last shown, which can differ from `client.wsConnection.state` while a drop
   * is held. A ref because the effect re-runs when `t` is replaced and re-seeding would discard the
   * held drop. Seeded once on mount, so an app that starts offline shows the banner immediately.
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

  // Dismissal is scoped to the mount, not to the subscriptions below. Their dependencies change for
  // unrelated reasons (`t` is replaced when `Streami18n.init()` resolves), and dismissing in that
  // cleanup would remove a notification published before init finished.
  useEffect(
    () => () => {
      cancelHeldDrop();
      dismissConnectionLostNotification();
    },
    [cancelHeldDrop, dismissConnectionLostNotification],
  );

  useEffect(() => {
    if (!t || !client) return;

    // Keyed by `ConnectionType`, so a connection type added to the client fails type checking here
    // until its message is decided.
    const messages: Record<ConnectionType, string> = {
      network: t('chat.reportLostConnection.waitingNetwork.text', 'Waiting for network…'),
      ws: t('chat.reportLostConnection.reconnecting.text', 'Reconnecting…'),
    };

    const show = (reason: ConnectionType) => {
      if (reasonRef.current === reason) return;
      // A network drop while "Reconnecting…" is showing replaces it with the more specific message.
      dismissConnectionLostNotification();
      reasonRef.current = reason;
      notificationIdRef.current = addSystemNotification({
        duration: 0,
        emitter: 'Chat',
        message: messages[reason],
        severity: 'loading',
        // One type for both messages: consumers filter banners on it, and a second type would hide
        // the socket case from those filters.
        type: 'system:network:connection:lost',
      });
    };

    if (socketOnlineRef.current === null) {
      socketOnlineRef.current = client.wsConnection.isHealthy;
    }

    // `=== false`, not `!networkOnline`: `undefined` means unknown and must not read as offline.
    // The socket's value is a plain boolean.
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

    // `subscribeWithSelector` calls back immediately with the current value. That call is the
    // seed above, not a transition, and holding it would delay the banner for an app that starts
    // offline.
    let seeded = false;

    const unsubscribeSocket = client.wsConnection.state.subscribeWithSelector(
      ({ isHealthy }) => ({ isHealthy }),
      ({ isHealthy }) => {
        if (!seeded) {
          seeded = true;
          return;
        }

        if (isHealthy) {
          // Recovery is not held. A drop still inside its window is cancelled, so a brief flap
          // shows nothing.
          cancelHeldDrop();
          socketOnlineRef.current = true;
          sync();
          return;
        }

        // A re-subscription during the window can reach here, and restarting the timer would extend
        // the wait.
        if (heldDropRef.current !== null) return;

        // The delay is read per drop, so a changed value applies to the next drop without
        // re-running the effect.
        heldDropRef.current = setTimeout(() => {
          heldDropRef.current = null;
          socketOnlineRef.current = false;
          sync();
        }, client.wsConnection.config.offlineNotificationDisplayDelayMs);
      },
    );

    // Reflects the current state now rather than waiting for a transition, so a client that is
    // already offline on mount shows the banner.
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
