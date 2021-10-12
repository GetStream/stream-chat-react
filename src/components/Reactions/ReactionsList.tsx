import React, { Suspense, useMemo } from 'react';

import { getStrippedEmojiData, ReactionEmoji } from '../Channel/emojiData';

import { useEmojiContext } from '../../context/EmojiContext';
import { useMessageContext } from '../../context/MessageContext';

import type { NimbleEmojiProps } from 'emoji-mart';
import type { ReactionResponse } from 'stream-chat';

import type { ReactEventHandler } from '../Message/types';

import type {
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
} from '../../types/types';

export type ReactionsListProps<
  Re extends DefaultReactionType = DefaultReactionType,
  Us extends DefaultUserType<Us> = DefaultUserType
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
  reactions?: ReactionResponse<Re, Us>[];
  /** Display the reactions in the list in reverse order, defaults to false */
  reverse?: boolean;
};

const UnMemoizedReactionsList = <
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends DefaultChannelType = DefaultChannelType,
  Co extends DefaultCommandType = DefaultCommandType,
  Ev extends DefaultEventType = DefaultEventType,
  Me extends DefaultMessageType = DefaultMessageType,
  Re extends DefaultReactionType = DefaultReactionType,
  Us extends DefaultUserType<Us> = DefaultUserType
>(
  props: ReactionsListProps<Re, Us>,
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
  const { message, onReactionListClick } = useMessageContext<At, Ch, Co, Ev, Me, Re, Us>(
    'ReactionsList',
  );

  const { defaultMinimalEmojis, emojiData: fullEmojiData, emojiSetDef } = emojiConfig || {};

  const reactions = propReactions || message.latest_reactions || [];
  const reactionCounts = propReactionCounts || message.reaction_counts || {};
  const reactionOptions = propReactionOptions || defaultMinimalEmojis;
  const reactionsAreCustom = !!propReactionOptions?.length;

  const emojiData = useMemo(
    () => (reactionsAreCustom ? fullEmojiData : getStrippedEmojiData(fullEmojiData)),
    [fullEmojiData, reactionsAreCustom],
  );

  if (!reactions.length) return null;

  const getTotalReactionCount = () =>
    Object.values(reactionCounts).reduce((total, count) => total + count, 0);

  const getCurrentMessageReactionTypes = () => {
    const reactionTypes: string[] = [];
    reactions.forEach(({ type }) => {
      if (reactionTypes.indexOf(type) === -1) {
        reactionTypes.push(type);
      }
    });
    return reactionTypes;
  };

  const getEmojiByReactionType = (type: string): ReactionEmoji | undefined => {
    const reactionEmoji = reactionOptions.find((option: ReactionEmoji) => option.id === type);
    return reactionEmoji;
  };

  const getSupportedReactionMap = () => {
    const reactionMap: Record<string, boolean> = {};
    reactionOptions.forEach(({ id }) => (reactionMap[id] = true));
    return reactionMap;
  };

  const messageReactionTypes = getCurrentMessageReactionTypes();
  const supportedReactionMap = getSupportedReactionMap();

  const supportedReactionsArePresent = messageReactionTypes.some(
    (type) => supportedReactionMap[type],
  );

  if (!supportedReactionsArePresent) return null;

  return (
    <div
      className={`str-chat__reaction-list ${reverse ? 'str-chat__reaction-list--reverse' : ''}`}
      data-testid='reaction-list'
      onClick={onClick || onReactionListClick}
    >
      <ul>
        {messageReactionTypes.map((reactionType) => {
          const emojiObject = getEmojiByReactionType(reactionType);

          return emojiObject ? (
            <li key={emojiObject.id}>
              {
                <Suspense fallback={null}>
                  <Emoji
                    data={emojiData}
                    emoji={emojiObject}
                    size={16}
                    {...(reactionsAreCustom ? additionalEmojiProps : emojiSetDef)}
                  />
                </Suspense>
              }
              &nbsp;
            </li>
          ) : null;
        })}
        <li>
          <span className='str-chat__reaction-list--counter'>{getTotalReactionCount()}</span>
        </li>
      </ul>
    </div>
  );
};

/**
 * Component that displays a list of reactions on a message.
 */
export const ReactionsList = React.memo(UnMemoizedReactionsList) as typeof UnMemoizedReactionsList;
