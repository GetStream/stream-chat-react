import type { MessageComposer } from 'stream-chat';

/**
 * Takes the poll waiting in a new message out of the composer, without deleting it. Call it when
 * the user removes the poll. A poll of an edited message belongs to that message and stays.
 */
export const removePendingPoll = (composer: MessageComposer) => {
  const { editedMessage, pollId } = composer;
  if (!pollId || editedMessage) return;
  composer.state.partialNext({ pollId: null });
};
