import React from 'react';
import { useComponentContextIcons, useTranslationContext } from '../../context';
import { useStateStore } from '../../store';
import type { Reminder, ReminderState } from 'stream-chat';
import { nsToDate, nsToMs } from 'stream-chat';

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

  const stopRefreshBoundaryMs = reminder?.timer.stopRefreshBoundaryMs;
  // Nullish, not truthy: `remindAt` is in unix nanoseconds and 0 (the epoch) is a valid value.
  const stopRefreshTimeStamp =
    reminder?.remindAt != null && stopRefreshBoundaryMs != null
      ? nsToMs(reminder.remindAt) + stopRefreshBoundaryMs
      : undefined;

  const isBehindRefreshBoundary =
    stopRefreshTimeStamp != null && new Date().getTime() > stopRefreshTimeStamp;

  if (timeLeftMs === null || reminder.remindAt == null) return null;

  const nowMs = Date.now();
  const remindAtMs = nsToMs(reminder.remindAt);
  const diffMs = remindAtMs - nowMs;
  const diffMinutes = Math.abs(diffMs) / (60 * 1000);
  const useAbsoluteFormat = diffMinutes > THRESHOLD_RELATIVE_MINUTES;

  const renderTime = () => {
    if (isBehindRefreshBoundary) {
      if (useAbsoluteFormat) {
        // More than 59 minutes ago: calendar date and time, e.g. "Due since Yesterday at 09:30".
        return t(
          'message.reminderNotification.dueSince.label',
          'Due since {{ dueSince }}',
          {
            dueSince: t('timestamp.ReminderNotification', {
              timestamp:
                reminder.remindAt != null ? nsToDate(reminder.remindAt) : undefined,
            }),
          },
        );
      }
      // Within 59 minutes: relative, e.g. "Due since 5 minutes ago".
      return t(
        'message.reminderNotification.dueSince.label',
        'Due since {{ dueSince }}',
        {
          dueSince: t('duration.messageReminder', {
            milliseconds: diffMs,
          }),
        },
      );
    }
    if (useAbsoluteFormat) {
      // More than 59 minutes from now: calendar date and time without a "Due" prefix, e.g.
      // "Tomorrow at 09:30".
      return t('timestamp.ReminderNotification', {
        timestamp: reminder.remindAt != null ? nsToDate(reminder.remindAt) : undefined,
      });
    }
    // Within 59 minutes: relative, e.g. "Due in 30 minutes".
    return t('message.reminderNotification.due.label', 'Due {{ timeLeft }}', {
      timeLeft: t('duration.messageReminder', {
        milliseconds: timeLeftMs,
      }),
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
