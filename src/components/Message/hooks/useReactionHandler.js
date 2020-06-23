// @ts-check
import { useContext } from 'react';
import { ChannelContext } from '../../../context';

export const reactionHandlerWarning = `Reaction handler was called, but it is missing one of its required arguments.
      Make sure the ChannelContext was properly set and that this hook was initialized with a valid message.`;
/**
 * @type {(message: import('stream-chat').MessageResponse | undefined) => (reactionType: string, event: React.MouseEvent) => Promise<void>}
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
