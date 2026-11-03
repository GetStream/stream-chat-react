import { useCallback } from 'react';
import { nsToDate, ScheduledMessageErrorReason } from 'stream-chat';
import type { ScheduledMessageResponse } from 'stream-chat';

import { useTranslationContext } from '../../../context';
import { useMessageComposerController } from '../../MessageComposer/hooks/useMessageComposerController';
import { useNotificationApi } from '../../Notifications';
import {
  SCHEDULE_MESSAGE_NOTIFICATION_EMITTER,
  ScheduledMessageNotificationType,
} from '../constants';
import { isScheduledMessageError } from '../utils';

export const useScheduleMessage = () => {
  const { t } = useTranslationContext();
  const { addNotification } = useNotificationApi();

  const messageComposer = useMessageComposerController();

  const notifyScheduled = useCallback(
    ({ scheduled_at }: ScheduledMessageResponse) => {
      const time = t('timestamp.ScheduledMessageConfirmation', {
        timestamp: nsToDate(scheduled_at),
      });

      addNotification({
        emitter: SCHEDULE_MESSAGE_NOTIFICATION_EMITTER,
        message: t(
          'scheduledMessages.messageScheduledForTime',
          'Message scheduled for {{ time }}',
          { time },
        ),
        severity: 'success',
        type: ScheduledMessageNotificationType.CreateSucceeded,
      });
    },
    [addNotification, t],
  );

  const scheduleMessage = useCallback(
    async (scheduledAt: Date) => {
      const result = await messageComposer.schedule(scheduledAt);
      const { error, scheduledMessage, status } = result;

      if (scheduledMessage) notifyScheduled(scheduledMessage);

      if (status === 'failed') {
        if (isScheduledMessageError(error, ScheduledMessageErrorReason.IdTaken)) {
          messageComposer.refreshId();
        }

        throw error;
      }

      return result;
    },
    [messageComposer, notifyScheduled],
  );

  return scheduleMessage;
};
