import { nsToDate } from 'stream-chat';
import type { LocalMessage, ScheduledMessageResponse } from 'stream-chat';

import { useChatContext, useTranslationContext } from '../../../context';
import type { ScheduleTimeDialogProps } from '../ScheduleTimeDialog';
import { splitCid } from '../utils';

export type UseRescheduleDialogPropsParams = {
  previewMessage: LocalMessage;
  scheduledMessage: ScheduledMessageResponse;
  /** Called with the server's copy once the new time is saved. */
  onRescheduled?: (scheduledMessage: ScheduledMessageResponse) => void;
};

/**
 * `ScheduleTimeDialog` props that pick a new send time for a scheduled message and save only the
 * time. The caller adds `channel` and `close`.
 */
export const useRescheduleDialogProps = ({
  onRescheduled,
  previewMessage,
  scheduledMessage,
}: UseRescheduleDialogPropsParams): Omit<
  ScheduleTimeDialogProps,
  'channel' | 'close'
> => {
  const { t } = useTranslationContext();
  const { client } = useChatContext();
  const sendTime = nsToDate(scheduledMessage.scheduled_at);

  return {
    errorMessage: t(
      'scheduledMessages.couldntRescheduleTheMessageTryAgain',
      "Couldn't reschedule the message. Try again",
    ),
    initialScheduledAt: sendTime,
    previewLabel: t('scheduledMessages.scheduledForTime', 'Scheduled for {{ time }}', {
      time: t('timestamp.ScheduledMessageSendTime', { timestamp: sendTime }),
    }),
    previewMessage,
    // a failure keeps the dialog open, showing it
    submit: async (scheduledAt: Date) => {
      const updated = await client
        .channel(...splitCid(scheduledMessage.cid))
        .updateScheduledMessage(scheduledMessage.id, { scheduled_at: scheduledAt });
      onRescheduled?.(updated);
    },
    submitLabel: t('scheduledMessages.save', 'Save'),
    title: t('scheduledMessages.rescheduleMessage', 'Reschedule message'),
    tooSoonMessage: t(
      'scheduledMessages.pickALaterTimeEditingCantSend',
      "Pick a later time. Editing can't send a message right away.",
    ),
  };
};
