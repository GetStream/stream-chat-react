import { useMessageComposerController } from './useMessageComposerController';
import { useStateStore } from '../../../store';
import type { AttachmentManagerState, MessageComposerConfig } from 'stream-chat';

const stateSelector = (state: AttachmentManagerState) => ({
  attachments: state.attachments,
});

const composerConfigSelector = ({
  attachments,
  location,
  polls,
}: MessageComposerConfig) => ({
  attachmentsEnabled: attachments.enabled,
  customCdn: attachments.customCdn,
  locationEnabled: location.enabled,
  maxNumberOfFilesPerMessage: attachments.maxNumberOfFilesPerMessage,
  pollsEnabled: polls.enabled,
});

export const useAttachmentManagerState = () => {
  const messageComposer = useMessageComposerController();
  const { attachmentManager } = messageComposer;
  const { attachments } = useStateStore(attachmentManager.state, stateSelector);
  const { attachmentsEnabled, customCdn, locationEnabled, pollsEnabled } = useStateStore(
    messageComposer.configState,
    composerConfigSelector,
  );

  return {
    attachments,
    attachmentsEnabled,
    availableUploadSlots: attachmentManager.availableUploadSlots,
    blockedUploadsCount: attachmentManager.blockedUploadsCount,
    customCdn,
    failedUploadsCount: attachmentManager.failedUploadsCount,
    hasAvailableUploadSlots: attachmentManager.hasAvailableUploadSlots,
    isUploadEnabled: attachmentManager.isUploadEnabled,
    locationEnabled,
    maxNumberOfFilesPerMessage: attachmentManager.maxNumberOfFilesPerMessage,
    pendingUploadsCount: attachmentManager.pendingUploadsCount,
    pollsEnabled,
    successfulUploadsCount: attachmentManager.successfulUploadsCount,
    uploadsInProgressCount: attachmentManager.uploadsInProgressCount,
  };
};
