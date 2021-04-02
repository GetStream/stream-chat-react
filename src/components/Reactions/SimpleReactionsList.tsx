import React, { useState } from 'react';

import { getStrippedEmojiData } from '../Channel/emojiData';

import { MinimalEmoji, useChannelStateContext } from '../../context/ChannelStateContext';
import { useComponentContext } from '../../context/ComponentContext';

import type { ReactionResponse } from 'stream-chat';

import type {
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
} from '../../../types/types';

export type SimpleReactionsListProps<
  Re extends DefaultReactionType = DefaultReactionType,
  Us extends DefaultUserType<Us> = DefaultUserType
> = {
  /**
   * Handler to set/unset reaction on message.
   *
   * @param type e.g. 'like' | 'love' | 'haha' | 'wow' | 'sad' | 'angry'
   * */
  handleReaction: (
    reactionType: string,
    event: React.MouseEvent<HTMLElement, MouseEvent>,
  ) => Promise<void>;
  /** Object/map of reaction id/type (e.g. 'like' | 'love' | 'haha' | 'wow' | 'sad' | 'angry') vs count */
  reaction_counts?: { [key: string]: number };
  /** Provide a list of reaction options [{id: 'angry', emoji: 'angry'}] */
  reactionOptions?: MinimalEmoji[];
  reactions?: ReactionResponse<Re, Us>[];
};

const UnMemoizedSimpleReactionsList = <
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends DefaultChannelType = DefaultChannelType,
  Co extends DefaultCommandType = DefaultCommandType,
  Ev extends DefaultEventType = DefaultEventType,
  Me extends DefaultMessageType = DefaultMessageType,
  Re extends DefaultReactionType = DefaultReactionType,
  Us extends DefaultUserType<Us> = DefaultUserType
>(
  props: SimpleReactionsListProps<Re, Us>,
) => {
  const {
    handleReaction,
    reaction_counts,
    reactionOptions: reactionOptionsProp,
    reactions,
  } = props;

  const { emojiConfig } = useChannelStateContext<At, Ch, Co, Ev, Me, Re, Us>();
  const { Emoji } = useComponentContext<At, Ch, Co, Ev, Me, Re, Us>();

  const { defaultMinimalEmojis, emojiData: defaultEmojiData, emojiSetDef } = emojiConfig || {};

  const [tooltipReactionType, setTooltipReactionType] = useState<string | undefined>(undefined);

  const emojiData = getStrippedEmojiData(defaultEmojiData);

  const reactionOptions = reactionOptionsProp || defaultMinimalEmojis || [];

  if (!reactions || reactions.length === 0) {
    return null;
  }

  const getUsersPerReactionType = (type?: string) =>
    reactions
      ?.map((reaction) => {
        if (reaction.type === type) {
          return reaction.user?.name || reaction.user?.id;
        }
        return null;
      })
      .filter(Boolean);

  const getTotalReactionCount = () =>
    Object.values(reaction_counts || {}).reduce((total, count) => total + count, 0);

  const getReactionTypes = () => {
    if (!reactions) return [];
    const allTypes = new Set(reactions.map(({ type }) => type));

    return Array.from(allTypes);
  };

  const getOptionForType = (type: string) => reactionOptions.find((option) => option.id === type);

  return (
    <ul
      className='str-chat__simple-reactions-list'
      data-testid='simple-reaction-list'
      onMouseLeave={() => setTooltipReactionType(undefined)}
    >
      {getReactionTypes().map((reactionType, i) => {
        const emojiDefinition = getOptionForType(reactionType);
        return emojiDefinition ? (
          <li
            className='str-chat__simple-reactions-list-item'
            key={`${emojiDefinition?.id}-${i}`}
            onClick={(event) => handleReaction(reactionType, event)}
          >
            <span onMouseEnter={() => setTooltipReactionType(reactionType)}>
              {Emoji && (
                <Emoji
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
