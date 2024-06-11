import { StreamMessage, useChatContext, useTranslationContext } from '../../../context';
import { DefaultStreamChatGenerics } from '../../../types/types';
import { ReactionResponse, ReactionSort, StreamChat } from 'stream-chat';
import { ReactionType } from '../../Reactions/types';

export const MAX_MESSAGE_REACTIONS_TO_FETCH = 1000;

type FetchMessageReactionsNotifications<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
> = {
  getErrorNotification?: (message: StreamMessage<StreamChatGenerics>) => string;
  notify?: (notificationText: string, type: 'success' | 'error') => void;
};

export function useReactionsFetcher<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>(
  message: StreamMessage<StreamChatGenerics>,
  notifications: FetchMessageReactionsNotifications<StreamChatGenerics> = {},
) {
  const { client } = useChatContext('useRectionsFetcher');
  const { t } = useTranslationContext('useReactionFetcher');
  const { getErrorNotification, notify } = notifications;

  return async (
    reactionType?: ReactionType<StreamChatGenerics>,
    sort?: ReactionSort<StreamChatGenerics>,
  ) => {
    try {
      return await fetchMessageReactions(client, message.id, reactionType, sort);
    } catch (e) {
      const errorMessage = getErrorNotification?.(message);
      notify?.(errorMessage || t('Error fetching reactions'), 'error');
      throw e;
    }
  };
}

async function fetchMessageReactions<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>(
  client: StreamChat<StreamChatGenerics>,
  messageId: string,
  reactionType?: ReactionType<StreamChatGenerics>,
  sort?: ReactionSort<StreamChatGenerics>,
) {
  const reactions: ReactionResponse<StreamChatGenerics>[] = [];
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
