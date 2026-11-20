import { SCHEDULED_MESSAGE_STATUS } from 'stream-chat';
import type { ScheduledMessageCompositionState } from 'stream-chat';

import { useStateStore } from '../../../store';
import { useMessageComposerController } from './useMessageComposerController';

const scheduledMessageCompositionStateSelector = ({
  editedScheduledMessage,
}: ScheduledMessageCompositionState) => {
  const isFailed = editedScheduledMessage?.status === SCHEDULED_MESSAGE_STATUS.Failed;

  return {
    editedScheduledMessage: isFailed ? undefined : (editedScheduledMessage ?? undefined),
    failedScheduledMessage: isFailed ? editedScheduledMessage : undefined,
  };
};

export const useScheduledMessageCompositionState = () => {
  const messageComposer = useMessageComposerController();

  return useStateStore(
    messageComposer.scheduledMessageComposition.state,
    scheduledMessageCompositionStateSelector,
  );
};
