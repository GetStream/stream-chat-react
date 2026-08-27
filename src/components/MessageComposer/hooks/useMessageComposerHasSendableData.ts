import { useMessageComposerController } from './useMessageComposerController';
import { useChatContext } from '../../../context/ChatContext';
import { useStateStore } from '../../../store';
import type { EditingAuditState } from 'stream-chat';

const editingAuditStateStateSelector = (state: EditingAuditState) => state;

export const useMessageComposerHasSendableData = () => {
  const { sendMessagesWithPendingUploads } = useChatContext(
    'useMessageComposerHasSendableData',
  );
  const messageComposer = useMessageComposerController();
  useStateStore(messageComposer.editingAuditState, editingAuditStateStateSelector);
  // With `sendMessagesWithPendingUploads` an upload in flight must not disable the send button, and a
  // pending attachment counts as content on its own — `stream-chat` keeps that rule as a separate
  // getter rather than a config option, since only the UI knows whether it implements the flow.
  return sendMessagesWithPendingUploads
    ? messageComposer.hasSendableDataWithPendingUploads
    : messageComposer.hasSendableData;
};
