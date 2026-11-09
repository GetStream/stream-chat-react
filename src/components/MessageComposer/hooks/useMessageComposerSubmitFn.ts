import { useCallback } from 'react';

import { useMessageComposerController } from './useMessageComposerController';

/**
 * Submits the composer: saves the edit while a message is being edited, sends a new message
 * otherwise. The choice is made when the callback runs and every submit control uses this hook, so
 * the send button and the Enter key cannot disagree.
 *
 * @returns Submit callback, stable while the composer is the same.
 */
export const useMessageComposerSubmitFn = () => {
  const messageComposer = useMessageComposerController();

  return useCallback(
    () =>
      messageComposer.editedMessage ? messageComposer.update() : messageComposer.send(),
    [messageComposer],
  );
};
