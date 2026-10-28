import type { MessageComposer } from 'stream-chat';

/**
 * Deletes a poll on the server that was created for a new message in this composer and never
 * sent, so nothing else points to it. Call it only on the user's own action. A poll of an edited
 * message belongs to that message and stays.
 */
export const deleteUnsentPoll = (composer: MessageComposer, pollId: string) => {
  if (composer.editedMessage) return;
  composer.client.deletePoll({ poll_id: pollId }).catch((error) => {
    console.error('Deleting the unsent poll failed', error);
  });
};

/**
 * Takes the poll waiting in a new message out of the composer and deletes it on the server with
 * `deleteUnsentPoll()`. Call it when the user removes the poll.
 */
export const removePendingPoll = (composer: MessageComposer) => {
  const { editedMessage, pollId } = composer;
  if (!pollId || editedMessage) return;
  composer.state.partialNext({ pollId: null });
  deleteUnsentPoll(composer, pollId);
};
