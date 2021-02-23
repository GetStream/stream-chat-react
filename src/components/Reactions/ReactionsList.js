import React, { useContext, useMemo } from 'react';
import PropTypes from 'prop-types';

import { getStrippedEmojiData } from '../Channel/emojiData';
import { ChannelContext } from '../../context';

/** @type {React.FC<import("types").ReactionsListProps>} */
const ReactionsList = ({
  onClick,
  reaction_counts,
  reactionOptions: reactionOptionsProp,
  reactions,
  reverse = false,
}) => {
  const { emojiConfig } = useContext(ChannelContext);

  const { defaultMinimalEmojis, Emoji, emojiData: fullEmojiData, emojiSetDef } =
    emojiConfig || {};

  const emojiData = useMemo(() => getStrippedEmojiData(fullEmojiData), [
    fullEmojiData,
  ]);
  const reactionOptions = reactionOptionsProp || defaultMinimalEmojis;
  const getTotalReactionCount = () =>
    Object.values(reaction_counts || {}).reduce(
      (total, count) => total + count,
      0,
    );

  /** @param {string} type */
  const getOptionForType = (type) =>
    reactionOptions.find((option) => option.id === type);

  const getReactionTypes = () => {
    if (!reactions) return [];
    const allTypes = new Set();
    reactions.forEach(({ type }) => {
      allTypes.add(type);
    });
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

ReactionsList.propTypes = {
  onClick: PropTypes.func,
  /** Object/map of reaction id/type (e.g. 'like' | 'love' | 'haha' | 'wow' | 'sad' | 'angry') vs count */
  reaction_counts: PropTypes.objectOf(PropTypes.number.isRequired),
  /** Provide a list of reaction options [{id: 'angry', emoji: 'angry'}] */
  reactionOptions: PropTypes.array,
  reactions: PropTypes.array,
  reverse: PropTypes.bool,
};

export default React.memo(ReactionsList);
