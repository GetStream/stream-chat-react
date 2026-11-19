import { useCallback } from 'react';

import { isFailedScheduledMessage } from '../../ScheduledMessages/utils';
import { useMessageComposerController } from './useMessageComposerController';

/**
 * Submits the composer: saves the edit while a message or a scheduled message is being edited,
 * sends a new message otherwise. The choice is made when the callback runs and every submit control
 * uses this hook, so the send button and the Enter key cannot disagree.
 *
 * @returns Submit callback, stable while the composer is the same.
 */
export const useMessageComposerSubmitFn = () => {
  const messageComposer = useMessageComposerController();

  return useCallback(() => {
    // a failed one open in the composer is sent or scheduled again instead
    const { editedScheduledMessage } = messageComposer;
    if (editedScheduledMessage && !isFailedScheduledMessage(editedScheduledMessage)) {
      return messageComposer.updateScheduledMessage();
    }
    return messageComposer.editedMessage
      ? messageComposer.update()
      : messageComposer.send();
  }, [messageComposer]);
};
