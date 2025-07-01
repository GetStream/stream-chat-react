import type { PropsWithChildren } from 'react';
import React, { useState } from 'react';
import clsx from 'clsx';

import type { ReactionGroupResponse, ReactionResponse } from 'stream-chat';
import type { MessageContextValue } from '../../context/MessageContext';
import { useMessageContext } from '../../context/MessageContext';
import { useProcessReactions } from './hooks/useProcessReactions';
import { useEnterLeaveHandlers } from '../Tooltip/hooks';
import { PopperTooltip } from '../Tooltip';

import type { ReactionOptions } from './reactionOptions';

type WithTooltipProps = {
  title: React.ReactNode;
  onMouseEnter?: React.MouseEventHandler;
  onMouseLeave?: React.MouseEventHandler;
};

const WithTooltip = ({
  children,
  onMouseEnter,
  onMouseLeave,
  title,
}: PropsWithChildren<WithTooltipProps>) => {
  const [referenceElement, setReferenceElement] = useState<HTMLSpanElement | null>(null);
  const { handleEnter, handleLeave, tooltipVisible } = useEnterLeaveHandlers({
    onMouseEnter,
    onMouseLeave,
  });

  return (
    <>
      <PopperTooltip referenceElement={referenceElement} visible={tooltipVisible}>
        {title}
      </PopperTooltip>
      <span
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
        ref={setReferenceElement}
      >
        {children}
      </span>
    </>
  );
};

export type SimpleReactionsListProps = Partial<
  Pick<MessageContextValue, 'handleFetchReactions' | 'handleReaction'>
> & {
  /** An array of the own reaction objects to distinguish own reactions visually */
  own_reactions?: ReactionResponse[];
  /**
   * An object that keeps track of the count of each type of reaction on a message
   * @deprecated This override value is no longer taken into account. Use `reaction_groups` to override reaction counts instead.
   * */
  reaction_counts?: Record<string, number>;
  /** An object containing summary for each reaction type on a message */
  reaction_groups?: Record<string, ReactionGroupResponse>;
  /** A list of the currently supported reactions on a message */
  reactionOptions?: ReactionOptions;
  /** An array of the reaction objects to display in the list */
  reactions?: ReactionResponse[];
};

const UnMemoizedSimpleReactionsList = (props: SimpleReactionsListProps) => {
  const { handleReaction: propHandleReaction, ...rest } = props;

  const { handleReaction: contextHandleReaction } =
    useMessageContext('SimpleReactionsList');

  const { existingReactions, hasReactions, totalReactionCount } =
    useProcessReactions(rest);

  const handleReaction = propHandleReaction || contextHandleReaction;

  if (!hasReactions) return null;

  return (
    <div className='str-chat__message-reactions-container'>
      <ul
        className='str-chat__simple-reactions-list str-chat__message-reactions'
        data-testid='simple-reaction-list'
      >
        {existingReactions.map(
          ({ EmojiComponent, isOwnReaction, latestReactedUserNames, reactionType }) => {
            const tooltipContent = latestReactedUserNames.join(', ');

            return (
              EmojiComponent && (
                <li
                  className={clsx('str-chat__simple-reactions-list-item', {
                    'str-chat__message-reaction-own': isOwnReaction,
                  })}
                  key={reactionType}
                  onClick={(event) => handleReaction(reactionType, event)}
                  onKeyUp={(event) => handleReaction(reactionType, event)}
                >
                  <WithTooltip title={tooltipContent}>
                    <EmojiComponent />
                  </WithTooltip>
                </li>
              )
            );
          },
        )}
        {
          <li className='str-chat__simple-reactions-list-item--last-number'>
            {totalReactionCount}
          </li>
        }
      </ul>
    </div>
  );
};

export const SimpleReactionsList = React.memo(
  UnMemoizedSimpleReactionsList,
) as typeof UnMemoizedSimpleReactionsList;
