import { useCallback } from 'react';
import {
  CORE_NOTIFICATION_TYPE,
  getScheduledMessageErrorReason,
  ScheduledMessageErrorReason,
} from 'stream-chat';

import { useChatContext, useTranslationContext } from '../../../context';
import { useMessagePaginator } from '../../../hooks/useMessagePaginator';
import { useMessageComposerController } from '../../MessageComposer/hooks/useMessageComposerController';
import { useNotificationApi } from '../../Notifications';
import {
  SCHEDULED_MESSAGE_NOTIFICATION_TYPE,
  SCHEDULED_MESSAGES_EMITTER,
} from '../utils';

const SCHEDULING_FAILURE_NOTIFICATION_TYPES: ReadonlySet<string> = new Set([
  CORE_NOTIFICATION_TYPE.scheduledMessageBlocked,
  CORE_NOTIFICATION_TYPE.scheduledMessageCreateFailed,
]);

export const useScheduleComposition = () => {
  const { t } = useTranslationContext();
  const { client } = useChatContext();
  const { addNotification } = useNotificationApi();
  const messageComposer = useMessageComposerController();
  const messagePaginator = useMessagePaginator();

  const scheduleMessage = useCallback(
    async (scheduledAt: Date) => {
      const messageId = messageComposer.id;
      const { error, status } = await messageComposer.scheduleMessage(scheduledAt);
      if (status === 'sent') {
        addNotification({
          actions: [
            {
              handler: () => {
                void messagePaginator.jumpToMessage(messageId);
              },
              label: t('scheduledMessages.view', 'View'),
            },
          ],
          emitter: SCHEDULED_MESSAGES_EMITTER,
          message: t('scheduledMessages.scheduledMessageSent', 'Scheduled message sent'),
          severity: 'success',
          type: SCHEDULED_MESSAGE_NOTIFICATION_TYPE.sentNow,
        });
        return;
      }
      if (status === 'scheduled') return;
      if (getScheduledMessageErrorReason(error) === ScheduledMessageErrorReason.IdTaken) {
        messageComposer.refreshId();
      }
      throw error ?? new Error(`Message not scheduled: ${status}`);
    },
    [addNotification, messageComposer, messagePaginator, t],
  );

  const scheduleMessageFromDialog = useCallback(
    async (scheduledAt: Date) => {
      const { notifications } = client;
      const shownBefore = new Set(notifications.notifications.map(({ id }) => id));
      try {
        await scheduleMessage(scheduledAt);
      } catch (error) {
        notifications.notifications
          .filter(
            ({ id, origin, type }) =>
              !shownBefore.has(id) &&
              origin.context?.composer === messageComposer &&
              !!type &&
              SCHEDULING_FAILURE_NOTIFICATION_TYPES.has(type),
          )
          .forEach(({ id }) => notifications.remove(id));
        throw error;
      }
    },
    [client, messageComposer, scheduleMessage],
  );

  const scheduleComposition = { scheduleMessage, scheduleMessageFromDialog };
  return scheduleComposition;
};
