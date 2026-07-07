import { useCallback, useEffect, useRef } from 'react';
import type { PaginatorState, ReactionResponse, ReactionSort } from 'stream-chat';

import { useChatContext, useMessageContext } from '../../../context';
import { ReactionPaginator } from './ReactionPaginator';
import { useStateStore } from '../../../store';
import type { ReactionType } from '../types';

export interface FetchReactionsOptions {
  reactionType: ReactionType | null;
  sort?: ReactionSort;
}

const STABLE_ARRAY: ReactionResponse[] = [];
const reactionSelector = (currentState: PaginatorState<ReactionResponse>) => ({
  hasNext: currentState.hasNext,
  isLoading: currentState.isLoading,
  reactions: currentState.items ?? STABLE_ARRAY,
});

// use null symbol instead of the actual null for the paginator key
const nullSymbol = Symbol('null');

export function useReactionPaginator({ reactionType, sort }: FetchReactionsOptions) {
  const { client } = useChatContext();
  const { message } = useMessageContext('useReactionPaginator');

  const paginatorByTypeRef = useRef<{
    [key: string | symbol]: ReactionPaginator | undefined;
  }>({});

  const normalizedReactionType = reactionType === null ? nullSymbol : reactionType;

  const getOrCreateInstance = () => {
    const existingInstance = paginatorByTypeRef.current[normalizedReactionType];

    if (existingInstance) return existingInstance;

    const instance = new ReactionPaginator({
      client,
      messageId: message.id,
      options: { pageSize: 25 },
    });
    if (reactionType) instance.filters = { type: reactionType };
    if (sort) instance.sort = sort;

    return (paginatorByTypeRef.current[normalizedReactionType] = instance);
  };

  const selectedPaginator = getOrCreateInstance();

  const { hasNext, isLoading, reactions } = useStateStore(
    selectedPaginator.state,
    reactionSelector,
  );

  const refetch = useCallback(() => {
    selectedPaginator.invalidate();
    selectedPaginator.next();
  }, [selectedPaginator]);

  useEffect(() => {
    const data = selectedPaginator.state.getLatestValue().items;

    if (data?.length) return;

    selectedPaginator.next();
  }, [selectedPaginator]);

  return {
    hasNext,
    isLoading,
    paginator: selectedPaginator,
    reactions,
    refetch,
  } as const;
}
