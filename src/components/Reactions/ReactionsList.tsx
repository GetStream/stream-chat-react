import React, { ComponentProps, Suspense, useState } from 'react';
import clsx from 'clsx';

import { useEmojiContext } from '../../context/EmojiContext';
import { useMessageContext } from '../../context/MessageContext';
import { useChatContext } from '../../context/ChatContext';
import { useProcessReactions } from './hooks/useProcessReactions';

import type { NimbleEmojiProps } from 'emoji-mart';
import type { ReactionResponse } from 'stream-chat';

import type { ReactEventHandler } from '../Message/types';

import type { DefaultStreamChatGenerics } from '../../types/types';
import type { ReactionEmoji } from '../Channel/emojiData';

import { PopperTooltip } from '../Tooltip';
import { useEnterLeaveHandlers } from '../Tooltip/hooks';

export type ReactionsListProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
> = {
  /** Additional props to be passed to the [NimbleEmoji](https://github.com/missive/emoji-mart/blob/master/src/components/emoji/nimble-emoji.js) component from `emoji-mart` */
  additionalEmojiProps?: Partial<NimbleEmojiProps>;
  /** Custom on click handler for an individual reaction, defaults to `onReactionListClick` from the `MessageContext` */
  onClick?: ReactEventHandler;
  /** An array of the own reaction objects to distinguish own reactions visually */
  own_reactions?: ReactionResponse<StreamChatGenerics>[];
  /** An object that keeps track of the count of each type of reaction on a message */
  reaction_counts?: { [key: string]: number };
  /** A list of the currently supported reactions on a message */
  reactionOptions?: ReactionEmoji[];
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

  const { Emoji, emojiConfig } = useEmojiContext('ReactionsList');
  const { onReactionListClick } = useMessageContext<StreamChatGenerics>('ReactionsList');

  const {
    additionalEmojiProps,
    aggregatedUserNamesByType,
    emojiData,
    getEmojiByReactionType,
    iHaveReactedWithReaction,
    latestReactions,
    latestReactionTypes,
    reactionCounts,
    supportedReactionsArePresent,
    totalReactionCount,
  } = useProcessReactions({ emojiConfig, ...rest });

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
          const emojiObject = getEmojiByReactionType(reactionType);
          const isOwnReaction = iHaveReactedWithReaction(reactionType);
          return emojiObject ? (
            <li
              className={clsx('str-chat__message-reaction', {
                'str-chat__message-reaction-own': isOwnReaction,
              })}
              key={emojiObject.id}
            >
              <ButtonWithTooltip
                aria-label={`Reactions: ${reactionType}`}
                title={aggregatedUserNamesByType[reactionType].join(', ')}
                type='button'
              >
                {
                  <Suspense fallback={null}>
                    <span className='str-chat__message-reaction-emoji'>
                      <Emoji
                        data={emojiData}
                        emoji={emojiObject}
                        size={16}
                        {...additionalEmojiProps}
                      />
                    </span>
                  </Suspense>
                }
                &nbsp;
                <span
                  className='str-chat__message-reaction-count'
                  data-testclass='reaction-list-reaction-count'
                >
                  {reactionCounts[reactionType]}
                </span>
              </ButtonWithTooltip>
            </li>
          ) : null;
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
