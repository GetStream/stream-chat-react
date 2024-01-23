import { useCallback, useMemo } from 'react';

import { useComponentContext, useMessageContext } from '../../../context';

import type { ReactionsListProps } from '../ReactionsList';
import type { DefaultStreamChatGenerics } from '../../../types/types';
import { ReactionSummary } from '../types';

type SharedReactionListProps =
  | 'own_reactions'
  | 'reaction_counts'
  | 'reactionOptions'
  | 'reactions';

type UseProcessReactionsParams = Pick<ReactionsListProps, SharedReactionListProps>;

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
  } = params;
  const { message } = useMessageContext<StreamChatGenerics>('useProcessReactions');
  const { reactionOptions: contextReactionOptions } = useComponentContext<StreamChatGenerics>(
    'useProcessReactions',
  );

  const reactionOptions = propReactionOptions ?? contextReactionOptions;
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

    return Object.entries(reactionCounts).flatMap(([reactionType, reactionCount]) => {
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
    });
  }, [
    getEmojiByReactionType,
    getLatestReactedUserNames,
    isOwnReaction,
    isSupportedReaction,
    reactionCounts,
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
