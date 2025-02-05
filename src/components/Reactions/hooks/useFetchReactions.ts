import { useEffect, useState } from 'react';
import { ReactionResponse, ReactionSort } from 'stream-chat';
import { MessageContextValue, useMessageContext } from '../../../context';

import { ReactionType } from '../types';

export interface FetchReactionsOptions {
  reactionType: ReactionType;
  shouldFetch: boolean;
  handleFetchReactions?: MessageContextValue['handleFetchReactions'];
  sort?: ReactionSort;
}

export function useFetchReactions(options: FetchReactionsOptions) {
  const { handleFetchReactions: contextHandleFetchReactions } =
    useMessageContext('useFetchReactions');
  const [reactions, setReactions] = useState<ReactionResponse[]>([]);
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
