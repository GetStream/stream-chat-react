import { useCallback } from 'react';
import { ScheduledMessageErrorReason } from 'stream-chat';
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
      const time = t('timestamp/ScheduledMessage', { timestamp: new Date(scheduled_at) });

      addNotification({
        emitter: SCHEDULE_MESSAGE_NOTIFICATION_EMITTER,
        message: t('Scheduled for {{ time }}', { time }),
        severity: 'success',
        type: ScheduledMessageNotificationType.CreateSucceeded,
      });
    },
    [addNotification, t],
  );

  const scheduleMessage = useCallback(
    async (scheduledAt: Date) => {
      try {
        const scheduledMessage = await messageComposer.schedule(scheduledAt);

        if (scheduledMessage) notifyScheduled(scheduledMessage);

        return scheduledMessage;
      } catch (error) {
        if (isScheduledMessageError(error, ScheduledMessageErrorReason.IdTaken)) {
          messageComposer.refreshId();
        }

        throw error;
      }
    },
    [messageComposer, notifyScheduled],
  );

  return scheduleMessage;
};
