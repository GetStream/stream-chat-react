import { useCallback, useMemo } from 'react';
import { getStrippedEmojiData, ReactionEmoji } from '../../Channel/emojiData';
import type { EmojiContextValue } from '../../../context/EmojiContext';
import type { ReactionsListProps } from '../ReactionsList';
import { useMessageContext } from '../../../context';
import type { DefaultStreamChatGenerics } from '../../../types/types';

type SharedReactionListProps =
  | 'additionalEmojiProps'
  | 'own_reactions'
  | 'reaction_counts'
  | 'reactionOptions'
  | 'reactions';

type UseProcessReactionsParams = Pick<ReactionsListProps, SharedReactionListProps> &
  Pick<EmojiContextValue, 'emojiConfig'>;

export const useProcessReactions = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>(
  params: UseProcessReactionsParams,
) => {
  const {
    additionalEmojiProps = {},
    emojiConfig,
    own_reactions: propOwnReactions,
    reaction_counts: propReactionCounts,
    reactionOptions: propReactionOptions,
    reactions: propReactions,
  } = params;
  const { message } = useMessageContext<StreamChatGenerics>('ReactionsList');
  const { defaultMinimalEmojis, emojiData: fullEmojiData, emojiSetDef } = emojiConfig || {};

  const latestReactions = propReactions || message.latest_reactions || [];
  const ownReactions = propOwnReactions || message?.own_reactions || [];
  const reactionCounts = propReactionCounts || message.reaction_counts || {};
  const reactionOptions = propReactionOptions || defaultMinimalEmojis;
  const reactionsAreCustom = !!propReactionOptions?.length;

  const iHaveReactedWithReaction = useCallback(
    (reactionType: string) => ownReactions.find((reaction) => reaction.type === reactionType),
    [ownReactions],
  );

  const getEmojiByReactionType = useCallback(
    (type: string): ReactionEmoji | undefined =>
      reactionOptions.find((option: ReactionEmoji) => option.id === type),
    [reactionOptions],
  );

  const emojiData = useMemo(
    () => (reactionsAreCustom ? fullEmojiData : getStrippedEmojiData(fullEmojiData)),
    [fullEmojiData, reactionsAreCustom],
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
      reactionOptions.reduce<Record<string, boolean>>((acc, { id }) => {
        acc[id] = true;
        return acc;
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
    additionalEmojiProps: reactionsAreCustom ? additionalEmojiProps : emojiSetDef,
    aggregatedUserNamesByType,
    emojiData,
    getEmojiByReactionType,
    iHaveReactedWithReaction,
    latestReactions,
    latestReactionTypes,
    reactionCounts,
    supportedReactionsArePresent,
    totalReactionCount,
  };
};
