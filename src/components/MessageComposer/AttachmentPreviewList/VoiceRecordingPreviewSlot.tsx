import type { ComponentType } from 'react';
import React from 'react';
import {
  isLocalVoiceRecordingAttachment,
  type LocalVoiceRecordingAttachment,
} from 'stream-chat';
import { useAttachmentsForPreview, useMessageComposerController } from '../hooks';
import { AudioAttachmentPreview } from './AudioAttachmentPreview';
import type { UploadAttachmentPreviewProps } from './types';

export type VoiceRecordingPreviewProps<CustomLocalMetadata = Record<string, unknown>> =
  UploadAttachmentPreviewProps<LocalVoiceRecordingAttachment<CustomLocalMetadata>>;

export type VoiceRecordingPreviewSlotProps = {
  /** Custom UI component for each voice recording preview in the slot; defaults to AudioAttachmentPreview */
  VoiceRecordingPreview?: ComponentType<VoiceRecordingPreviewProps>;
};

/**
 * Dedicated slot for voice recording preview(s), rendered apart from the main attachment preview list
 */
export const VoiceRecordingPreviewSlot = ({
  VoiceRecordingPreview = AudioAttachmentPreview,
}: VoiceRecordingPreviewSlotProps) => {
  const messageComposer = useMessageComposerController();
  const { attachments } = useAttachmentsForPreview();

  const voiceAttachments = attachments.filter(isLocalVoiceRecordingAttachment);
  const firstVoice = voiceAttachments[0];
  if (!firstVoice) return null;

  return (
    <div
      className='str-chat__message-composer-voice-preview-slot'
      data-testid='voice-preview-slot'
    >
      <VoiceRecordingPreview
        attachment={firstVoice}
        handleRetry={messageComposer.attachmentManager.uploadAttachment}
        removeAttachments={messageComposer.attachmentManager.removeAttachments}
      />
    </div>
  );
};
