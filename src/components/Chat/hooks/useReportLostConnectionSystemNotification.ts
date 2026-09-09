import { useCallback, useEffect, useRef } from 'react';
import type { EventPayload } from 'stream-chat';

import { useChatContext } from '../../../context/ChatContext';
import { useTranslationContext } from '../../../context/TranslationContext';
import { useNotificationApi } from '../../Notifications/hooks/useNotificationApi';

/**
 * Publishes a persistent system notification while the client is offline and removes it when
 * back online. Must run under `ChatProvider` and `TranslationProvider` (e.g. from a child of `<Chat>`).
 */
export const useReportLostConnectionSystemNotification = () => {
  const { t } = useTranslationContext();
  const { client } = useChatContext();
  const { addSystemNotification, removeNotification } = useNotificationApi();
  const connectionLostNotificationIdRef = useRef<string | null>(null);

  const dismissConnectionLostNotification = useCallback(() => {
    if (!connectionLostNotificationIdRef.current) return;
    removeNotification(connectionLostNotificationIdRef.current);
    connectionLostNotificationIdRef.current = null;
  }, [removeNotification]);

  /**
   * Dismissal is scoped to the mount, not to the subscription below.
   *
   * The subscription's dependencies change for reasons that have nothing to do with the connection —
   * `t` is replaced when `Streami18n.init()` resolves, asynchronously. When dismissal was part of
   * that effect's cleanup, a socket dropping before init finished had its notification published and
   * then immediately removed, leaving no banner on an offline app launch or behind a captive portal.
   */
  useEffect(() => dismissConnectionLostNotification, [dismissConnectionLostNotification]);

  useEffect(() => {
    if (!t || !client) return;

    const handleConnectionChanged = ({
      connection,
      online,
    }: EventPayload<'connection.changed'>) => {
      // Narrowed to the socket, which is what this hook has always reported — the notification type
      // says `network`, but the fact behind it is the WebSocket. Now that the event also arrives for
      // the device's network, the guard is what keeps that unchanged rather than silently doubling.
      // Whether a lost *network* deserves its own notification is a separate question.
      if (connection !== 'ws') return;

      if (!online) {
        if (connectionLostNotificationIdRef.current) return;

        connectionLostNotificationIdRef.current = addSystemNotification({
          duration: 0,
          emitter: 'Chat',
          message: t(
            'chat.reportLostConnection.waitingNetwork.text',
            'Waiting for network…',
          ),
          severity: 'loading',
          type: 'system:network:connection:lost',
        });
        return;
      }

      dismissConnectionLostNotification();
    };

    const subscription = client.on('connection.changed', handleConnectionChanged);

    return subscription.unsubscribe;
  }, [addSystemNotification, client, dismissConnectionLostNotification, t]);
};
