import { useCallback } from 'react';
import { useChatContext } from '../../../context';
import { useStateStore } from '../../../store';
import type { ReminderManagerState } from 'stream-chat';

export const useMessageReminder = (messageId: string) => {
  const { client } = useChatContext();
  const reminderSelector = useCallback(
    (state: ReminderManagerState) => ({
      reminder: state.reminders.get(messageId),
    }),
    [messageId],
  );
  const { reminder } = useStateStore(client.reminders.state, reminderSelector);
  return reminder;
};
