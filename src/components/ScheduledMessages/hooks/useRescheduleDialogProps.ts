import { nsToDate } from 'stream-chat';
import type { Channel, LocalMessage, ScheduledMessageResponse } from 'stream-chat';

import { useChatContext, useTranslationContext } from '../../../context';
import type { ScheduleTimeDialogProps } from '../ScheduleTimeDialog';
import {
  getChannelByCid,
  isFailedScheduledMessage,
  toRescheduledMessageRequest,
} from '../utils';

export type UseRescheduleDialogPropsParams = {
  previewMessage: LocalMessage;
  scheduledMessage: ScheduledMessageResponse;
};

const scheduleFailedMessageAgain = async (
  channel: Channel,
  failedMessage: ScheduledMessageResponse,
  scheduledAt: Date,
) => {
  await channel.messageOperations.scheduleMessage({
    message: toRescheduledMessageRequest(failedMessage),
    options: { scheduled_at: scheduledAt },
  });
  await channel.messageOperations
    .deleteScheduledMessage(failedMessage.id)
    .catch(() => undefined);
};

/**
 * `ScheduleTimeDialog` props that pick a new send time for a scheduled message. A pending one keeps
 * its message and gets the new time. A failed one is scheduled again as a new message, and the failed
 * one is deleted once the new one is scheduled. The caller adds `channel` and `close`.
 */
export const useRescheduleDialogProps = ({
  previewMessage,
  scheduledMessage,
}: UseRescheduleDialogPropsParams): Omit<
  ScheduleTimeDialogProps,
  'channel' | 'close'
> => {
  const { t } = useTranslationContext();
  const { client } = useChatContext();
  const sendTime = nsToDate(scheduledMessage.scheduled_at);
  const getChannel = () => getChannelByCid(client, scheduledMessage.cid);
  const title = t('scheduledMessages.rescheduleMessage', 'Reschedule message');
  const errorMessage = t(
    'scheduledMessages.couldntRescheduleTheMessageTryAgain',
    "Couldn't reschedule the message. Try again",
  );

  if (isFailedScheduledMessage(scheduledMessage)) {
    return {
      errorMessage,
      previewMessage,
      submit: (scheduledAt: Date) =>
        scheduleFailedMessageAgain(getChannel(), scheduledMessage, scheduledAt),
      title,
    };
  }

  return {
    errorMessage,
    initialScheduledAt: sendTime,
    previewLabel: t('scheduledMessages.scheduledForTime', 'Scheduled for {{ time }}', {
      time: t('timestamp.ScheduledMessageSendTime', { timestamp: sendTime }),
    }),
    previewMessage,
    // a failure keeps the dialog open, showing it
    submit: async (scheduledAt: Date) => {
      await getChannel().messageOperations.updateScheduledMessage(scheduledMessage.id, {
        request: { scheduled_at: scheduledAt },
      });
    },
    submitLabel: t('scheduledMessages.save', 'Save'),
    title,
    tooSoonMessage: t(
      'scheduledMessages.pickALaterTimeEditingCantSend',
      "Pick a later time. Editing can't send a message right away.",
    ),
  };
};
