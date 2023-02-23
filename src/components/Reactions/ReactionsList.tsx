import React, { ComponentProps, useState } from 'react';
import clsx from 'clsx';

import type { ReactionResponse } from 'stream-chat';

import { useMessageContext } from '../../context/MessageContext';
import { useChatContext } from '../../context/ChatContext';
import { useProcessReactions } from './hooks/useProcessReactions';
import { PopperTooltip } from '../Tooltip';
import { useEnterLeaveHandlers } from '../Tooltip/hooks';

import type { ReactEventHandler } from '../Message/types';
import type { DefaultStreamChatGenerics } from '../../types/types';
import type { ReactionOptions } from './reactionOptions';

export type ReactionsListProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
> = {
  /** Custom on click handler for an individual reaction, defaults to `onReactionListClick` from the `MessageContext` */
  onClick?: ReactEventHandler;
  /** An array of the own reaction objects to distinguish own reactions visually */
  own_reactions?: ReactionResponse<StreamChatGenerics>[];
  /** An object that keeps track of the count of each type of reaction on a message */
  reaction_counts?: Record<string, number>;
  /** A list of the currently supported reactions on a message */
  reactionOptions?: ReactionOptions;
  /** An array of the reaction objects to display in the list */
  reactions?: ReactionResponse<StreamChatGenerics>[];
  /** Display the reactions in the list in reverse order, defaults to false */
  reverse?: boolean;
};

const ButtonWithTooltip = ({
  children,
  onMouseEnter,
  onMouseLeave,
  ...rest
}: Omit<ComponentProps<'button'>, 'ref'>) => {
  const [referenceElement, setReferenceElement] = useState<HTMLButtonElement | null>(null);

  const { handleEnter, handleLeave, tooltipVisible } = useEnterLeaveHandlers({
    onMouseEnter,
    onMouseLeave,
  });

  const { themeVersion } = useChatContext('ButtonWithTooltip');

  return (
    <>
      {themeVersion === '2' && (
        <PopperTooltip referenceElement={referenceElement} visible={tooltipVisible}>
          {rest.title}
        </PopperTooltip>
      )}
      <button
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
        ref={setReferenceElement}
        {...rest}
      >
        {children}
      </button>
    </>
  );
};

const UnMemoizedReactionsList = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>(
  props: ReactionsListProps<StreamChatGenerics>,
) => {
  const { onClick, reverse = false, ...rest } = props;

  const { onReactionListClick } = useMessageContext<StreamChatGenerics>('ReactionsList');

  const {
    aggregatedUserNamesByType,
    getEmojiByReactionType,
    iHaveReactedWithReaction,
    latestReactions,
    latestReactionTypes,
    reactionCounts,
    supportedReactionsArePresent,
    totalReactionCount,
  } = useProcessReactions(rest);

  if (!latestReactions.length) return null;

  if (!supportedReactionsArePresent) return null;

  return (
    <div
      aria-label='Reaction list'
      className={clsx('str-chat__reaction-list str-chat__message-reactions-container', {
        'str-chat__reaction-list--reverse': reverse,
      })}
      data-testid='reaction-list'
      onClick={onClick || onReactionListClick}
      onKeyUp={onClick || onReactionListClick}
      role='figure'
    >
      <ul className='str-chat__message-reactions'>
        {latestReactionTypes.map((reactionType) => {
          const ReactionOption = getEmojiByReactionType(reactionType);
          const isOwnReaction = iHaveReactedWithReaction(reactionType);
          return (
            ReactionOption && (
              <li
                className={clsx('str-chat__message-reaction', {
                  'str-chat__message-reaction-own': isOwnReaction,
                })}
                key={reactionType}
              >
                <ButtonWithTooltip
                  aria-label={`Reactions: ${reactionType}`}
                  data-testid={`reactions-list-button-${reactionType}`}
                  title={aggregatedUserNamesByType[reactionType].join(', ')}
                  type='button'
                >
                  <span className='str-chat__message-reaction-emoji'>
                    <ReactionOption.Component />
                  </span>
                  &nbsp;
                  <span
                    className='str-chat__message-reaction-count'
                    data-testclass='reaction-list-reaction-count'
                  >
                    {reactionCounts[reactionType]}
                  </span>
                </ButtonWithTooltip>
              </li>
            )
          );
        })}
        <li>
          <span className='str-chat__reaction-list--counter'>{totalReactionCount}</span>
        </li>
      </ul>
    </div>
  );
};

/**
 * Component that displays a list of reactions on a message.
 */
export const ReactionsList = React.memo(UnMemoizedReactionsList) as typeof UnMemoizedReactionsList;
