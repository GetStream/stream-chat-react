import type { ScheduledMessageResponse } from 'stream-chat';

const normalizeSearchText = (text: string) => text.trim().toLocaleLowerCase();

export const filterScheduledMessagesByText = (
  scheduledMessages: ScheduledMessageResponse[],
  searchQuery = '',
) => {
  const normalizedQuery = normalizeSearchText(searchQuery);

  if (!normalizedQuery) return scheduledMessages;

  const matchingScheduledMessages = scheduledMessages.filter(({ message }) => {
    const { text = '' } = message;

    return normalizeSearchText(text).includes(normalizedQuery);
  });

  return matchingScheduledMessages;
};
