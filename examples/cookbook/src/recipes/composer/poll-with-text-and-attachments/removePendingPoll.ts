import type { MessageComposer } from 'stream-chat';

/**
 * Takes the poll waiting in a new message out of the composer. Call it when the user removes the
 * poll. The poll stays on the server: the composer can't tell a poll it created from one restored
 * from a draft that may already be sent, and deleting a sent poll removes it and its votes. A poll
 * of an edited message belongs to that message and stays attached.
 */
export const removePendingPoll = (composer: MessageComposer) => {
  const { editedMessage, pollId } = composer;
  if (!pollId || editedMessage) return;
  composer.state.partialNext({ pollId: null });
};
