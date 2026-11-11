import { useEffect } from 'react';
import type { StreamChat } from 'stream-chat';

import {
  SCHEDULED_MESSAGES_EMITTER,
  ScheduledMessageNotificationType,
} from '../../ScheduledMessages/constants';

export const useScheduledMessageFailureNotifications = (client: StreamChat) => {
  useEffect(() => {
    const subscription = client.on('scheduled_message.failed', (event) => {
      const { scheduled_message: scheduledMessage } = event;

      if (!scheduledMessage) return;

      const { failure_reason: reason, id } = scheduledMessage;

      client.notifications.addError({
        message: 'Scheduled message not sent',
        options: {
          metadata: { reason, scheduledMessageId: id },
          type: ScheduledMessageNotificationType.SendFailed,
        },
        origin: { emitter: SCHEDULED_MESSAGES_EMITTER },
      });
    });

    return subscription.unsubscribe;
  }, [client]);
};
