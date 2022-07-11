import React, { Suspense, useMemo } from 'react';
import clsx from 'clsx';

import { getStrippedEmojiData, ReactionEmoji } from '../Channel/emojiData';

import { useEmojiContext } from '../../context/EmojiContext';
import { useMessageContext } from '../../context/MessageContext';

import type { NimbleEmojiProps } from 'emoji-mart';
import type { ReactionResponse } from 'stream-chat';

import type { ReactEventHandler } from '../Message/types';

import type { DefaultStreamChatGenerics } from '../../types/types';

export type ReactionsListProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
> = {
  /** Additional props to be passed to the [NimbleEmoji](https://github.com/missive/emoji-mart/blob/master/src/components/emoji/nimble-emoji.js) component from `emoji-mart` */
  additionalEmojiProps?: Partial<NimbleEmojiProps>;
  /** Custom on click handler for an individual reaction, defaults to `onReactionListClick` from the `MessageContext` */
  onClick?: ReactEventHandler;
  /** An object that keeps track of the count of each type of reaction on a message */
  reaction_counts?: { [key: string]: number };
  /** A list of the currently supported reactions on a message */
  reactionOptions?: ReactionEmoji[];
  /** An array of the reaction objects to display in the list */
  reactions?: ReactionResponse<StreamChatGenerics>[];
  /** Display the reactions in the list in reverse order, defaults to false */
  reverse?: boolean;
};

const UnMemoizedReactionsList = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>(
  props: ReactionsListProps<StreamChatGenerics>,
) => {
  const {
    additionalEmojiProps,
    onClick,
    reaction_counts: propReactionCounts,
    reactionOptions: propReactionOptions,
    reactions: propReactions,
    reverse = false,
  } = props;

  const { Emoji, emojiConfig } = useEmojiContext('ReactionsList');
  const { message, onReactionListClick } = useMessageContext<StreamChatGenerics>('ReactionsList');

  const { defaultMinimalEmojis, emojiData: fullEmojiData, emojiSetDef } = emojiConfig || {};

  const latestReactions = propReactions || message.latest_reactions || [];
  const reactionCounts = propReactionCounts || message.reaction_counts || {};
  const reactionOptions = propReactionOptions || defaultMinimalEmojis;
  const reactionsAreCustom = !!propReactionOptions?.length;

  const emojiData = useMemo(
    () => (reactionsAreCustom ? fullEmojiData : getStrippedEmojiData(fullEmojiData)),
    [fullEmojiData, reactionsAreCustom],
  );

  if (!latestReactions.length) return null;

  const messageReactionTypes = latestReactions.reduce((reactionTypes, { type }) => {
    if (reactionTypes.indexOf(type) === -1) {
      reactionTypes.push(type);
    }
    return reactionTypes;
  }, [] as string[]);

  const supportedReactionMap = reactionOptions.reduce((acc, { id }) => {
    acc[id] = true;
    return acc;
  }, {} as Record<string, boolean>);

  const supportedReactionsArePresent = messageReactionTypes.some(
    (type) => supportedReactionMap[type],
  );

  if (!supportedReactionsArePresent) return null;

  const totalReactionCount = Object.values(reactionCounts).reduce(
    (total, count) => total + count,
    0,
  );

  const iHaveReactedWithReaction = (reactionType: string) =>
    latestReactions.find((reaction) => reaction.type === reactionType);

  const getEmojiByReactionType = (type: string): ReactionEmoji | undefined =>
    reactionOptions.find((option: ReactionEmoji) => option.id === type);

  return (
    <div
      aria-label='Reaction list'
      className={clsx(
        'str-chat__reaction-list str-chat__message-reactions-container',
        reverse && 'str-chat__reaction-list--reverse',
      )}
      data-testid='reaction-list'
      onClick={onClick || onReactionListClick}
      onKeyUp={onClick || onReactionListClick}
      role='figure'
    >
      <ul className='str-chat__message-reactions'>
        {messageReactionTypes.map((reactionType) => {
          const emojiObject = getEmojiByReactionType(reactionType);
          const isOwnReaction = iHaveReactedWithReaction(reactionType);
          return emojiObject ? (
            <li
              className={clsx(
                'str-chat__message-reaction',
                isOwnReaction && 'str-chat__message-reaction-own',
              )}
              key={emojiObject.id}
            >
              <button aria-label={`Reactions: ${reactionType}`}>
                {
                  <Suspense fallback={null}>
                    <span className='str-chat__message-reaction-emoji'>
                      <Emoji
                        data={emojiData}
                        emoji={emojiObject}
                        size={16}
                        {...(reactionsAreCustom ? additionalEmojiProps : emojiSetDef)}
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
              </button>
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
