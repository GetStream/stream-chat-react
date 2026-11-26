import { useCallback } from 'react';

import { useNearestDialogManagerContext } from '../../../context';
import { useMessageComposerController } from '../../MessageComposer/hooks/useMessageComposerController';
import { useMessageComposerSubmitFn } from '../../MessageComposer/hooks/useMessageComposerSubmitFn';
import { getScheduleDialogId, isFailedScheduledMessage } from '../utils';

/**
 * The default composer's submit: while a failed scheduled message is loaded to be scheduled again,
 * it opens the schedule dialog to pick a new time; otherwise it submits through
 * {@link useMessageComposerSubmitFn}. Used by the default send button and the textarea's Enter key,
 * so both do the same.
 *
 * The dialog is this SDK's design, so it lives here rather than in `useMessageComposerSubmitFn`:
 * a composer of its own submits a failed scheduled message as the SDK does, by sending it now.
 *
 * @internal
 */
export const useSubmitOrScheduleAgain = () => {
  const messageComposer = useMessageComposerController();
  const { dialogManager } = useNearestDialogManagerContext() ?? {};
  const submit = useMessageComposerSubmitFn();

  return useCallback(() => {
    const { editedScheduledMessage } = messageComposer;
    if (
      dialogManager &&
      editedScheduledMessage &&
      isFailedScheduledMessage(editedScheduledMessage)
    ) {
      dialogManager.open({ id: getScheduleDialogId(messageComposer) });
      return;
    }
    return submit();
  }, [dialogManager, messageComposer, submit]);
};
