import { useMessageComposerController } from './useMessageComposerController';
import { useStateStore } from '../../../store';
import type { AttachmentManagerState } from 'stream-chat';

const stateSelector = (state: AttachmentManagerState) => ({
  attachments: state.attachments,
});

export const useAttachmentManagerState = () => {
  const { attachmentManager } = useMessageComposerController();
  const { attachments } = useStateStore(attachmentManager.state, stateSelector);
  return {
    attachments,
    availableUploadSlots: attachmentManager.availableUploadSlots,
    blockedUploadsCount: attachmentManager.blockedUploadsCount,
    failedUploadsCount: attachmentManager.failedUploadsCount,
    hasAvailableUploadSlots: attachmentManager.hasAvailableUploadSlots,
    hasCustomDoUploadRequest: attachmentManager.hasCustomDoUploadRequest,
    isUploadEnabled: attachmentManager.isUploadEnabled,
    pendingUploadsCount: attachmentManager.pendingUploadsCount,
    successfulUploadsCount: attachmentManager.successfulUploadsCount,
    uploadsInProgressCount: attachmentManager.uploadsInProgressCount,
  };
};
