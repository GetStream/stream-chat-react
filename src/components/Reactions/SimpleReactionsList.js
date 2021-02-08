import React, { useContext, useState } from 'react';
import PropTypes from 'prop-types';

import { getStrippedEmojiData } from '../Channel/emojiData';
import { ChannelContext } from '../../context';

/** @type {React.FC<import("types").SimpleReactionsListProps>} */
const SimpleReactionsList = ({
  handleReaction,
  reaction_counts,
  reactionOptions: reactionOptionsProp,
  reactions,
}) => {
  const { emojiConfig } = useContext(ChannelContext);

  const {
    defaultMinimalEmojis,
    Emoji,
    emojiData: defaultEmojiData,
    emojiSetDef,
  } = emojiConfig;

  const emojiData = getStrippedEmojiData(defaultEmojiData);
  const [tooltipReactionType, setTooltipReactionType] = useState(null);
  /** @type{import('types').MinimalEmojiInterface[]} */
  const reactionOptions = reactionOptionsProp || defaultMinimalEmojis;

  if (!reactions || reactions.length === 0) {
    return null;
  }

  /** @param {string | null} type */
  const getUsersPerReactionType = (type) =>
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
    const allTypes = new Set();
    reactions.forEach(({ type }) => {
      allTypes.add(type);
    });
    return Array.from(allTypes);
  };

  /** @param {string} type */
  const getOptionForType = (type) =>
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

SimpleReactionsList.propTypes = {
  /**
   * Handler to set/unset reaction on message.
   *
   * @param type e.g. 'like' | 'love' | 'haha' | 'wow' | 'sad' | 'angry'
   * */
  handleReaction: PropTypes.func,
  /** Object/map of reaction id/type (e.g. 'like' | 'love' | 'haha' | 'wow' | 'sad' | 'angry') vs count */
  reaction_counts: PropTypes.objectOf(PropTypes.number.isRequired),
  /** Provide a list of reaction options [{id: 'angry', emoji: 'angry'}] */
  reactionOptions: PropTypes.array,
  reactions: PropTypes.array,
};

export default React.memo(SimpleReactionsList);
