// @ts-check
import { useContext, useCallback, useEffect, useRef, useState } from 'react';
import { ChannelContext } from '../../../context';

export const reactionHandlerWarning = `Reaction handler was called, but it is missing one of its required arguments.
      Make sure the ChannelContext was properly set and that this hook was initialized with a valid message.`;
/**
 * @type {(message: import('stream-chat').MessageResponse | null | undefined) => (reactionType: string, event: React.MouseEvent) => Promise<void>}
 */
export const useReactionHandler = (message) => {
  /**
   *@type {import('types').ChannelContextValue}
   */
  const { client, channel, updateMessage } = useContext(ChannelContext);

  return async (reactionType, event) => {
    if (event && event.preventDefault) {
      event.preventDefault();
    }

    if (!updateMessage || !message || !channel || !client) {
      console.warn(reactionHandlerWarning);
      return;
    }

    let userExistingReaction = null;

    const currentUser = client.userID;
    if (message.own_reactions) {
      message.own_reactions.forEach((reaction) => {
        // own user should only ever contain the current user id
        // just in case we check to prevent bugs with message updates from breaking reactions
        if (
          reaction.user &&
          currentUser === reaction.user.id &&
          reaction.type === reactionType
        ) {
          userExistingReaction = reaction;
        } else if (reaction.user && currentUser !== reaction.user.id) {
          console.warn(
            `message.own_reactions contained reactions from a different user, this indicates a bug`,
          );
        }
      });
    }

    const originalMessage = message;
    let reactionChangePromise;

    /*
    - Make the API call in the background
    - If it fails, revert to the old message...
     */
    if (userExistingReaction) {
      reactionChangePromise = channel.deleteReaction(
        message.id,
        // @ts-ignore Typescript doesn't understand that the userExistingReaction variable might have been mutated inside the foreach loop
        userExistingReaction.type,
      );
    } else {
      // add the reaction
      const messageID = message.id;

      const reaction = { type: reactionType };

      // this.props.channel.state.addReaction(tmpReaction, this.props.message);
      reactionChangePromise = channel.sendReaction(messageID, reaction);
    }

    try {
      // only wait for the API call after the state is updated
      await reactionChangePromise;
    } catch (e) {
      // revert to the original message if the API call fails
      updateMessage(originalMessage);
    }
  };
};

/**
 * @typedef {{ onReactionListClick: () => void, showDetailedReactions: boolean }} ReactionClickHandler
 * @type {(
 *   reactionSelectorRef: React.RefObject<import('../../Reactions/ReactionSelector').default | null>,
 *   message: import('stream-chat').MessageResponse | null | undefined,
 *   messageWrapperRef?: React.RefObject<HTMLElement | null>
 * ) => ReactionClickHandler}
 */
export const useReactionClick = (
  reactionSelectorRef,
  message,
  messageWrapperRef,
) => {
  const [showDetailedReactions, setShowDetailedReactions] = useState(false);
  const messageDeleted = !!message?.deleted_at;
  const hasListener = useRef(false);
  /** @type {EventListener} */
  const closeDetailedReactions = useCallback(
    (event) => {
      if (
        event.target &&
        // @ts-ignore
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
        messageWrapper.removeEventListener(
          'mouseleave',
          closeDetailedReactions,
        );
      }
      hasListener.current = false;
    }
    return () => {
      if (hasListener.current) {
        document.removeEventListener('click', closeDetailedReactions);
        document.removeEventListener('touchend', closeDetailedReactions);
        if (messageWrapper) {
          messageWrapper.removeEventListener(
            'mouseleave',
            closeDetailedReactions,
          );
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
        messageWrapper.removeEventListener(
          'mouseleave',
          closeDetailedReactions,
        );
      }
      hasListener.current = false;
    }
  }, [messageDeleted, closeDetailedReactions, messageWrapperRef]);

  /** @type {() => void} Typescript syntax */
  const onReactionListClick = () => {
    setShowDetailedReactions(true);
  };
  return {
    onReactionListClick,
    showDetailedReactions,
  };
};
