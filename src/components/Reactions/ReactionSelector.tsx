import React, { useCallback, useEffect, useRef, useState } from 'react';
import clsx from 'clsx';

import { isMutableRef } from './utils/utils';

import { AvatarProps, Avatar as DefaultAvatar } from '../Avatar';

import { useComponentContext } from '../../context/ComponentContext';
import { useMessageContext } from '../../context/MessageContext';

import type { ReactionResponse } from 'stream-chat';

import type { DefaultStreamChatGenerics } from '../../types/types';
import { defaultReactionOptions, ReactionOptions } from './reactionOptions';

export type ReactionSelectorProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
> = {
  /** Custom UI component to display user avatar, defaults to and accepts same props as: [Avatar](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Avatar/Avatar.tsx) */
  Avatar?: React.ElementType<AvatarProps>;
  /** If true, shows the user's avatar with the reaction */
  detailedView?: boolean;
  /** Function that adds/removes a reaction on a message (overrides the function stored in `MessageContext`) */
  handleReaction?: (reactionType: string, event: React.BaseSyntheticEvent) => Promise<void>;
  /** An array of the reaction objects to display in the list */
  latest_reactions?: ReactionResponse<StreamChatGenerics>[];
  /** An array of the own reaction objects to distinguish own reactions visually */
  own_reactions?: ReactionResponse<StreamChatGenerics>[];
  /** An object that keeps track of the count of each type of reaction on a message */
  reaction_counts?: Record<string, number>;
  /** A list of the currently supported reactions on a message */
  reactionOptions?: ReactionOptions;
  /** If true, adds a CSS class that reverses the horizontal positioning of the selector */
  reverse?: boolean;
};

const UnMemoizedReactionSelector = React.forwardRef(
  <StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics>(
    props: ReactionSelectorProps<StreamChatGenerics>,
    ref: React.ForwardedRef<HTMLDivElement | null>,
  ) => {
    const {
      Avatar: propAvatar,
      detailedView = true,
      handleReaction: propHandleReaction,
      latest_reactions: propLatestReactions,
      own_reactions: propOwnReactions,
      reaction_counts: propReactionCounts,
      reactionOptions = defaultReactionOptions,
      reverse = false,
    } = props;

    const { Avatar: contextAvatar } = useComponentContext<StreamChatGenerics>('ReactionSelector');
    const {
      handleReaction: contextHandleReaction,
      message,
    } = useMessageContext<StreamChatGenerics>('ReactionSelector');

    const Avatar = propAvatar || contextAvatar || DefaultAvatar;
    const handleReaction = propHandleReaction || contextHandleReaction;
    const latestReactions = propLatestReactions || message?.latest_reactions || [];
    const ownReactions = propOwnReactions || message?.own_reactions || [];
    const reactionCounts = propReactionCounts || message?.reaction_counts || {};

    const [tooltipReactionType, setTooltipReactionType] = useState<string | null>(null);
    const [tooltipPositions, setTooltipPositions] = useState<{
      arrow: number;
      tooltip: number;
    } | null>(null);

    const targetRef = useRef<HTMLDivElement | null>(null);
    const tooltipRef = useRef<HTMLDivElement | null>(null);

    const showTooltip = useCallback(
      (event: React.MouseEvent<HTMLDivElement>, reactionType: string) => {
        targetRef.current = event.currentTarget;
        setTooltipReactionType(reactionType);
      },
      [],
    );

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
      latestReactions
        .map((reaction) => {
          if (reaction.type === type) {
            return reaction.user?.name || reaction.user?.id;
          }
          return null;
        })
        .filter(Boolean);

    const iHaveReactedWithReaction = (reactionType: string) =>
      ownReactions.find((reaction) => reaction.type === reactionType);

    const getLatestUserForReactionType = (type: string | null) =>
      latestReactions.find((reaction) => reaction.type === type && !!reaction.user)?.user ||
      undefined;

    return (
      <div
        className={clsx('str-chat__reaction-selector str-chat__message-reaction-selector', {
          'str-chat__reaction-selector--reverse': reverse,
        })}
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
        <ul className='str-chat__message-reactions-list str-chat__message-reactions-options'>
          {Object.entries(reactionOptions).map(
            ([reactionType, { Component, name: reactionName }]) => {
              const latestUser = getLatestUserForReactionType(reactionType);
              const count = reactionCounts && reactionCounts[reactionType];
              return (
                <li key={`item-${reactionType}`}>
                  <button
                    aria-label={`Select Reaction: ${reactionName || reactionType}`}
                    className={clsx(
                      'str-chat__message-reactions-list-item str-chat__message-reactions-option',
                      {
                        'str-chat__message-reactions-option-selected': iHaveReactedWithReaction(
                          reactionType,
                        ),
                      },
                    )}
                    data-text={reactionType}
                    onClick={(event) => handleReaction(reactionType, event)}
                  >
                    {!!count && detailedView && (
                      <div
                        className='latest-user str-chat__message-reactions-last-user'
                        onClick={hideTooltip}
                        onMouseEnter={(e) => showTooltip(e, reactionType)}
                        onMouseLeave={hideTooltip}
                      >
                        {latestUser ? (
                          <Avatar
                            image={latestUser.image}
                            name={latestUser.name}
                            size={20}
                            user={latestUser}
                          />
                        ) : (
                          <div className='latest-user-not-found' />
                        )}
                      </div>
                    )}
                    <span className='str-chat__message-reaction-emoji'>
                      <Component />
                    </span>
                    {Boolean(count) && detailedView && (
                      <span className='str-chat__message-reactions-list-item__count'>
                        {count || ''}
                      </span>
                    )}
                  </button>
                </li>
              );
            },
          )}
        </ul>
      </div>
    );
  },
);

/**
 * Component that allows a user to select a reaction.
 */
export const ReactionSelector = React.memo(
  UnMemoizedReactionSelector,
) as typeof UnMemoizedReactionSelector;
