import { StreamMessage, useChannelStateContext, useTranslationContext } from '../../../context';
import { DefaultStreamChatGenerics } from '../../../types/types';
import { Channel, ReactionResponse } from 'stream-chat';

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
  notifications: FetchMessageReactionsNotifications<StreamChatGenerics>,
) {
  const { channel } = useChannelStateContext<StreamChatGenerics>('useReactionFetcher');
  const { t } = useTranslationContext('useReactionFetcher');
  const { getErrorNotification, notify } = notifications;

  return () => {
    try {
      return fetchMessageReactions(channel, message.id);
    } catch (e) {
      const errorMessage = getErrorNotification?.(message);
      notify?.(errorMessage || t('Error fetching reactions'), 'error');
      throw e;
    }
  };
}

async function fetchMessageReactions<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>(channel: Channel<StreamChatGenerics>, messageId: string) {
  const reactions: ReactionResponse<StreamChatGenerics>[] = [];
  const limit = 300;
  let offset = 0;
  const reactionsLimit = MAX_MESSAGE_REACTIONS_TO_FETCH;
  let lastPageSize = limit;

  while (lastPageSize === limit && reactions.length < reactionsLimit) {
    const response = await channel.getReactions(messageId, {
      limit,
      offset,
    });
    lastPageSize = response.reactions.length;
    if (lastPageSize > 0) {
      reactions.push(...response.reactions);
    }
    offset += lastPageSize;
  }

  return reactions;
}
