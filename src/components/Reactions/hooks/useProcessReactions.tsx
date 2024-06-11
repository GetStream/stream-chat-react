import { useCallback, useMemo } from 'react';

import { useComponentContext, useMessageContext } from '../../../context';

import type { ReactionsListProps } from '../ReactionsList';
import type { DefaultStreamChatGenerics } from '../../../types/types';
import type { ReactionsComparator, ReactionSummary } from '../types';

type SharedReactionListProps =
  | 'own_reactions'
  | 'reaction_counts'
  | 'reaction_groups'
  | 'reactionOptions'
  | 'reactions';

type UseProcessReactionsParams = Pick<ReactionsListProps, SharedReactionListProps> & {
  sortReactions?: ReactionsComparator;
};

export const defaultReactionsSort: ReactionsComparator = (a, b) => {
  if (a.firstReactionAt && b.firstReactionAt) {
    return +a.firstReactionAt - +b.firstReactionAt;
  }

  return a.reactionType.localeCompare(b.reactionType, 'en');
};

export const useProcessReactions = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>(
  params: UseProcessReactionsParams,
) => {
  const {
    own_reactions: propOwnReactions,
    reaction_groups: propReactionGroups,
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
  const reactionGroups = propReactionGroups || message?.reaction_groups;

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
    if (!reactionGroups) {
      return [];
    }

    const unsortedReactions = Object.entries(reactionGroups).flatMap(
      ([reactionType, { count, first_reaction_at, last_reaction_at }]) => {
        if (count === 0 || !isSupportedReaction(reactionType)) {
          return [];
        }

        const latestReactedUserNames = getLatestReactedUserNames(reactionType);

        return [
          {
            EmojiComponent: getEmojiByReactionType(reactionType),
            firstReactionAt: first_reaction_at ? new Date(first_reaction_at) : null,
            isOwnReaction: isOwnReaction(reactionType),
            lastReactionAt: last_reaction_at ? new Date(last_reaction_at) : null,
            latestReactedUserNames,
            reactionCount: count,
            reactionType,
            unlistedReactedUserCount: count - latestReactedUserNames.length,
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
    reactionGroups,
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
