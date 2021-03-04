import React, { useState } from 'react';

import { getStrippedEmojiData } from '../Channel/emojiData';

import { MinimalEmoji, useChannelContext } from '../../context/ChannelContext';

import type { ReactionResponse } from 'stream-chat';

import type {
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
  UnknownType,
} from '../../../types/types';

export type SimpleReactionsListProps<
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
> = {
  /**
   * Handler to set/unset reaction on message.
   *
   * @param type e.g. 'like' | 'love' | 'haha' | 'wow' | 'sad' | 'angry'
   * */
  handleReaction?: (reactionType: string) => void;
  /** Object/map of reaction id/type (e.g. 'like' | 'love' | 'haha' | 'wow' | 'sad' | 'angry') vs count */
  reaction_counts?: { [key: string]: number };
  /** Provide a list of reaction options [{id: 'angry', emoji: 'angry'}] */
  reactionOptions?: MinimalEmoji[];
  reactions?: ReactionResponse<Re, Us>[];
};

const UnMemoizedSimpleReactionsList = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>(
  props: SimpleReactionsListProps<Re, Us>,
) => {
  const {
    handleReaction,
    reaction_counts,
    reactionOptions: reactionOptionsProp,
    reactions,
  } = props;

  const { emojiConfig } = useChannelContext<At, Ch, Co, Ev, Me, Re, Us>();

  const {
    defaultMinimalEmojis,
    Emoji,
    emojiData: defaultEmojiData,
    emojiSetDef,
  } = emojiConfig || {};

  const emojiData = getStrippedEmojiData(defaultEmojiData);
  const [tooltipReactionType, setTooltipReactionType] = useState<string | null>(
    null,
  );
  const reactionOptions = reactionOptionsProp || defaultMinimalEmojis || [];

  if (!reactions || reactions.length === 0) {
    return null;
  }

  const getUsersPerReactionType = (type: string | null) =>
    reactions
      ?.map((reaction) => {
        if (reaction.type === type) {
          return reaction.user?.name || reaction.user?.id;
        }
        return null;
      })
      .filter(Boolean);

  const getTotalReactionCount = () =>
    Object.values(reaction_counts || {}).reduce(
      (total, count) => total + count,
      0,
    );

  const getReactionTypes = () => {
    if (!reactions) return [];
    const allTypes = new Set(reactions.map(({ type }) => type));

    return Array.from(allTypes);
  };

  const getOptionForType = (type: string) =>
    reactionOptions.find((option) => option.id === type);

  return (
    <ul
      className='str-chat__simple-reactions-list'
      data-testid='simple-reaction-list'
      onMouseLeave={() => setTooltipReactionType(null)}
    >
      {getReactionTypes().map((reactionType, i) => {
        const emojiDefinition = getOptionForType(reactionType);
        return emojiDefinition ? (
          <li
            className='str-chat__simple-reactions-list-item'
            key={`${emojiDefinition?.id}-${i}`}
            onClick={() => handleReaction && handleReaction(reactionType)}
          >
            <span onMouseEnter={() => setTooltipReactionType(reactionType)}>
              {Emoji && (
                <Emoji
                  // emoji-mart type defs don't support spriteSheet use case
                  // (but implementation does)
                  // @ts-expect-error
                  emoji={emojiDefinition}
                  {...emojiSetDef}
                  // @ts-expect-error
                  data={emojiData}
                  size={13}
                />
              )}
              &nbsp;
            </span>

            {tooltipReactionType === getOptionForType(reactionType)?.id && (
              <div className='str-chat__simple-reactions-list-tooltip'>
                <div className='arrow' />
                {getUsersPerReactionType(tooltipReactionType)?.join(', ')}
              </div>
            )}
          </li>
        ) : null;
      })}
      {reactions?.length !== 0 && (
        <li className='str-chat__simple-reactions-list-item--last-number'>
          {getTotalReactionCount()}
        </li>
      )}
    </ul>
  );
};

export const SimpleReactionsList = React.memo(
  UnMemoizedSimpleReactionsList,
) as typeof UnMemoizedSimpleReactionsList;
