import { useMessageComposerController } from './useMessageComposerController';
import { useStateStore } from '../../../store';
import type { EditingAuditState } from 'stream-chat';

const editingAuditStateStateSelector = (state: EditingAuditState) => state;

export const useMessageComposerHasSendableData = () => {
  const messageComposer = useMessageComposerController();
  useStateStore(messageComposer.editingAuditState, editingAuditStateStateSelector);
  // `hasSendableData` accounts for uploads in flight on its own: it relaxes while a composition
  // middleware declaring `allowsPendingUploads` is installed - see
  // `MessageComposer.allowsPendingUploads` in `stream-chat`.
  return messageComposer.hasSendableData;
};
