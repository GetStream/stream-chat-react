import { useEffect, useState } from 'react';
import { ReactionResponse, ReactionSort } from 'stream-chat';
import { MessageContextValue, useMessageContext } from '../../../context';
import { DefaultStreamChatGenerics } from '../../../types/types';
import { ReactionType } from '../types';

export interface FetchReactionsOptions<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> {
  reactionType: ReactionType<StreamChatGenerics>;
  shouldFetch: boolean;
  handleFetchReactions?: MessageContextValue<StreamChatGenerics>['handleFetchReactions'];
  sort?: ReactionSort<StreamChatGenerics>;
}

export function useFetchReactions<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(options: FetchReactionsOptions<StreamChatGenerics>) {
  const { handleFetchReactions: contextHandleFetchReactions } =
    useMessageContext<StreamChatGenerics>('useFetchReactions');
  const [reactions, setReactions] = useState<ReactionResponse<StreamChatGenerics>[]>([]);
  const {
    handleFetchReactions: propHandleFetchReactions,
    reactionType,
    shouldFetch,
    sort,
  } = options;
  const [isLoading, setIsLoading] = useState(shouldFetch);
  const handleFetchReactions = propHandleFetchReactions ?? contextHandleFetchReactions;

  useEffect(() => {
    if (!shouldFetch) {
      return;
    }

    let cancel = false;

    (async () => {
      try {
        setIsLoading(true);
        const reactions = await handleFetchReactions(reactionType, sort);

        if (!cancel) {
          setReactions(reactions);
        }
      } catch (e) {
        if (!cancel) {
          setReactions([]);
        }
      } finally {
        if (!cancel) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      cancel = true;
    };
  }, [handleFetchReactions, reactionType, shouldFetch, sort]);

  return { isLoading, reactions };
}
