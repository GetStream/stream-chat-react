import { useCallback, useMemo } from 'react';

import { useMessageContext } from '../../../context';
import { defaultReactionOptions } from '../reactionOptions';

import type { ReactionsListProps } from '../ReactionsList';
import type { DefaultStreamChatGenerics } from '../../../types/types';

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
    reactionOptions = defaultReactionOptions,
    reactions: propReactions,
  } = params;
  const { message } = useMessageContext<StreamChatGenerics>('ReactionsList');

  const latestReactions = propReactions || message.latest_reactions || [];
  const ownReactions = propOwnReactions || message?.own_reactions || [];
  const reactionCounts = propReactionCounts || message.reaction_counts || {};

  const iHaveReactedWithReaction = useCallback(
    (reactionType: string) => ownReactions.find((reaction) => reaction.type === reactionType),
    [ownReactions],
  );

  const getEmojiByReactionType = useCallback(
    (reactionType: string) => Object.entries(reactionOptions).find(([rt]) => rt === reactionType),
    [reactionOptions],
  );

  const latestReactionTypes = useMemo(
    () =>
      latestReactions.reduce<string[]>((reactionTypes, { type }) => {
        if (reactionTypes.indexOf(type) === -1) {
          reactionTypes.push(type);
        }
        return reactionTypes;
      }, []),
    [latestReactions],
  );

  const supportedReactionMap = useMemo(
    () =>
      Object.keys(reactionOptions).reduce<Record<string, boolean>>((map, reactionType) => {
        map[reactionType] = true;
        return map;
      }, {}),
    [reactionOptions],
  );

  const supportedReactionsArePresent = useMemo(
    () => latestReactionTypes.some((type) => supportedReactionMap[type]),
    [latestReactionTypes, supportedReactionMap],
  );

  const totalReactionCount = useMemo(
    () =>
      supportedReactionsArePresent
        ? Object.values(reactionCounts).reduce((total, count) => total + count, 0)
        : 0,
    [reactionCounts, supportedReactionsArePresent],
  );

  const aggregatedUserNamesByType = useMemo(
    () =>
      latestReactions.reduce<Record<string, Array<string>>>((typeMap, { type, user }) => {
        typeMap[type] ??= [];

        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        typeMap[type].push(user?.name || user!.id);
        return typeMap;
      }, {}),
    [latestReactions],
  );

  return {
    aggregatedUserNamesByType,
    getEmojiByReactionType,
    iHaveReactedWithReaction,
    latestReactions,
    latestReactionTypes,
    reactionCounts,
    supportedReactionsArePresent,
    totalReactionCount,
  };
};
