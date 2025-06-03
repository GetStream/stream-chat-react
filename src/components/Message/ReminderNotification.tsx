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

  return (
    <p className='str-chat__message-reminder'>
      <span>{t<string>('Saved for later')}</span>
      {timeLeftMs !== null && (
        <>
          <span> | </span>
          <span>
            {t<string>(`Due {{ dueTimeElapsed }}`, {
              dueTimeElapsed: t<string>('duration/Message reminder', {
                milliseconds: timeLeftMs,
              }),
            })}
          </span>
        </>
      )}
    </p>
  );
};
