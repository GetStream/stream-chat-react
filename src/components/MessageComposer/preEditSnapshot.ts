import type { MessageComposer } from 'stream-chat';

type RestoreFunction = () => void;

const snapshots = new WeakMap<MessageComposer, RestoreFunction>();

/**
 * Snapshots the composer state before it enters edit mode. Does nothing when a snapshot already
 * exists, such as when switching between edits.
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

/** Restores the snapshot and drops it. Calls `clear()` when there is no snapshot. */
export const restorePreEditSnapshot = (messageComposer: MessageComposer) => {
  const restore = snapshots.get(messageComposer);
  snapshots.delete(messageComposer);
  if (restore) {
    restore();
  } else {
    messageComposer.clear();
  }
};

/** Drops the snapshot without restoring it, e.g. after a successful edit save. */
export const discardPreEditSnapshot = (messageComposer: MessageComposer) => {
  snapshots.delete(messageComposer);
};
