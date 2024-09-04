import React, { RefObject, useCallback, useEffect, useRef, useState } from 'react';
import throttle from 'lodash.throttle';

import { useChannelActionContext } from '../../../context/ChannelActionContext';
import { StreamMessage, useChannelStateContext } from '../../../context/ChannelStateContext';
import { useChatContext } from '../../../context/ChatContext';

import type { ReactEventHandler } from '../types';

import type { Reaction, ReactionResponse } from 'stream-chat';

import type { DefaultStreamChatGenerics } from '../../../types/types';

import { useThreadContext } from '../../Threads';

export const reactionHandlerWarning = `Reaction handler was called, but it is missing one of its required arguments.
Make sure the ChannelAction and ChannelState contexts are properly set and the hook is initialized with a valid message.`;

export const useReactionHandler = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>(
  message?: StreamMessage<StreamChatGenerics>,
) => {
  const thread = useThreadContext();
  const { updateMessage } = useChannelActionContext<StreamChatGenerics>('useReactionHandler');
  const { channel, channelCapabilities } = useChannelStateContext<StreamChatGenerics>(
    'useReactionHandler',
  );
  const { client } = useChatContext<StreamChatGenerics>('useReactionHandler');

  const createMessagePreview = useCallback(
    (
      add: boolean,
      reaction: ReactionResponse<StreamChatGenerics>,
      message: StreamMessage<StreamChatGenerics>,
    ): StreamMessage<StreamChatGenerics> => {
      const newReactionGroups = message?.reaction_groups || {};
      const reactionType = reaction.type;
      const hasReaction = !!newReactionGroups[reactionType];

      if (add) {
        const timestamp = new Date().toISOString();
        newReactionGroups[reactionType] = hasReaction
          ? { ...newReactionGroups[reactionType], count: newReactionGroups[reactionType].count + 1 }
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

      const newReactions: Reaction<StreamChatGenerics>[] | undefined = add
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
      } as StreamMessage<StreamChatGenerics>;
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

    const newReaction = createReactionPreview(type) as ReactionResponse<StreamChatGenerics>;
    const tempMessage = createMessagePreview(add, newReaction, message);

    try {
      updateMessage(tempMessage);
      // @ts-expect-error
      thread?.upsertReplyLocally({ message: tempMessage });

      const messageResponse = add
        ? await channel.sendReaction(id, { type } as Reaction<StreamChatGenerics>)
        : await channel.deleteReaction(id, type);

      // seems useless as we're expecting WS event to come in and replace this anyway
      updateMessage(messageResponse.message);
    } catch (error) {
      // revert to the original message if the API call fails
      updateMessage(message);
      // @ts-expect-error
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

    let userExistingReaction = (null as unknown) as ReactionResponse<StreamChatGenerics>;

    if (message.own_reactions) {
      message.own_reactions.forEach((reaction) => {
        // own user should only ever contain the current user id
        // just in case we check to prevent bugs with message updates from breaking reactions
        if (reaction.user && client.userID === reaction.user.id && reaction.type === reactionType) {
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

export const useReactionClick = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>(
  message?: StreamMessage<StreamChatGenerics>,
  reactionSelectorRef?: RefObject<HTMLDivElement | null>,
  messageWrapperRef?: RefObject<HTMLDivElement | null>,
  closeReactionSelectorOnClick?: boolean,
) => {
  const { channelCapabilities = {} } = useChannelStateContext<StreamChatGenerics>(
    'useReactionClick',
  );

  const [showDetailedReactions, setShowDetailedReactions] = useState(false);

  const hasListener = useRef(false);

  const isReactionEnabled = channelCapabilities['send-reaction'];

  const messageDeleted = !!message?.deleted_at;

  const closeDetailedReactions: EventListener = useCallback(
    (event) => {
      if (
        event.target instanceof HTMLElement &&
        reactionSelectorRef?.current?.contains(event.target) &&
        !closeReactionSelectorOnClick
      ) {
        return;
      }

      setShowDetailedReactions(false);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [setShowDetailedReactions, reactionSelectorRef],
  );

  useEffect(() => {
    const messageWrapper = messageWrapperRef?.current;

    if (showDetailedReactions && !hasListener.current) {
      hasListener.current = true;
      document.addEventListener('click', closeDetailedReactions);

      if (messageWrapper) {
        messageWrapper.addEventListener('mouseleave', closeDetailedReactions);
      }
    }

    if (!showDetailedReactions && hasListener.current) {
      document.removeEventListener('click', closeDetailedReactions);

      if (messageWrapper) {
        messageWrapper.removeEventListener('mouseleave', closeDetailedReactions);
      }

      hasListener.current = false;
    }

    return () => {
      if (hasListener.current) {
        document.removeEventListener('click', closeDetailedReactions);

        if (messageWrapper) {
          messageWrapper.removeEventListener('mouseleave', closeDetailedReactions);
        }

        hasListener.current = false;
      }
    };
  }, [showDetailedReactions, closeDetailedReactions, messageWrapperRef]);

  useEffect(() => {
    const messageWrapper = messageWrapperRef?.current;

    if (messageDeleted && hasListener.current) {
      document.removeEventListener('click', closeDetailedReactions);

      if (messageWrapper) {
        messageWrapper.removeEventListener('mouseleave', closeDetailedReactions);
      }

      hasListener.current = false;
    }
  }, [messageDeleted, closeDetailedReactions, messageWrapperRef]);

  const onReactionListClick: ReactEventHandler = (event) => {
    event?.stopPropagation?.();
    setShowDetailedReactions((prev) => !prev);
  };

  return {
    isReactionEnabled,
    onReactionListClick,
    showDetailedReactions,
  };
};
