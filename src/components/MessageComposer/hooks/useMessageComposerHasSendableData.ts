import { useMessageComposerController } from './useMessageComposerController';
import { useStateStore } from '../../../store';
import type { EditingAuditState } from 'stream-chat';

const editingAuditStateStateSelector = (state: EditingAuditState) => state;

export const useMessageComposerHasSendableData = () => {
  const messageComposer = useMessageComposerController();
  useStateStore(messageComposer.editingAuditState, editingAuditStateStateSelector);
  return messageComposer.hasSendableData;
};
