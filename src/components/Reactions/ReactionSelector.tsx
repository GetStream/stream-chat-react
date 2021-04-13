import React, { useCallback, useEffect, useRef, useState } from 'react';

import { isMutableRef } from './utils/utils';

import { AvatarProps, Avatar as DefaultAvatar } from '../Avatar';
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

export type ReactionSelectorProps<
  Re extends DefaultReactionType = DefaultReactionType,
  Us extends DefaultUserType<Us> = DefaultUserType
> = {
  /**
   * Custom UI component to display user avatar.
   *
   * Defaults to and accepts same props as: [Avatar](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Avatar/Avatar.tsx)
   * */
  Avatar?: React.ElementType<AvatarProps>;
  /** Enable the avatar display */
  detailedView?: boolean;
  /**
   * Handler to set/unset reaction on message.
   *
   * @param type e.g. 'like' | 'love' | 'haha' | 'wow' | 'sad' | 'angry'
   * */
  handleReaction?: (reactionType: string, event: React.BaseSyntheticEvent) => Promise<void>;
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
  latest_reactions?: ReactionResponse<Re, Us>[];
  own_reactions?: ReactionResponse<Re, Us>[] | null;
  /** Object/map of reaction id/type (e.g. 'like' | 'love' | 'haha' | 'wow' | 'sad' | 'angry') vs count */
  reaction_counts?: { [key: string]: number };
  /** Provide a list of reaction options [{id: 'angry', emoji: 'angry'}] */
  reactionOptions?: MinimalEmoji[];
  /** Adds a CSS class that changes the horizontal positioning to the opposite (right: 0), defaults to false (left: 0) */
  reverse?: boolean;
};

/**
 * Component that allows a user to select a reaction.
 */
const UnMemoizedReactionSelector = React.forwardRef(
  <
    At extends DefaultAttachmentType = DefaultAttachmentType,
    Ch extends DefaultChannelType = DefaultChannelType,
    Co extends DefaultCommandType = DefaultCommandType,
    Ev extends DefaultEventType = DefaultEventType,
    Me extends DefaultMessageType = DefaultMessageType,
    Re extends DefaultReactionType = DefaultReactionType,
    Us extends DefaultUserType<Us> = DefaultUserType
  >(
    props: ReactionSelectorProps<Re, Us>,
    ref: React.ForwardedRef<HTMLDivElement | null>,
  ) => {
    const {
      Avatar = DefaultAvatar,
      detailedView = true,
      handleReaction,
      latest_reactions,
      reaction_counts,
      reactionOptions: reactionOptionsProp,
      reverse = false,
    } = props;

    const { emojiConfig } = useChannelStateContext<At, Ch, Co, Ev, Me, Re, Us>();
    const { Emoji } = useComponentContext<At, Ch, Co, Ev, Me, Re, Us>();

    const { defaultMinimalEmojis, emojiData: fullEmojiData, emojiSetDef } = emojiConfig || {};

    const emojiData = getStrippedEmojiData(fullEmojiData);
    const reactionOptions = reactionOptionsProp || defaultMinimalEmojis;

    const [tooltipReactionType, setTooltipReactionType] = useState<string | null>(null);
    const [tooltipPositions, setTooltipPositions] = useState<{
      arrow: number;
      tooltip: number;
    } | null>(null);

    const targetRef = useRef<HTMLDivElement | null>(null);
    const tooltipRef = useRef<HTMLDivElement | null>(null);

    const showTooltip = useCallback((e, reactionType: string) => {
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

        const container = isMutableRef(ref) ? ref.current?.getBoundingClientRect() : null;

        if (!tooltip || !target || !container) return;

        const tooltipPosition =
          tooltip.width === container.width || tooltip.x < container.x
            ? 0
            : target.left + target.width / 2 - container.left - tooltip.width / 2;

        const arrowPosition = target.x - tooltip.x + target.width / 2 - tooltipPosition;

        setTooltipPositions({
          arrow: arrowPosition,
          tooltip: tooltipPosition,
        });
      }
    }, [tooltipReactionType, ref]);

    const getUsersPerReactionType = (type: string | null) =>
      latest_reactions
        ?.map((reaction) => {
          if (reaction.type === type) {
            return reaction.user?.name || reaction.user?.id;
          }
          return null;
        })
        .filter(Boolean);

    const getLatestUserForReactionType = (type: string | null) =>
      latest_reactions?.find((reaction) => reaction.type === type && !!reaction.user)?.user ||
      undefined;

    return (
      <div
        className={`str-chat__reaction-selector ${
          reverse ? 'str-chat__reaction-selector--reverse' : ''
        }`}
        data-testid='reaction-selector'
        ref={ref}
      >
        {!!tooltipReactionType && detailedView && (
          <div
            className='str-chat__reaction-selector-tooltip'
            ref={tooltipRef}
            style={{
              left: tooltipPositions?.tooltip,
              visibility: tooltipPositions ? 'visible' : 'hidden',
            }}
          >
            <div className='arrow' style={{ left: tooltipPositions?.arrow }} />
            {getUsersPerReactionType(tooltipReactionType)?.map((user, i, users) => (
              <span className='latest-user-username' key={`key-${i}-${user}`}>
                {`${user}${i < users.length - 1 ? ', ' : ''}`}
              </span>
            ))}
          </div>
        )}
        <ul className='str-chat__message-reactions-list'>
          {reactionOptions?.map((reactionOption) => {
            const latestUser = getLatestUserForReactionType(reactionOption.id);
            const count = reaction_counts && reaction_counts[reactionOption.id];

            return (
              <li
                className='str-chat__message-reactions-list-item'
                data-text={reactionOption.id}
                key={`item-${reactionOption.id}`}
                onClick={(event) => handleReaction && handleReaction(reactionOption.id, event)}
              >
                {!!count && detailedView && (
                  <>
                    <div
                      className='latest-user'
                      onClick={hideTooltip}
                      onMouseEnter={(e) => showTooltip(e, reactionOption.id)}
                      onMouseLeave={hideTooltip}
                    >
                      {latestUser ? (
                        <Avatar image={latestUser.image} name={latestUser.name} size={20} />
                      ) : (
                        <div className='latest-user-not-found' />
                      )}
                    </div>
                  </>
                )}
                {Emoji && (
                  <Emoji
                    // @ts-expect-error
                    emoji={reactionOption}
                    {...emojiSetDef}
                    // @ts-expect-error
                    data={emojiData}
                  />
                )}
                {Boolean(count) && detailedView && (
                  <span className='str-chat__message-reactions-list-item__count'>
                    {count || ''}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    );
  },
);

/**
 * Component that allows you to select a reaction.
 */
export const ReactionSelector = React.memo(
  UnMemoizedReactionSelector,
) as typeof UnMemoizedReactionSelector;
