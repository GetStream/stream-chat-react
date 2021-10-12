import React, { Suspense, useMemo, useState } from 'react';

import { getStrippedEmojiData, ReactionEmoji } from '../Channel/emojiData';

import { useEmojiContext } from '../../context/EmojiContext';
import { useMessageContext } from '../../context/MessageContext';

import type { NimbleEmojiProps } from 'emoji-mart';
import type { ReactionResponse } from 'stream-chat';

import type {
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
} from '../../types/types';

export type SimpleReactionsListProps<
  Re extends DefaultReactionType = DefaultReactionType,
  Us extends DefaultUserType<Us> = DefaultUserType
> = {
  /** Additional props to be passed to the [NimbleEmoji](https://github.com/missive/emoji-mart/blob/master/src/components/emoji/nimble-emoji.js) component from `emoji-mart` */
  additionalEmojiProps?: Partial<NimbleEmojiProps>;
  /** Function that adds/removes a reaction on a message (overrides the function stored in `MessageContext`) */
  handleReaction?: (reactionType: string, event: React.BaseSyntheticEvent) => Promise<void>;
  /** An object that keeps track of the count of each type of reaction on a message */
  reaction_counts?: { [key: string]: number };
  /** A list of the currently supported reactions on a message */
  reactionOptions?: ReactionEmoji[];
  /** An array of the reaction objects to display in the list */
  reactions?: ReactionResponse<Re, Us>[];
};

const UnMemoizedSimpleReactionsList = <
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends DefaultChannelType = DefaultChannelType,
  Co extends DefaultCommandType = DefaultCommandType,
  Ev extends DefaultEventType = DefaultEventType,
  Me extends DefaultMessageType = DefaultMessageType,
  Re extends DefaultReactionType = DefaultReactionType,
  Us extends DefaultUserType<Us> = DefaultUserType
>(
  props: SimpleReactionsListProps<Re, Us>,
) => {
  const {
    additionalEmojiProps = {},
    handleReaction: propHandleReaction,
    reaction_counts: propReactionCounts,
    reactionOptions: propReactionOptions,
    reactions: propReactions,
  } = props;

  const { Emoji, emojiConfig } = useEmojiContext('SimpleReactionsList');
  const { handleReaction: contextHandleReaction, message } = useMessageContext<
    At,
    Ch,
    Co,
    Ev,
    Me,
    Re,
    Us
  >('SimpleReactionsList');

  const { defaultMinimalEmojis, emojiData: fullEmojiData, emojiSetDef } = emojiConfig || {};

  const [tooltipReactionType, setTooltipReactionType] = useState<string | undefined>(undefined);

  const handleReaction = propHandleReaction || contextHandleReaction;
  const reactions = propReactions || message.latest_reactions || [];
  const reactionCounts = propReactionCounts || message.reaction_counts || {};
  const reactionOptions = propReactionOptions || defaultMinimalEmojis;
  const reactionsAreCustom = !!propReactionOptions?.length;

  const emojiData = useMemo(
    () => (reactionsAreCustom ? fullEmojiData : getStrippedEmojiData(fullEmojiData)),
    [fullEmojiData, reactionsAreCustom],
  );

  if (!reactions.length) return null;

  const getUsersPerReactionType = (type: string) =>
    reactions
      .map((reaction) => {
        if (reaction.type === type) {
          return reaction.user?.name || reaction.user?.id;
        }
        return null;
      })
      .filter(Boolean);

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
    <ul
      className='str-chat__simple-reactions-list'
      data-testid='simple-reaction-list'
      onMouseLeave={() => setTooltipReactionType(undefined)}
    >
      {messageReactionTypes.map((reactionType, i) => {
        const emojiObject = getEmojiByReactionType(reactionType);

        return emojiObject ? (
          <li
            className='str-chat__simple-reactions-list-item'
            key={`${emojiObject.id}-${i}`}
            onClick={(event) => handleReaction(reactionType, event)}
          >
            <span onMouseEnter={() => setTooltipReactionType(reactionType)}>
              {
                <Suspense fallback={null}>
                  <Emoji
                    data={emojiData}
                    emoji={emojiObject}
                    size={13}
                    {...(reactionsAreCustom ? additionalEmojiProps : emojiSetDef)}
                  />
                </Suspense>
              }
              &nbsp;
            </span>
            {tooltipReactionType === emojiObject.id && (
              <div className='str-chat__simple-reactions-list-tooltip'>
                <div className='arrow' />
                {getUsersPerReactionType(tooltipReactionType)?.join(', ')}
              </div>
            )}
          </li>
        ) : null;
      })}
      {
        <li className='str-chat__simple-reactions-list-item--last-number'>
          {getTotalReactionCount()}
        </li>
      }
    </ul>
  );
};

export const SimpleReactionsList = React.memo(
  UnMemoizedSimpleReactionsList,
) as typeof UnMemoizedSimpleReactionsList;
