import type { StreamMessage } from '../../../context';
import { useChatContext, useTranslationContext } from '../../../context';
import type { ReactionResponse, ReactionSort, StreamChat } from 'stream-chat';
import type { ReactionType } from '../../Reactions/types';

export const MAX_MESSAGE_REACTIONS_TO_FETCH = 1000;

type FetchMessageReactionsNotifications = {
  getErrorNotification?: (message: StreamMessage) => string;
  notify?: (notificationText: string, type: 'success' | 'error') => void;
};

export function useReactionsFetcher(
  message: StreamMessage,
  notifications: FetchMessageReactionsNotifications = {},
) {
  const { client } = useChatContext('useRectionsFetcher');
  const { t } = useTranslationContext('useReactionFetcher');
  const { getErrorNotification, notify } = notifications;

  return async (reactionType?: ReactionType, sort?: ReactionSort) => {
    try {
      return await fetchMessageReactions(client, message.id, reactionType, sort);
    } catch (e) {
      const errorMessage = getErrorNotification?.(message);
      notify?.(errorMessage || t('Error fetching reactions'), 'error');
      throw e;
    }
  };
}

async function fetchMessageReactions(
  client: StreamChat,
  messageId: string,
  reactionType?: ReactionType,
  sort?: ReactionSort,
) {
  const reactions: ReactionResponse[] = [];
  const limit = 25;
  let next: string | undefined;
  let hasNext = true;

  while (hasNext && reactions.length < MAX_MESSAGE_REACTIONS_TO_FETCH) {
    const response = await client.queryReactions(
      messageId,
      reactionType ? { type: reactionType } : {},
      sort,
      { limit, next },
    );

    reactions.push(...response.reactions);
    next = response.next;
    hasNext = Boolean(next);
  }

  return reactions;
}
