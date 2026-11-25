import { useCallback } from 'react';

import { useNearestDialogManagerContext } from '../../../context';
import {
  getScheduleCompositionDialogId,
  isFailedScheduledMessage,
} from '../../ScheduledMessages/utils';
import { useMessageComposerController } from './useMessageComposerController';

/**
 * Submits the composer: saves the edit while a message or a scheduled message is being edited,
 * opens the schedule dialog for a failed scheduled message loaded to be scheduled again, and sends
 * a new message otherwise. The choice is made when the callback runs and every submit control uses
 * this hook, so the send button and the Enter key cannot disagree.
 *
 * @returns Submit callback, stable while the composer is the same.
 */
export const useMessageComposerSubmitFn = () => {
  const messageComposer = useMessageComposerController();
  const { dialogManager } = useNearestDialogManagerContext() ?? {};

  return useCallback(() => {
    const { editedScheduledMessage } = messageComposer;
    if (editedScheduledMessage && isFailedScheduledMessage(editedScheduledMessage)) {
      dialogManager?.open({ id: getScheduleCompositionDialogId(messageComposer) });
      return;
    }
    if (editedScheduledMessage) {
      return messageComposer.updateScheduledMessage();
    }
    return messageComposer.editedMessage
      ? messageComposer.update()
      : messageComposer.send();
  }, [dialogManager, messageComposer]);
};
