import type { EditingAuditState } from 'stream-chat';
import { useMessageComposer } from './useMessageComposer';
import { useStateStore } from '../../../store';

const editingAuditStateStateSelector = (state: EditingAuditState) => state;

export const useMessageContentIsEmpty = () => {
  const messageComposer = useMessageComposer();
  useStateStore(messageComposer.editingAuditState, editingAuditStateStateSelector);
  return messageComposer.contentIsEmpty;
};
