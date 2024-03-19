import { useEffect, useState } from 'react';
import { ReactionResponse } from 'stream-chat';
import { MessageContextValue, useMessageContext } from '../../../context';
import { DefaultStreamChatGenerics } from '../../../types/types';

export interface FetchReactionsOptions<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
> {
  shouldFetch: boolean;
  handleFetchReactions?: MessageContextValue<StreamChatGenerics>['handleFetchReactions'];
}

export function useFetchReactions<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>(options: FetchReactionsOptions) {
  const {
    handleFetchReactions: contextHandleFetchReactions,
  } = useMessageContext<StreamChatGenerics>('useFetchReactions');
  const [reactions, setReactions] = useState<ReactionResponse[]>([]);
  const { handleFetchReactions: propHandleFetchReactions, shouldFetch } = options;
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
        const reactions = await handleFetchReactions();

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
  }, [handleFetchReactions, shouldFetch]);

  return { isLoading, reactions };
}
