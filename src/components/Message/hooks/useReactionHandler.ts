import React, { RefObject, useCallback, useEffect, useRef, useState } from 'react';
import throttle from 'lodash.throttle';

import { useChannelActionContext } from '../../../context/ChannelActionContext';
import { StreamMessage, useChannelStateContext } from '../../../context/ChannelStateContext';
import { useChatContext } from '../../../context/ChatContext';

import type { ReactEventHandler } from '../types';

import type { Reaction, ReactionResponse } from 'stream-chat';

import type { DefaultStreamChatGenerics } from '../../../types/types';

export const reactionHandlerWarning = `Reaction handler was called, but it is missing one of its required arguments.
Make sure the ChannelAction and ChannelState contexts are properly set and the hook is initialized with a valid message.`;

export const useReactionHandler = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>(
  message?: StreamMessage<StreamChatGenerics>,
) => {
  const { updateMessage } = useChannelActionContext<StreamChatGenerics>('useReactionHandler');
  const { channel } = useChannelStateContext<StreamChatGenerics>('useReactionHandler');
  const { client } = useChatContext<StreamChatGenerics>('useReactionHandler');

  const createMessagePreview = useCallback(
    (
      add: boolean,
      reaction: ReactionResponse<StreamChatGenerics>,
      message: StreamMessage<StreamChatGenerics>,
    ): StreamMessage<StreamChatGenerics> => {
      const newReactionCounts = message?.reaction_counts || {};
      const reactionType = reaction.type;
      const hasReaction = !!newReactionCounts[reactionType];

      if (add) {
        newReactionCounts[reactionType] = hasReaction ? newReactionCounts[reactionType] + 1 : 1;
      } else {
        if (hasReaction && newReactionCounts[reactionType] > 1) {
          newReactionCounts[reactionType]--;
        } else {
          delete newReactionCounts[reactionType];
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
        reaction_counts: newReactionCounts,
        reaction_scores: newReactionCounts,
      } as StreamMessage<StreamChatGenerics>;
    },
    [client.user, client.userID],
  );

  const creatReactionPreview = (type: string) => ({
    message_id: message?.id,
    score: 1,
    type,
    user: client.user,
    user_id: client.user?.id,
  });

  const toggleReaction = throttle(async (id: string, type: string, add: boolean) => {
    if (!message || channel.data?.frozen) return;

    const newReaction = creatReactionPreview(type) as ReactionResponse<StreamChatGenerics>;
    const tempMessage = createMessagePreview(add, newReaction, message);

    try {
      updateMessage(tempMessage);

      const messageResponse = add
        ? await channel.sendReaction(id, { type } as Reaction<StreamChatGenerics>)
        : await channel.deleteReaction(id, type);

      updateMessage(messageResponse.message);
    } catch (error) {
      // revert to the original message if the API call fails
      updateMessage(message);
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
  const {
    channel,
    channelCapabilities = {},
    channelConfig,
  } = useChannelStateContext<StreamChatGenerics>('useReactionClick');

  const [showDetailedReactions, setShowDetailedReactions] = useState(false);

  const hasListener = useRef(false);

  const isFrozen = !!channel.data?.frozen;

  const isReactionEnabled =
    (channelConfig?.reactions !== false && channelCapabilities['send-reaction']) || isFrozen;

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
    if (event?.stopPropagation) {
      event.stopPropagation();
    }
    setShowDetailedReactions((prev) => !prev);
  };

  return {
    isReactionEnabled,
    onReactionListClick,
    showDetailedReactions,
  };
};
