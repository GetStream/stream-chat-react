import { useCallback } from 'react';

import { isFailedScheduledMessage } from '../../ScheduledMessages/utils';
import { useMessageComposerController } from './useMessageComposerController';

/**
 * Submits the composer: saves the edit while a message or a scheduled message is being edited, and
 * sends a new message otherwise. A failed scheduled message loaded to be scheduled again is sent
 * now, and the SDK then deletes the failed original. The choice is made when the callback runs.
 *
 * It only talks to the composer and opens no UI. The default composer opens the schedule dialog for
 * a failed scheduled message instead, through its own wrapper around this hook.
 *
 * @returns Submit callback, stable while the composer is the same.
 */
export const useMessageComposerSubmitFn = () => {
  const messageComposer = useMessageComposerController();

  return useCallback(() => {
    const { editedMessage, editedScheduledMessage } = messageComposer;
    if (editedScheduledMessage && !isFailedScheduledMessage(editedScheduledMessage)) {
      return messageComposer.updateScheduledMessage();
    }
    return editedMessage ? messageComposer.update() : messageComposer.send();
  }, [messageComposer]);
};
