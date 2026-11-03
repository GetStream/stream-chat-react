import type React from 'react';
import { useMemo } from 'react';
import throttle from 'lodash.throttle';

import { useChannel, useChatContext, useComponentContext } from '../../../context';
import {
  defaultReactionOptions,
  getEmojiCodeByReactionType,
} from '../../Reactions/reactionOptions';
import { useThreadContext } from '../../Threads';

import type { LocalMessage, ReactionResponse } from 'stream-chat';

export const reactionHandlerWarning = `Reaction handler was called, but it is missing one of its required arguments.
Make sure the hook is initialized with a valid message.`;

type ToggleReactionParams = {
  add: boolean;
  emojiCode?: string;
  messageId: string;
  type: string;
};

export const useReactionHandler = (message?: LocalMessage) => {
  const channel = useChannel();
  const thread = useThreadContext();
  const { client } = useChatContext();
  const { reactionOptions = defaultReactionOptions } = useComponentContext();

  const { messageOperations } = thread ?? channel;

  // One throttle per message and reaction type, kept per `messageOperations` so it holds across the
  // re-render each optimistic update causes. Repeated toggles of one reaction are throttled; a
  // different reaction is not held back by them.
  const toggleReaction = useMemo(() => {
    const send = async ({ add, emojiCode, messageId, type }: ToggleReactionParams) => {
      try {
        if (add) {
          await messageOperations.addReaction({
            messageId,
            // The native emoji, sent as `emoji_code` so push notifications in mobile SDKs can render it.
            reaction: { type, ...(emojiCode && { emoji_code: emojiCode }) },
          });
        } else {
          await messageOperations.deleteReaction({ messageId, type });
        }
      } catch {
        // A failed reaction shows no error: `messageOperations` has already rolled back the
        // optimistic change, unless the request is queued for replay.
      }
    };
    const throttledByReaction = new Map<
      string,
      (params: ToggleReactionParams) => Promise<void> | undefined
    >();

    return (params: ToggleReactionParams) => {
      const key = `${params.messageId}:${params.type}`;
      let throttled = throttledByReaction.get(key);
      if (!throttled) {
        throttled = throttle(send, 1000);
        throttledByReaction.set(key, throttled);
      }
      return throttled(params);
    };
  }, [messageOperations]);

  return async (reactionType: string, event?: React.BaseSyntheticEvent) => {
    if (event?.preventDefault) {
      event.preventDefault();
    }

    if (!message) {
      return console.warn(reactionHandlerWarning);
    }

    let userExistingReaction = null as unknown as ReactionResponse;

    if (message.own_reactions) {
      message.own_reactions.forEach((reaction) => {
        // `own_reactions` should only hold the current user's reactions; the check guards
        // against a bad message update breaking reactions.
        if (
          reaction.user &&
          client.userID === reaction.user.id &&
          reaction.type === reactionType
        ) {
          userExistingReaction = reaction;
        } else if (reaction.user && client.userID !== reaction.user.id) {
          console.warn(
            `message.own_reactions contained reactions from a different user, this indicates a bug`,
          );
        }
      });
    }

    try {
      if (userExistingReaction) {
        await toggleReaction({
          add: false,
          messageId: message.id,
          type: userExistingReaction.type,
        });
      } else {
        await toggleReaction({
          add: true,
          emojiCode: getEmojiCodeByReactionType(reactionOptions, reactionType),
          messageId: message.id,
          type: reactionType,
        });
      }
    } catch (error) {
      console.log({ error });
    }
  };
};
