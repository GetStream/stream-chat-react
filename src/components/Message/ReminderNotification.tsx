import React from 'react';
import { useTranslationContext } from '../../context';
import { useStateStore } from '../../store';
import type { Reminder, ReminderState } from 'stream-chat';

export type ReminderNotificationProps = {
  reminder?: Reminder;
};

const reminderStateSelector = (state: ReminderState) => ({
  timeLeftMs: state.timeLeftMs,
});

export const ReminderNotification = ({ reminder }: ReminderNotificationProps) => {
  const { t } = useTranslationContext();
  const { timeLeftMs } = useStateStore(reminder?.state, reminderStateSelector) ?? {};

  const stopRefreshBoundaryMs = reminder?.timer.stopRefreshBoundaryMs;
  const stopRefreshTimeStamp =
    reminder?.remindAt && stopRefreshBoundaryMs
      ? reminder?.remindAt.getTime() + stopRefreshBoundaryMs
      : undefined;

  const isBehindRefreshBoundary =
    !!stopRefreshTimeStamp && new Date().getTime() > stopRefreshTimeStamp;

  return (
    <p className='str-chat__message-reminder'>
      <span>{t('Saved for later')}</span>
      {reminder?.remindAt && timeLeftMs !== null && (
        <>
          <span> | </span>
          <span>
            {isBehindRefreshBoundary
              ? t('Due since {{ dueSince }}', {
                  dueSince: t(`timestamp/ReminderNotification`, {
                    timestamp: reminder.remindAt,
                  }),
                })
              : t(`Due {{ timeLeft }}`, {
                  timeLeft: t('duration/Message reminder', {
                    milliseconds: timeLeftMs,
                  }),
                })}
          </span>
        </>
      )}
    </p>
  );
};
