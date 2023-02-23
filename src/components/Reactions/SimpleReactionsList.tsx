import React, { PropsWithChildren, useState } from 'react';
import clsx from 'clsx';

import type { ReactionResponse } from 'stream-chat';

import { useChatContext } from '../../context/ChatContext';
import { useMessageContext } from '../../context/MessageContext';
import { useProcessReactions } from './hooks/useProcessReactions';
import { useEnterLeaveHandlers } from '../Tooltip/hooks';
import { PopperTooltip } from '../Tooltip';

import type { DefaultStreamChatGenerics } from '../../types/types';
import type { ReactionOptions } from './reactionOptions';

type WithTooltipProps = {
  onMouseEnter: React.MouseEventHandler;
  onMouseLeave: React.MouseEventHandler;
  title: React.ReactNode;
};

// todo: merge with ReactionsList/ButtonWithTooltip
// avoiding breaking change of replacing <span> with <button>
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

  const { themeVersion } = useChatContext('WithTooltip');

  return (
    <>
      {themeVersion === '2' && (
        <PopperTooltip referenceElement={referenceElement} visible={tooltipVisible}>
          {title}
        </PopperTooltip>
      )}
      <span onMouseEnter={handleEnter} onMouseLeave={handleLeave} ref={setReferenceElement}>
        {children}
      </span>
    </>
  );
};

export type SimpleReactionsListProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
> = {
  /** Function that adds/removes a reaction on a message (overrides the function stored in `MessageContext`) */
  handleReaction?: (reactionType: string, event: React.BaseSyntheticEvent) => Promise<void>;
  /** An array of the own reaction objects to distinguish own reactions visually */
  own_reactions?: ReactionResponse<StreamChatGenerics>[];
  /** An object that keeps track of the count of each type of reaction on a message */
  reaction_counts?: { [key: string]: number };
  /** A list of the currently supported reactions on a message */
  reactionOptions?: ReactionOptions;
  /** An array of the reaction objects to display in the list */
  reactions?: ReactionResponse<StreamChatGenerics>[];
};

const UnMemoizedSimpleReactionsList = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>(
  props: SimpleReactionsListProps<StreamChatGenerics>,
) => {
  const { handleReaction: propHandleReaction, ...rest } = props;

  const { handleReaction: contextHandleReaction } = useMessageContext<StreamChatGenerics>(
    'SimpleReactionsList',
  );

  const {
    getEmojiByReactionType,
    iHaveReactedWithReaction,
    latestReactions,
    latestReactionTypes,
    supportedReactionsArePresent,
    totalReactionCount,
  } = useProcessReactions(rest);

  const [tooltipReactionType, setTooltipReactionType] = useState<string | undefined>(undefined);
  const { themeVersion } = useChatContext('SimpleReactionsList');

  const handleReaction = propHandleReaction || contextHandleReaction;

  if (!latestReactions.length) return null;

  if (!supportedReactionsArePresent) return null;

  const getUsersPerReactionType = (type: string | undefined) =>
    latestReactions
      .map((reaction) => {
        if (type && reaction.type === type) {
          return reaction.user?.name || reaction.user?.id;
        }
        return null;
      })
      .filter(Boolean);

  return (
    <div className='str-chat__message-reactions-container'>
      <ul
        className='str-chat__simple-reactions-list str-chat__message-reactions'
        data-testid='simple-reaction-list'
        onMouseLeave={() => setTooltipReactionType(undefined)}
      >
        {latestReactionTypes.map((reactionType) => {
          const ReactionOption = getEmojiByReactionType(reactionType);
          const isOwnReaction = iHaveReactedWithReaction(reactionType);
          const tooltipVisible = tooltipReactionType === reactionType;
          const tooltipContent = getUsersPerReactionType(tooltipReactionType)?.join(', ');

          return (
            ReactionOption && (
              <li
                className={clsx('str-chat__simple-reactions-list-item', {
                  'str-chat__message-reaction-own': isOwnReaction,
                })}
                key={reactionType}
                onClick={(event) => handleReaction(reactionType, event)}
                onKeyUp={(event) => handleReaction(reactionType, event)}
              >
                <WithTooltip
                  onMouseEnter={() => setTooltipReactionType(reactionType)}
                  onMouseLeave={() => setTooltipReactionType(undefined)}
                  title={tooltipContent}
                >
                  <ReactionOption.Component />
                  &nbsp;
                  {tooltipVisible && themeVersion === '1' && (
                    <div className='str-chat__simple-reactions-list-tooltip'>
                      <div className='arrow' />
                      {tooltipContent}
                    </div>
                  )}
                </WithTooltip>
              </li>
            )
          );
        })}
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
