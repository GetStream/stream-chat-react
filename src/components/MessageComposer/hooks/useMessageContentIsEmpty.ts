import type { EditingAuditState } from 'stream-chat';
import { useMessageComposerController } from './useMessageComposerController';
import { useStateStore } from '../../../store';

const editingAuditStateStateSelector = (state: EditingAuditState) => state;

export const useMessageContentIsEmpty = () => {
  const messageComposer = useMessageComposerController();
  useStateStore(messageComposer.editingAuditState, editingAuditStateStateSelector);
  return messageComposer.contentIsEmpty;
};
