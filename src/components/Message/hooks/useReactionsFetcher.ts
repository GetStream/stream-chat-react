import { Reaction, ReactionResponse, StreamChat } from 'stream-chat';
import { StreamMessage, useChatContext, useTranslationContext } from '../../../context';
import { DefaultStreamChatGenerics } from '../../../types/types';

export const MAX_MESSAGE_REACTIONS_TO_FETCH = 1200;

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
  const { client } = useChatContext('useReactionFetcher');
  const { t } = useTranslationContext('useReactionFetcher');
  const { getErrorNotification, notify } = notifications;

  return async (reactionType?: string) => {
    try {
      return await queryMessageReactions(client, message.id, reactionType);
    } catch (e) {
      const errorMessage = getErrorNotification?.(message);
      notify?.(errorMessage || t('Error fetching reactions'), 'error');
      throw e;
    }
  };
}

async function queryMessageReactions<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>(
  client: StreamChat<StreamChatGenerics>,
  messageId: string,
  reactionType?: Reaction<StreamChatGenerics>['type'],
) {
  const reactions: ReactionResponse<StreamChatGenerics>[] = [];
  const limit = 25;
  let hasNext = true;
  let next: string | undefined;

  while (hasNext) {
    const page = await client.queryReactions(
      messageId,
      reactionType ? { type: reactionType } : {},
      { created_at: -1 },
      { limit, next },
    );
    reactions.push(...page.reactions);
    next = page.next;
    hasNext = Boolean(next);
  }

  return reactions;
}
