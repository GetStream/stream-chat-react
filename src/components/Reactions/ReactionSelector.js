// @ts-check
import React, {
  useState,
  useCallback,
  useRef,
  useImperativeHandle,
  useEffect,
} from 'react';
import PropTypes from 'prop-types';
import { NimbleEmoji } from 'emoji-mart';
import { Avatar as DefaultAvatar } from '../Avatar';

import { defaultMinimalEmojis, emojiSetDef, emojiData } from '../../utils';

/** @type {React.ForwardRefRenderFunction<HTMLDivElement | null, import("types").ReactionSelectorProps>} */
const ReactionSelectorWithRef = (
  {
    Avatar = DefaultAvatar,
    latest_reactions,
    reaction_counts,
    reactionOptions = defaultMinimalEmojis,
    reverse = false,
    handleReaction,
    detailedView = true,
  },
  ref,
) => {
  const [tooltipReactionType, setTooltipReactionType] = useState(null);
  const [tooltipPositions, setTooltipPositions] = useState(
    /** @type {{ tooltip: number, arrow: number } | null} */ (null),
  );
  const containerRef = useRef(/** @type {HTMLDivElement | null} */ (null));
  const tooltipRef = useRef(/** @type {HTMLDivElement | null} */ (null));
  const targetRef = useRef(/** @type {HTMLDivElement | null} */ (null));

  // @ts-ignore because it's okay for our ref to be null in the parent component.
  useImperativeHandle(ref, () => containerRef.current);

  const showTooltip = useCallback((e, reactionType) => {
    targetRef.current = e.target;
    setTooltipReactionType(reactionType);
  }, []);

  const hideTooltip = useCallback(() => {
    setTooltipReactionType(null);
    setTooltipPositions(null);
  }, []);

  useEffect(() => {
    if (tooltipReactionType) {
      const tooltip = tooltipRef.current?.getBoundingClientRect();
      const target = targetRef.current?.getBoundingClientRect();
      const container = containerRef.current?.getBoundingClientRect();

      if (!tooltip || !target || !container) return;

      const tooltipPosition =
        tooltip.width === container.width || tooltip.x < container.x
          ? 0
          : target.left + target.width / 2 - container.left - tooltip.width / 2;
      const arrowPosition =
        target.x - tooltip.x + target.width / 2 - tooltipPosition;
      setTooltipPositions({
        tooltip: tooltipPosition,
        arrow: arrowPosition,
      });
    }
  }, [tooltipReactionType, containerRef]);

  /**
   * @param {string | null} type
   * @returns {string[] | undefined}
   * */
  const getUsersPerReactionType = (type) =>
    /** @type {string[] | undefined} */ (latest_reactions
      ?.map((reaction) => {
        if (reaction.type === type) {
          return reaction.user?.name || reaction.user?.id;
        }
        return null;
      })
      .filter(Boolean));

  /**
   * @param {string | null} type
   * @returns {import("types").StreamChatReactClient['user'] | undefined}
   * */
  const getLatestUserForReactionType = (type) =>
    latest_reactions?.find(
      (reaction) => reaction.type === type && !!reaction.user,
    )?.user || undefined;

  return (
    <div
      data-testid="reaction-selector"
      className={`str-chat__reaction-selector ${
        reverse ? 'str-chat__reaction-selector--reverse' : ''
      }`}
      ref={containerRef}
    >
      {!!tooltipReactionType && detailedView && (
        <div
          className="str-chat__reaction-selector-tooltip"
          ref={tooltipRef}
          style={{
            left: tooltipPositions?.tooltip,
            visibility: tooltipPositions ? 'visible' : 'hidden',
          }}
        >
          <div className="arrow" style={{ left: tooltipPositions?.arrow }} />
          {getUsersPerReactionType(tooltipReactionType)?.map(
            (user, i, users) => (
              <span className="latest-user-username" key={`key-${i}-${user}`}>
                {`${user}${i < users.length - 1 ? ', ' : ''}`}
              </span>
            ),
          )}
        </div>
      )}
      <ul className="str-chat__message-reactions-list">
        {reactionOptions.map((reactionOption) => {
          const latestUser = getLatestUserForReactionType(reactionOption.id);

          const count = reaction_counts && reaction_counts[reactionOption.id];
          return (
            <li
              key={`item-${reactionOption.id}`}
              className="str-chat__message-reactions-list-item"
              data-text={reactionOption.id}
              onClick={() =>
                handleReaction && handleReaction(reactionOption.id)
              }
            >
              {!!count && detailedView && (
                <React.Fragment>
                  <div
                    className="latest-user"
                    onMouseEnter={(e) => showTooltip(e, reactionOption.id)}
                    onMouseLeave={hideTooltip}
                  >
                    {latestUser ? (
                      <Avatar
                        image={latestUser.image}
                        size={20}
                        name={latestUser.name}
                      />
                    ) : (
                      <div className="latest-user-not-found" />
                    )}
                  </div>
                </React.Fragment>
              )}
              <NimbleEmoji
                // @ts-ignore because emoji-mart types don't support specifying
                // spriteUrl instead of imageUrl, while the implementation does
                emoji={reactionOption}
                {...emojiSetDef}
                data={emojiData}
              />

              {Boolean(count) && detailedView && (
                <span className="str-chat__message-reactions-list-item__count">
                  {count || ''}
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
};

const ReactionSelector = React.forwardRef(ReactionSelectorWithRef);

ReactionSelector.propTypes = {
  /**
   * Custom UI component to display user avatar
   *
   * Defaults to and accepts same props as: [Avatar](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Avatar/Avatar.js)
   * */
  Avatar: /** @type {PropTypes.Validator<React.ElementType<import('types').AvatarProps>>} */ (PropTypes.elementType),
  /**
   * Array of latest reactions.
   * Reaction object has following structure:
   *
   * ```json
   * {
   *  "type": "love",
   *  "user_id": "demo_user_id",
   *  "user": {
   *    ...userObject
   *  },
   *  "created_at": "datetime";
   * }
   * ```
   * */
  latest_reactions: PropTypes.array,
  /** Object/map of reaction id/type (e.g. 'like' | 'love' | 'haha' | 'wow' | 'sad' | 'angry') vs count */
  reaction_counts: PropTypes.objectOf(PropTypes.number.isRequired),
  /** Provide a list of reaction options [{id: 'angry', emoji: 'angry'}] */
  reactionOptions: PropTypes.array,
  reverse: PropTypes.bool,
  /**
   * Handler to set/unset reaction on message.
   *
   * @param type e.g. 'like' | 'love' | 'haha' | 'wow' | 'sad' | 'angry'
   * */
  handleReaction: PropTypes.func.isRequired,
  /** Enable the avatar display */
  detailedView: PropTypes.bool,
};

export default React.memo(ReactionSelector);
