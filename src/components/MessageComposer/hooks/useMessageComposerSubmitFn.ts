import { useCallback } from 'react';

import { useMessageComposerController } from './useMessageComposerController';

/**
 * Submits what the composer holds: saves the edit while a message is being edited, sends a new
 * message otherwise. Checked when submitting rather than when rendering, and shared by every submit
 * control, so the send button and the Enter key cannot disagree about it.
 */
export const useMessageComposerSubmitFn = () => {
  const messageComposer = useMessageComposerController();

  return useCallback(
    () =>
      messageComposer.editedMessage ? messageComposer.update() : messageComposer.send(),
    [messageComposer],
  );
};
