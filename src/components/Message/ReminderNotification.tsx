import React from 'react';
import { useTranslationContext } from '../../context';
import { useStateStore } from '../../store';
import type { Reminder, ReminderState } from 'stream-chat';
import { IconBellNotification, IconBookmark } from '../Icons';

export type ReminderNotificationProps = {
  reminder?: Reminder;
};

const reminderStateSelector = (state: ReminderState) => ({
  timeLeftMs: state.timeLeftMs,
});

function SavedForLaterContent() {
  const { t } = useTranslationContext();
  return (
    <p className='str-chat__message-saved-for-later'>
      <IconBookmark />
      <span>{t('Saved for later')}</span>
    </p>
  );
}

const THRESHOLD_RELATIVE_MINUTES = 59;

function RemindMeContent({ reminder }: { reminder: Reminder }) {
  const { t } = useTranslationContext();
  const { timeLeftMs } = useStateStore(reminder?.state, reminderStateSelector) ?? {};

  const stopRefreshBoundaryMs = reminder?.timer.stopRefreshBoundaryMs;
  const stopRefreshTimeStamp =
    reminder?.remindAt && stopRefreshBoundaryMs
      ? reminder.remindAt.getTime() + stopRefreshBoundaryMs
      : undefined;

  const isBehindRefreshBoundary =
    !!stopRefreshTimeStamp && new Date().getTime() > stopRefreshTimeStamp;

  if (timeLeftMs === null || !reminder.remindAt) return null;

  const nowMs = Date.now();
  const remindAtMs = reminder.remindAt.getTime();
  const diffMs = remindAtMs - nowMs;
  const diffMinutes = Math.abs(diffMs) / (60 * 1000);
  const useAbsoluteFormat = diffMinutes > THRESHOLD_RELATIVE_MINUTES;

  const renderTime = () => {
    if (isBehindRefreshBoundary) {
      // Past: reminder time has passed
      if (useAbsoluteFormat) {
        // > 59 min ago: calendar + time (same as DateSeparator + HH:mm)
        // e.g. "Due since Today at 15:00", "Due since Yesterday at 09:30"
        return t('Due since {{ dueSince }}', {
          dueSince: t('timestamp/ReminderNotification', {
            timestamp: reminder.remindAt,
          }),
        });
      }
      // Within 59 min ago: relative
      // e.g. "Due since 5 minutes ago", "Due since a minute ago"
      return t('Due since {{ dueSince }}', {
        dueSince: t('duration/Message reminder', {
          milliseconds: diffMs,
        }),
      });
    }
    // Future: reminder not yet due
    if (useAbsoluteFormat) {
      // > 59 min from now: calendar + time (no "Due" prefix)
      // e.g. "Today at 15:00", "Tomorrow at 09:30"
      return t('timestamp/ReminderNotification', {
        timestamp: reminder.remindAt,
      });
    }
    // Within 59 min from now: relative
    // e.g. "Due in 30 minutes", "Due in a minute"
    return t('Due {{ timeLeft }}', {
      timeLeft: t('duration/Message reminder', {
        milliseconds: timeLeftMs,
      }),
    });
  };

  return (
    <p className='str-chat__message-reminder'>
      <IconBellNotification />
      <span>{t('Reminder set')}</span>
      <span> · </span>
      <span className='str-chat__message-reminder__time-left'>{renderTime()}</span>
    </p>
  );
}

export const ReminderNotification = ({ reminder }: ReminderNotificationProps) => {
  if (!reminder) return null;

  if (!reminder.remindAt) {
    return <SavedForLaterContent />;
  }

  return <RemindMeContent reminder={reminder} />;
};
