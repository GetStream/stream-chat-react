import { useEffect, useRef } from 'react';

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

  useEffect(() => {
    if (!t || !client) return;

    const dismissConnectionLostNotification = () => {
      if (!connectionLostNotificationIdRef.current) return;
      removeNotification(connectionLostNotificationIdRef.current);
      connectionLostNotificationIdRef.current = null;
    };

    const handleConnectionChanged = ({ online }: { online?: boolean }) => {
      if (!online) {
        if (connectionLostNotificationIdRef.current) return;

        connectionLostNotificationIdRef.current = addSystemNotification({
          duration: 0,
          emitter: 'Chat',
          message: t('Waiting for network…'),
          severity: 'loading',
          type: 'system:network:connection:lost',
        });
        return;
      }

      dismissConnectionLostNotification();
    };

    client.on('connection.changed', handleConnectionChanged);

    return () => {
      client.off('connection.changed', handleConnectionChanged);
      dismissConnectionLostNotification();
    };
  }, [addSystemNotification, client, removeNotification, t]);
};
