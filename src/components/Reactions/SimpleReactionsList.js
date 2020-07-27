// @ts-check
import React, { useState } from 'react';
import PropTypes from 'prop-types';
// @ts-ignore
import { NimbleEmoji } from 'emoji-mart';
import { defaultMinimalEmojis, emojiSetDef, emojiData } from '../../utils';

/** @type {React.FC<import("types").SimpleReactionsListProps>} */
const SimpleReactionsList = ({
  reactions,
  reaction_counts,
  reactionOptions = defaultMinimalEmojis,
  handleReaction,
}) => {
  const [tooltipReactionType, setTooltipReactionType] = useState(null);

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
      data-testid="simple-reaction-list"
      className="str-chat__simple-reactions-list"
      onMouseLeave={() => setTooltipReactionType(null)}
    >
      {getReactionTypes().map((reactionType, i) => {
        const emojiDefinition = getOptionForType(reactionType);
        return emojiDefinition ? (
          <li
            className="str-chat__simple-reactions-list-item"
            key={`${emojiDefinition?.id}-${i}`}
            onClick={() => handleReaction && handleReaction(reactionType)}
          >
            <span onMouseEnter={() => setTooltipReactionType(reactionType)}>
              <NimbleEmoji
                // emoji-mart type defs don't support spriteSheet use case
                // (but implementation does)
                // @ts-ignore
                emoji={emojiDefinition}
                {...emojiSetDef}
                size={13}
                data={emojiData}
              />
              &nbsp;
            </span>

            {tooltipReactionType === getOptionForType(reactionType)?.id && (
              <div className="str-chat__simple-reactions-list-tooltip">
                <div className="arrow" />
                {getUsersPerReactionType(tooltipReactionType)?.join(', ')}
              </div>
            )}
          </li>
        ) : null;
      })}
      {reactions?.length !== 0 && (
        <li className="str-chat__simple-reactions-list-item--last-number">
          {getTotalReactionCount()}
        </li>
      )}
    </ul>
  );
};

SimpleReactionsList.propTypes = {
  reactions: PropTypes.array,
  /** Object/map of reaction id/type (e.g. 'like' | 'love' | 'haha' | 'wow' | 'sad' | 'angry') vs count */
  reaction_counts: PropTypes.objectOf(PropTypes.number.isRequired),
  /** Provide a list of reaction options [{id: 'angry', emoji: 'angry'}] */
  reactionOptions: PropTypes.array,
  /**
   * Handler to set/unset reaction on message.
   *
   * @param type e.g. 'like' | 'love' | 'haha' | 'wow' | 'sad' | 'angry'
   * */
  handleReaction: PropTypes.func,
};

export default React.memo(SimpleReactionsList);
