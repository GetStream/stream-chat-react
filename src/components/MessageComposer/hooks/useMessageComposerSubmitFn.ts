import { useCallback } from 'react';

import { reloadOnScheduledMessageConflict } from '../../ScheduledMessages/utils/scheduledMessageErrors';
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

  const updateScheduledMessage = useCallback(async () => {
    const result = await messageComposer.scheduledMessageComposition.update();

    if (result.status === 'failed') {
      reloadOnScheduledMessageConflict(
        messageComposer.channel.scheduledMessagesPaginator,
        result.error,
      );
    }

    return result;
  }, [messageComposer]);

  return useCallback(() => {
    if (messageComposer.scheduledMessageComposition.blocksNewComposition) {
      return updateScheduledMessage();
    }

    return messageComposer.editedMessage
      ? messageComposer.update()
      : messageComposer.send();
  }, [messageComposer, updateScheduledMessage]);
};
