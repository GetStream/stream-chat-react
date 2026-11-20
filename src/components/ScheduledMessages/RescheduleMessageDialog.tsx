import { nsToDate } from 'stream-chat';
import React, { useCallback, useMemo } from 'react';

import { useChatContext, useTranslationContext } from '../../context';
import { useNotificationApi } from '../Notifications';
import {
  SCHEDULED_MESSAGE_ACTIONS_EMITTER,
  ScheduledMessageNotificationType,
} from './constants';
import { ScheduleTimeDialog } from './ScheduleTimeDialog';
import type { RescheduleMessageDialogProps } from './types';
import {
  getScheduledMessageChannel,
  reloadOnScheduledMessageConflict,
  toStoredScheduledMessagePreview,
} from './utils';

export const RescheduleMessageDialog = ({
  close,
  scheduledMessage,
}: RescheduleMessageDialogProps) => {
  const { t } = useTranslationContext();
  const { client } = useChatContext();
  const { addNotification } = useNotificationApi();

  const { id, scheduled_at } = scheduledMessage;

  const channel = useMemo(
    () => getScheduledMessageChannel(client, scheduledMessage),
    [client, scheduledMessage],
  );
  const previewMessage = useMemo(
    () => toStoredScheduledMessagePreview(scheduledMessage),
    [scheduledMessage],
  );
  const initialScheduledAt = nsToDate(scheduled_at);
  const errorMessage = t(
    'scheduledMessages.couldntRescheduleTheMessageTryAgain',
    "Couldn't reschedule the message. Try again",
  );
  const scheduledTime = t('timestamp.ScheduledMessageSendTime', {
    timestamp: initialScheduledAt,
  });

  const reschedule = useCallback(
    async (scheduledAt: Date) => {
      try {
        await channel.updateScheduledMessage(id, {
          scheduled_at: scheduledAt,
        });
      } catch (error) {
        reloadOnScheduledMessageConflict(channel.scheduledMessagesPaginator, error);
        addNotification({
          emitter: SCHEDULED_MESSAGE_ACTIONS_EMITTER,
          error: error as Error,
          message: errorMessage,
          severity: 'error',
          type: ScheduledMessageNotificationType.RescheduleFailed,
        });

        throw error;
      }
    },
    [addNotification, channel, errorMessage, id],
  );

  return (
    <ScheduleTimeDialog
      channel={channel}
      close={close}
      errorMessage={errorMessage}
      initialScheduledAt={initialScheduledAt}
      previewLabel={t('scheduledMessages.scheduledForTime', 'Scheduled for {{ time }}', {
        time: scheduledTime,
      })}
      previewMessage={previewMessage}
      submit={reschedule}
      submitLabel={t('scheduledMessages.save', 'Save')}
      title={t('scheduledMessages.rescheduleMessage', 'Reschedule message')}
    />
  );
};
