import { useEffect, useState } from 'react';
import { ReactionResponse } from 'stream-chat';
import { MessageContextValue, useMessageContext } from '../../../context';
import { DefaultStreamChatGenerics } from '../../../types/types';

export function useFetchReactions<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>(propHandleFetchReactions?: MessageContextValue<StreamChatGenerics>['handleFetchReactions']) {
  const {
    handleFetchReactions: contextHandleFetchReactions,
  } = useMessageContext<StreamChatGenerics>('useFetchReactions');
  const [isLoading, setIsLoading] = useState(false);
  const [reactions, setReactions] = useState<ReactionResponse[]>([]);
  const handleFetchReactions = propHandleFetchReactions ?? contextHandleFetchReactions;

  useEffect(() => {
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
  }, [handleFetchReactions]);

  return { isLoading, reactions };
}
