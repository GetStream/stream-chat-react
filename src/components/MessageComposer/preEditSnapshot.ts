import type { MessageComposer } from 'stream-chat';

type RestoreFunction = () => void;

const snapshots = new WeakMap<MessageComposer, RestoreFunction>();

/**
 * Captures a full state snapshot of the composer before entering edit mode.
 * Does nothing if a snapshot already exists (e.g. switching between edits).
 */
export const savePreEditSnapshot = (messageComposer: MessageComposer) => {
  if (snapshots.has(messageComposer)) return;

  const composerState = messageComposer.state.getLatestValue();
  const textState = messageComposer.textComposer.state.getLatestValue();
  const attachmentState = messageComposer.attachmentManager.state.getLatestValue();
  const linkPreviewState = messageComposer.linkPreviewsManager.state.getLatestValue();
  const locationState = messageComposer.locationComposer.state.getLatestValue();
  const pollState = messageComposer.pollComposer.state.getLatestValue();
  const customDataState = messageComposer.customDataManager.state.getLatestValue();

  snapshots.set(messageComposer, () => {
    messageComposer.state.next(composerState);
    messageComposer.textComposer.state.next(textState);
    messageComposer.attachmentManager.state.next(attachmentState);
    messageComposer.linkPreviewsManager.state.next(linkPreviewState);
    messageComposer.locationComposer.state.next(locationState);
    messageComposer.pollComposer.state.next(pollState);
    messageComposer.customDataManager.state.next(customDataState);
  });
};

/**
 * Restores the composer to the state captured before editing began.
 * Falls back to `clear()` if no snapshot exists.
 */
export const restorePreEditSnapshot = (messageComposer: MessageComposer) => {
  const restore = snapshots.get(messageComposer);
  snapshots.delete(messageComposer);
  if (restore) {
    restore();
  } else {
    messageComposer.clear();
  }
};

/**
 * Discards the snapshot without restoring (e.g. after a successful edit save).
 */
export const discardPreEditSnapshot = (messageComposer: MessageComposer) => {
  snapshots.delete(messageComposer);
};
