import { useCallback } from 'react';

import { useChatContext } from '../../../context';
import {
  isFailedScheduledMessage,
  reloadOnScheduledMessageConflict,
} from '../../ScheduledMessages/utils';
import { useMessageComposerController } from './useMessageComposerController';

/**
 * Submits the composer: saves the edit while a message or a scheduled message is being edited,
 * sends a new message otherwise. The choice is made when the callback runs and every submit control
 * uses this hook, so the send button and the Enter key cannot disagree.
 *
 * @returns Submit callback, stable while the composer is the same.
 */
export const useMessageComposerSubmitFn = () => {
  const { client } = useChatContext();
  const messageComposer = useMessageComposerController();

  return useCallback(async () => {
    // a failed one open in the composer is sent or scheduled again instead
    const { editedScheduledMessage } = messageComposer;
    if (editedScheduledMessage && !isFailedScheduledMessage(editedScheduledMessage)) {
      const result = await messageComposer.updateScheduledMessage();
      if (result.status === 'failed') {
        reloadOnScheduledMessageConflict(
          client,
          messageComposer.channel.cid,
          result.error,
        );
      }
      return result;
    }
    return messageComposer.editedMessage
      ? messageComposer.update()
      : messageComposer.send();
  }, [client, messageComposer]);
};
