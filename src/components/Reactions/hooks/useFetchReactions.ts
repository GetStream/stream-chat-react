import { useCallback, useEffect, useState } from 'react';
import type { ReactionResponse, ReactionSort } from 'stream-chat';
import type { MessageContextValue } from '../../../context';
import { useMessageContext, useTranslationContext } from '../../../context';
import { useNotificationApi } from '../../Notifications';

import type { ReactionType } from '../types';

export interface FetchReactionsOptions {
  reactionType: ReactionType | null;
  shouldFetch: boolean;
  handleFetchReactions?: MessageContextValue['handleFetchReactions'];
  sort?: ReactionSort;
}

export function useFetchReactions(options: FetchReactionsOptions) {
  const { addNotification } = useNotificationApi();
  const { handleFetchReactions: contextHandleFetchReactions } =
    useMessageContext('useFetchReactions');
  const { t } = useTranslationContext('useFetchReactions');
  const [reactions, setReactions] = useState<ReactionResponse[]>([]);
  const {
    handleFetchReactions: propHandleFetchReactions,
    reactionType,
    shouldFetch,
    sort,
  } = options;
  const [isLoading, setIsLoading] = useState(shouldFetch);
  const handleFetchReactions = propHandleFetchReactions ?? contextHandleFetchReactions;
  const [refetchNonce, setRefetchNonce] = useState<number | null>(null);

  useEffect(() => {
    if (!shouldFetch) {
      return;
    }

    let cancel = false;

    (async () => {
      try {
        setIsLoading(true);
        const reactions = await handleFetchReactions(reactionType ?? undefined, sort);

        if (!cancel) {
          setReactions(reactions);
        }
      } catch (e) {
        if (!cancel) {
          setReactions([]);
          addNotification({
            emitter: 'Reactions',
            error: e instanceof Error ? e : undefined,
            message: t('Error fetching reactions'),
            severity: 'error',
            type: 'api:message:reactions:fetch:failed',
          });
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
  }, [
    addNotification,
    handleFetchReactions,
    reactionType,
    refetchNonce,
    shouldFetch,
    sort,
    t,
  ]);

  const refetch = useCallback(() => {
    setRefetchNonce(Math.random());
  }, []);

  return { isLoading, reactions, refetch };
}
