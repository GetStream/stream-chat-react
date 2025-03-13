import { useMessageComposer } from './useMessageComposer';
import type { AttachmentManagerState } from 'stream-chat';
import { useStateStore } from '../../../../store';

const stateSelector = (state: AttachmentManagerState) => ({
  attachments: state.attachments,
  hasUploadPermission: state.hasUploadPermission,
});

export const useIsUploadEnabled = () => {
  const messageComposer = useMessageComposer();
  useStateStore(messageComposer.attachmentManager.state, stateSelector);
  return {
    availableUploadSlots: messageComposer.attachmentManager.availableUploadSlots,
    isUploadEnabled: messageComposer.attachmentManager.isUploadEnabled,
  };
};
