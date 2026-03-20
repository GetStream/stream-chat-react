import React, { type ComponentType, useMemo } from 'react';
import {
  isLocalAttachment,
  isLocalAudioAttachment,
  isLocalFileAttachment,
  isLocalImageAttachment,
  isLocalVideoAttachment,
  isLocalVoiceRecordingAttachment,
  isScrapedContent,
  isVoiceRecordingAttachment,
} from 'stream-chat';
import {
  UnsupportedAttachmentPreview as DefaultUnknownAttachmentPreview,
  type UnsupportedAttachmentPreviewProps,
} from './UnsupportedAttachmentPreview';
import {
  FileAttachmentPreview as DefaultFileAttachmentPreview,
  type FileAttachmentPreviewProps,
} from './FileAttachmentPreview';
import { type AudioAttachmentPreviewProps } from './AudioAttachmentPreview';
import { type ImageAttachmentPreviewProps } from './ImageAttachmentPreview';
import { useAttachmentsForPreview, useMessageComposerController } from '../hooks';
import {
  MediaAttachmentPreview,
  type MediaAttachmentPreviewProps,
} from './MediaAttachmentPreview';

export type AttachmentPreviewListProps = {
  AudioAttachmentPreview?:
    | ComponentType<AudioAttachmentPreviewProps>
    | ComponentType<FileAttachmentPreviewProps>;
  FileAttachmentPreview?: ComponentType<FileAttachmentPreviewProps>;
  ImageAttachmentPreview?: ComponentType<ImageAttachmentPreviewProps>;
  UnsupportedAttachmentPreview?: ComponentType<UnsupportedAttachmentPreviewProps>;
  VideoAttachmentPreview?: ComponentType<MediaAttachmentPreviewProps>;
};

export const AttachmentPreviewList = ({
  AudioAttachmentPreview = DefaultFileAttachmentPreview,
  FileAttachmentPreview = DefaultFileAttachmentPreview,
  ImageAttachmentPreview = MediaAttachmentPreview,
  UnsupportedAttachmentPreview = DefaultUnknownAttachmentPreview,
  VideoAttachmentPreview = MediaAttachmentPreview,
}: AttachmentPreviewListProps) => {
  const messageComposer = useMessageComposerController();

  const { attachments } = useAttachmentsForPreview();
  const filteredAttachments = useMemo(
    () => attachments.filter((a) => !isVoiceRecordingAttachment(a)),
    [attachments],
  );

  if (!filteredAttachments.length) return null;

  return (
    <div
      className='str-chat__attachment-preview-list'
      data-testid='attachment-preview-list'
    >
      {attachments.map((attachment) => {
        if (isScrapedContent(attachment)) return null;
        // Voice recordings are rendered in the dedicated slot above (VoiceRecordingPreviewSlot)
        if (isLocalVoiceRecordingAttachment(attachment)) return null;
        if (isLocalAudioAttachment(attachment)) {
          return (
            <AudioAttachmentPreview
              attachment={attachment}
              handleRetry={messageComposer.attachmentManager.uploadAttachment}
              key={attachment.localMetadata.id || attachment.asset_url}
              removeAttachments={messageComposer.attachmentManager.removeAttachments}
            />
          );
        } else if (isLocalVideoAttachment(attachment)) {
          return (
            <VideoAttachmentPreview
              attachment={attachment}
              handleRetry={messageComposer.attachmentManager.uploadAttachment}
              key={attachment.localMetadata.id || attachment.asset_url}
              removeAttachments={messageComposer.attachmentManager.removeAttachments}
            />
          );
        } else if (isLocalImageAttachment(attachment)) {
          return (
            <ImageAttachmentPreview
              attachment={attachment}
              handleRetry={messageComposer.attachmentManager.uploadAttachment}
              key={attachment.localMetadata.id || attachment.image_url}
              removeAttachments={messageComposer.attachmentManager.removeAttachments}
            />
          );
        } else if (isLocalFileAttachment(attachment)) {
          return (
            <FileAttachmentPreview
              attachment={attachment}
              handleRetry={messageComposer.attachmentManager.uploadAttachment}
              key={attachment.localMetadata.id || attachment.asset_url}
              removeAttachments={messageComposer.attachmentManager.removeAttachments}
            />
          );
        } else if (isLocalAttachment(attachment)) {
          return (
            <UnsupportedAttachmentPreview
              attachment={attachment}
              handleRetry={messageComposer.attachmentManager.uploadAttachment}
              key={attachment.localMetadata.id}
              removeAttachments={messageComposer.attachmentManager.removeAttachments}
            />
          );
        }
        return null;
      })}
    </div>
  );
};
