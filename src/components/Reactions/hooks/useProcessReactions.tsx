import { useCallback, useMemo } from 'react';

import { useComponentContext, useMessageContext } from '../../../context';

import type { ReactionsListProps } from '../ReactionsList';
import type { DefaultStreamChatGenerics } from '../../../types/types';
import type { ReactionsComparator, ReactionSummary } from '../types';

type SharedReactionListProps =
  | 'own_reactions'
  | 'reaction_counts'
  | 'reactionOptions'
  | 'reactions';

type UseProcessReactionsParams = Pick<ReactionsListProps, SharedReactionListProps> & {
  sortReactions?: ReactionsComparator;
};

export const defaultReactionsSort: ReactionsComparator = (a, b) =>
  a.reactionType.localeCompare(b.reactionType, 'en');

export const useProcessReactions = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>(
  params: UseProcessReactionsParams,
) => {
  const {
    own_reactions: propOwnReactions,
    reaction_counts: propReactionCounts,
    reactionOptions: propReactionOptions,
    reactions: propReactions,
    sortReactions: propSortReactions,
  } = params;
  const { message, sortReactions: contextSortReactions } = useMessageContext<StreamChatGenerics>(
    'useProcessReactions',
  );
  const { reactionOptions: contextReactionOptions } = useComponentContext<StreamChatGenerics>(
    'useProcessReactions',
  );

  const reactionOptions = propReactionOptions ?? contextReactionOptions;
  const sortReactions = propSortReactions ?? contextSortReactions ?? defaultReactionsSort;
  const latestReactions = propReactions || message.latest_reactions;
  const ownReactions = propOwnReactions || message?.own_reactions;
  const reactionCounts = propReactionCounts || message.reaction_counts;

  const isOwnReaction = useCallback(
    (reactionType: string) =>
      ownReactions?.some((reaction) => reaction.type === reactionType) ?? false,
    [ownReactions],
  );

  const getEmojiByReactionType = useCallback(
    (reactionType: string) =>
      reactionOptions.find(({ type }) => type === reactionType)?.Component ?? null,
    [reactionOptions],
  );

  const isSupportedReaction = useCallback(
    (reactionType: string) =>
      reactionOptions.some((reactionOption) => reactionOption.type === reactionType),
    [reactionOptions],
  );

  const getLatestReactedUserNames = useCallback(
    (reactionType?: string) =>
      latestReactions?.flatMap((reaction) => {
        if (reactionType && reactionType === reaction.type) {
          const username = reaction.user?.name || reaction.user?.id;
          return username ? [username] : [];
        }
        return [];
      }) ?? [],
    [latestReactions],
  );

  const existingReactions: ReactionSummary[] = useMemo(() => {
    if (!reactionCounts) {
      return [];
    }

    const unsortedReactions = Object.entries(reactionCounts).flatMap(
      ([reactionType, reactionCount]) => {
        if (reactionCount === 0 || !isSupportedReaction(reactionType)) {
          return [];
        }

        return [
          {
            EmojiComponent: getEmojiByReactionType(reactionType),
            isOwnReaction: isOwnReaction(reactionType),
            latestReactedUserNames: getLatestReactedUserNames(reactionType),
            reactionCount,
            reactionType,
          },
        ];
      },
    );

    return unsortedReactions.sort(sortReactions);
  }, [
    getEmojiByReactionType,
    getLatestReactedUserNames,
    isOwnReaction,
    isSupportedReaction,
    reactionCounts,
    sortReactions,
  ]);

  const hasReactions = existingReactions.length > 0;

  const totalReactionCount = useMemo(
    () => existingReactions.reduce((total, { reactionCount }) => total + reactionCount, 0),
    [existingReactions],
  );

  return {
    existingReactions,
    hasReactions,
    totalReactionCount,
  };
};
