import React from 'react';
import { useChatContext, useTranslationContext } from '../../context';
import { useStateStore } from '../../store';
import type { Reminder, ReminderState } from 'stream-chat';

export type ReminderNotificationProps = {
  reminder?: Reminder;
};

const reminderStateSelector = (state: ReminderState) => ({
  timeLeftMs: state.timeLeftMs,
});

export const ReminderNotification = ({ reminder }: ReminderNotificationProps) => {
  const { client } = useChatContext();
  const { t } = useTranslationContext();
  const { timeLeftMs } = useStateStore(reminder?.state, reminderStateSelector) ?? {};

  const stopRefreshBoundaryMs = client.reminders.stopTimerRefreshBoundaryMs;
  const stopRefreshTimeStamp =
    reminder?.remindAt && stopRefreshBoundaryMs
      ? reminder?.remindAt.getTime() + stopRefreshBoundaryMs
      : undefined;

  const isBehindRefreshBoundary =
    !!stopRefreshTimeStamp && new Date().getTime() > stopRefreshTimeStamp;

  return (
    <p className='str-chat__message-reminder'>
      <span>{t<string>('Saved for later')}</span>
      {reminder?.remindAt && timeLeftMs !== null && (
        <>
          <span> | </span>
          <span>
            {isBehindRefreshBoundary
              ? t<string>('Due since {{ dueSince }}', {
                  dueSince: t<string>(`timestamp/ReminderNotification`, {
                    timestamp: reminder.remindAt,
                  }),
                })
              : t<string>(`Due {{ timeLeft }}`, {
                  timeLeft: t<string>('duration/Message reminder', {
                    milliseconds: timeLeftMs,
                  }),
                })}
          </span>
        </>
      )}
    </p>
  );
};
