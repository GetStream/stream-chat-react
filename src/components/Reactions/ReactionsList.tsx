import React, { useMemo } from 'react';

import { getStrippedEmojiData } from '../Channel/emojiData';

import {
  EmojiSetDef,
  MinimalEmoji,
  useChannelContext,
} from '../../context/ChannelContext';

import type { MessageResponse, ReactionResponse } from 'stream-chat';

import type { MouseEventHandler } from '../Message/types';

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

export type ReactionsListProps<
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
> = {
  onClick: MouseEventHandler;
  emojiSetDef?: EmojiSetDef;
  own_reactions?: MessageResponse<At, Ch, Co, Me, Re, Us>['own_reactions'];
  /** Object/map of reaction id/type (e.g. 'like' | 'love' | 'haha' | 'wow' | 'sad' | 'angry') vs count */
  reaction_counts?: { [key: string]: number };
  /** Provide a list of reaction options [{id: 'angry', emoji: 'angry'}] */
  reactionOptions?: MinimalEmoji[];
  reactions?: ReactionResponse<Re, Us>[];
  reverse?: boolean;
};

const UnMemoizedReactionsList = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>(
  props: ReactionsListProps<Re, Us>,
) => {
  const {
    onClick,
    reaction_counts,
    reactionOptions: reactionOptionsProp,
    reactions,
    reverse = false,
  } = props;

  const { emojiConfig } = useChannelContext<At, Ch, Co, Ev, Me, Re, Us>();

  const { defaultMinimalEmojis, Emoji, emojiData: fullEmojiData, emojiSetDef } =
    emojiConfig || {};

  const emojiData = useMemo(() => getStrippedEmojiData(fullEmojiData), [
    fullEmojiData,
  ]);
  const reactionOptions = reactionOptionsProp || defaultMinimalEmojis || [];

  const getTotalReactionCount = () =>
    Object.values(reaction_counts || {}).reduce(
      (total, count) => total + count,
      0,
    );

  const getOptionForType = (type: string) =>
    reactionOptions.find((option) => option.id === type);

  const getReactionTypes = () => {
    if (!reactions) return [];
    const allTypes = new Set(reactions.map(({ type }) => type));

    return Array.from(allTypes);
  };

  return (
    <div
      className={`str-chat__reaction-list ${
        reverse ? 'str-chat__reaction-list--reverse' : ''
      }`}
      data-testid='reaction-list'
      onClick={onClick}
    >
      <ul>
        {getReactionTypes().map((reactionType) => {
          const emojiDefinition = getOptionForType(reactionType);
          return emojiDefinition ? (
            <li key={emojiDefinition.id}>
              {Emoji && (
                <Emoji
                  // emoji-mart type defs don't support spriteSheet use case
                  // (but implementation does)
                  // @ts-expect-error
                  emoji={emojiDefinition}
                  {...emojiSetDef}
                  // @ts-expect-error
                  data={emojiData}
                  size={16}
                />
              )}
              &nbsp;
            </li>
          ) : null;
        })}
        <li>
          <span className='str-chat__reaction-list--counter'>
            {getTotalReactionCount()}
          </span>
        </li>
      </ul>
    </div>
  );
};

export const ReactionsList = React.memo(
  UnMemoizedReactionsList,
) as typeof UnMemoizedReactionsList;
