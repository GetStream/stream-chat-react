import React from 'react';
import { useComponentContextIcons, useTranslationContext } from '../../context';
import { useStateStore } from '../../store';
import type { Reminder, ReminderState } from 'stream-chat';
import { nsToDate } from 'stream-chat';

export type ReminderNotificationProps = {
  reminder?: Reminder;
};

const reminderStateSelector = (state: ReminderState) => ({
  timeLeftMs: state.timeLeftMs,
});

function SavedForLaterContent() {
  const { IconBookmark } = useComponentContextIcons();
  const { t } = useTranslationContext();
  return (
    <div className='str-chat__message-saved-for-later'>
      <IconBookmark />
      <span>{t('common.savedLater.text', 'Saved for later')}</span>
    </div>
  );
}

const THRESHOLD_RELATIVE_MINUTES = 59;

function RemindMeContent({ reminder }: { reminder: Reminder }) {
  const { IconBell } = useComponentContextIcons();
  const { t } = useTranslationContext();
  const { timeLeftMs } = useStateStore(reminder?.state, reminderStateSelector) ?? {};

  // Nullish, not truthy: `remindAt` is in unix nanoseconds and 0 (the epoch) is a valid value.
  if (timeLeftMs === null || reminder.remindAt == null) return null;

  const remindAtDate = nsToDate(reminder.remindAt);
  const diffMs = remindAtDate.getTime() - Date.now();
  const isOverdue = diffMs <= 0;
  // Within 59 minutes of the deadline the time is relative ("5 minutes ago", "in 30 minutes"),
  // further away it is the calendar date and time ("Yesterday at 09:30").
  const useAbsoluteFormat = Math.abs(diffMs) / (60 * 1000) > THRESHOLD_RELATIVE_MINUTES;
  const time = useAbsoluteFormat
    ? t('timestamp.ReminderNotification', { timestamp: remindAtDate })
    : t('duration.messageReminder', { milliseconds: diffMs });

  const renderTime = () => {
    if (isOverdue) {
      // e.g. "Due since 5 minutes ago", "Due since Yesterday at 09:30".
      return t(
        'message.reminderNotification.dueSince.label',
        'Due since {{ dueSince }}',
        {
          dueSince: time,
        },
      );
    }
    // A deadline more than 59 minutes away shows without a "Due" prefix, e.g. "Tomorrow at 09:30".
    if (useAbsoluteFormat) return time;
    // e.g. "Due in 30 minutes".
    return t('message.reminderNotification.due.label', 'Due {{ timeLeft }}', {
      timeLeft: time,
    });
  };

  return (
    <p className='str-chat__message-reminder'>
      <IconBell />
      <span>{t('common.reminderSet.text', 'Reminder set')}</span>
      <span> · </span>
      <span className='str-chat__message-reminder__time-left'>{renderTime()}</span>
    </p>
  );
}

export const ReminderNotification = ({ reminder }: ReminderNotificationProps) => {
  if (!reminder) return null;

  // Nullish, not truthy: `remindAt` is `null` only when the message is saved for later without a
  // deadline. `0` is a real deadline (the epoch) and must render as an overdue reminder.
  if (reminder.remindAt == null) {
    return <SavedForLaterContent />;
  }

  return <RemindMeContent reminder={reminder} />;
};
