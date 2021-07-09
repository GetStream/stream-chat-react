/* eslint-disable arrow-body-style */
import React, { RefObject, useCallback, useEffect, useRef, useState } from 'react';
import throttle from 'lodash.throttle';

import { useChannelActionContext } from '../../../context/ChannelActionContext';
import { StreamMessage, useChannelStateContext } from '../../../context/ChannelStateContext';
import { useChatContext } from '../../../context/ChatContext';

import type { ReactEventHandler } from '../types';

import type { MessageResponse, Reaction, ReactionResponse } from 'stream-chat';

import type {
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
} from '../../../types/types';

export const reactionHandlerWarning = `Reaction handler was called, but it is missing one of its required arguments. 
Make sure the ChannelAction and ChannelState contexts are properly set and the hook is initialized with a valid message.`;

export const useReactionHandler = <
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends DefaultChannelType = DefaultChannelType,
  Co extends DefaultCommandType = DefaultCommandType,
  Ev extends DefaultEventType = DefaultEventType,
  Me extends DefaultMessageType = DefaultMessageType,
  Re extends DefaultReactionType = DefaultReactionType,
  Us extends DefaultUserType<Us> = DefaultUserType
>(
  message?: StreamMessage<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const { updateMessage } = useChannelActionContext<At, Ch, Co, Ev, Me, Re, Us>();
  const { channel } = useChannelStateContext<At, Ch, Co, Ev, Me, Re, Us>();
  const { client } = useChatContext<At, Ch, Co, Ev, Me, Re, Us>();

  console.log({ message });

  const createMessagePreview = useCallback(
    (reaction: Reaction<Re, Us>, message?: StreamMessage<At, Ch, Co, Ev, Me, Re, Us>) => {
      const newReactions: ReactionResponse<Re, Us>[] | undefined = [
        //@ts-expect-error
        ...message?.latest_reactions,
        reaction,
      ];

      return ({
        __html: message?.text,
        attachments: message?.attachments,
        created_at: message?.created_at,
        html: message?.text,
        id: message?.id,
        latest_reactions: newReactions || message?.latest_reactions,
        mentioned_users: message?.mentioned_users,
        status: message?.status,
        text: message?.text,
        type: message?.type,
        user: message?.user,
        ...(message?.parent_id ? { parent_id: message?.parent_id } : null),
      } as unknown) as MessageResponse<At, Ch, Co, Me, Re, Us>;
    },
    [client.user, client.userID],
  );

  const creatReactionPreview = (id: string, type: string) => {
    return {
      created_at: message?.created_at,
      message_id: message?.id,
      score: 1,
      type,
      updated_at: message?.updated_at,
      user: message?.user,
      user_id: id,
    };
  };

  const toggleReaction = throttle(async (id: string, type: string, add: boolean) => {
    // console.log({ id });
    // console.log({ type });
    // console.log({ add });

    const newReaction = creatReactionPreview(id, type);
    //@ts-expect-error
    const tempMessage = createMessagePreview(newReaction, message);

    try {
      if (add) {
        if (message) updateMessage(tempMessage);
        await channel.sendReaction(id, { type } as Reaction<Re, Us>);
      } else {
        if (message) updateMessage(tempMessage);
        await channel.deleteReaction(id, type);
      }
    } catch (error) {
      // revert to the original message if the API call fails
      if (message) updateMessage(message);
    }
  }, 1000);

  return async (reactionType: string, event?: React.BaseSyntheticEvent) => {
    if (event?.preventDefault) {
      event.preventDefault();
    }

    if (!message) {
      return console.warn(reactionHandlerWarning);
    }

    let userExistingReaction = (null as unknown) as ReactionResponse<Re, Us>;

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
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends DefaultChannelType = DefaultChannelType,
  Co extends DefaultCommandType = DefaultCommandType,
  Ev extends DefaultEventType = DefaultEventType,
  Me extends DefaultMessageType = DefaultMessageType,
  Re extends DefaultReactionType = DefaultReactionType,
  Us extends DefaultUserType<Us> = DefaultUserType
>(
  message?: StreamMessage<At, Ch, Co, Ev, Me, Re, Us>,
  reactionSelectorRef?: RefObject<HTMLDivElement | null>,
  messageWrapperRef?: RefObject<HTMLDivElement | null>,
) => {
  const { channel } = useChannelStateContext<At, Ch, Co, Ev, Me, Re, Us>();

  const [showDetailedReactions, setShowDetailedReactions] = useState(false);

  const hasListener = useRef(false);

  const isReactionEnabled = channel?.getConfig?.()?.reactions !== false;
  const messageDeleted = !!message?.deleted_at;

  const closeDetailedReactions: EventListener = useCallback(
    (event) => {
      if (
        event.target instanceof HTMLElement &&
        reactionSelectorRef?.current?.contains(event.target)
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
      document.addEventListener('touchend', closeDetailedReactions);

      if (messageWrapper) {
        messageWrapper.addEventListener('mouseleave', closeDetailedReactions);
      }
    }

    if (!showDetailedReactions && hasListener.current) {
      document.removeEventListener('click', closeDetailedReactions);
      document.removeEventListener('touchend', closeDetailedReactions);

      if (messageWrapper) {
        messageWrapper.removeEventListener('mouseleave', closeDetailedReactions);
      }

      hasListener.current = false;
    }

    return () => {
      if (hasListener.current) {
        document.removeEventListener('click', closeDetailedReactions);
        document.removeEventListener('touchend', closeDetailedReactions);

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
      document.removeEventListener('touchend', closeDetailedReactions);

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
    setShowDetailedReactions(true);
  };

  return {
    isReactionEnabled,
    onReactionListClick,
    showDetailedReactions,
  };
};
