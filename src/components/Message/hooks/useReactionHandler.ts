import type React from 'react';
import { useCallback } from 'react';
import throttle from 'lodash.throttle';

import { useThreadContext } from '../../Threads';
import { useChannelActionContext } from '../../../context/ChannelActionContext';
import { useChannelStateContext } from '../../../context/ChannelStateContext';
import { useChatContext } from '../../../context/ChatContext';

import type { LocalMessage, Reaction, ReactionResponse } from 'stream-chat';

export const reactionHandlerWarning = `Reaction handler was called, but it is missing one of its required arguments.
Make sure the ChannelAction and ChannelState contexts are properly set and the hook is initialized with a valid message.`;

export const useReactionHandler = (message?: LocalMessage) => {
  const thread = useThreadContext();
  const { updateMessage } = useChannelActionContext('useReactionHandler');
  const { channel, channelCapabilities } = useChannelStateContext('useReactionHandler');
  const { client } = useChatContext('useReactionHandler');

  const createMessagePreview = useCallback(
    (add: boolean, reaction: ReactionResponse, message: LocalMessage): LocalMessage => {
      const newReactionGroups = message?.reaction_groups || {};
      const reactionType = reaction.type;
      const hasReaction = !!newReactionGroups[reactionType];

      if (add) {
        const timestamp = new Date().toISOString();
        newReactionGroups[reactionType] = hasReaction
          ? {
              ...newReactionGroups[reactionType],
              count: newReactionGroups[reactionType].count + 1,
            }
          : {
              count: 1,
              first_reaction_at: timestamp,
              last_reaction_at: timestamp,
              sum_scores: 1,
            };
      } else {
        if (hasReaction && newReactionGroups[reactionType].count > 1) {
          newReactionGroups[reactionType] = {
            ...newReactionGroups[reactionType],
            count: newReactionGroups[reactionType].count - 1,
          };
        } else {
          delete newReactionGroups[reactionType];
        }
      }

      const newReactions: ReactionResponse[] | undefined = add
        ? [reaction, ...(message?.latest_reactions || [])]
        : message.latest_reactions?.filter(
            (item) => !(item.type === reaction.type && item.user_id === reaction.user_id),
          );

      const newOwnReactions = add
        ? [reaction, ...(message?.own_reactions || [])]
        : message?.own_reactions?.filter((item) => item.type !== reaction.type);

      return {
        ...message,
        latest_reactions: newReactions || message.latest_reactions,
        own_reactions: newOwnReactions,
        reaction_groups: newReactionGroups,
      };
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [client.user, client.userID],
  );

  const createReactionPreview = (type: string) => ({
    message_id: message?.id,
    score: 1,
    type,
    user: client.user,
    user_id: client.user?.id,
  });

  const toggleReaction = throttle(async (id: string, type: string, add: boolean) => {
    if (!message || !channelCapabilities['send-reaction']) return;

    const newReaction = createReactionPreview(type) as ReactionResponse;
    const tempMessage = createMessagePreview(add, newReaction, message);

    try {
      updateMessage(tempMessage);
      thread?.upsertReplyLocally({ message: tempMessage });

      const messageResponse = add
        ? await channel.sendReaction(id, { type } as Reaction)
        : await channel.deleteReaction(id, type);

      // seems useless as we're expecting WS event to come in and replace this anyway
      updateMessage(messageResponse.message);
    } catch (error) {
      // revert to the original message if the API call fails
      updateMessage(message);
      thread?.upsertReplyLocally({ message });
    }
  }, 1000);

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
        // own user should only ever contain the current user id
        // just in case we check to prevent bugs with message updates from breaking reactions
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
        await toggleReaction(message.id, userExistingReaction.type, false);
      } else {
        await toggleReaction(message.id, reactionType, true);
      }
    } catch (error) {
      console.log({ error });
    }
  };
};
