import React, { ComponentType } from 'react';
import {
  UnsupportedAttachmentPreview as DefaultUnknownAttachmentPreview,
  UnsupportedAttachmentPreviewProps,
} from './UnsupportedAttachmentPreview';
import {
  VoiceRecordingPreview as DefaultVoiceRecordingPreview,
  VoiceRecordingPreviewProps,
} from './VoiceRecordingPreview';
import {
  FileAttachmentPreview as DefaultFilePreview,
  FileAttachmentPreviewProps,
} from './FileAttachmentPreview';
import {
  ImageAttachmentPreview as DefaultImagePreview,
  ImageAttachmentPreviewProps,
} from './ImageAttachmentPreview';
import {
  isLocalAttachment,
  isLocalAudioAttachment,
  isLocalFileAttachment,
  isLocalImageAttachment,
  isLocalMediaAttachment,
  isLocalVoiceRecordingAttachment,
  isScrapedContent,
} from '../../Attachment';
import { useMessageInputContext } from '../../../context/MessageInputContext';

import type { DefaultStreamChatGenerics } from '../../../types';

export type AttachmentPreviewListProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
> = {
  AudioAttachmentPreview?: ComponentType<FileAttachmentPreviewProps>;
  FileAttachmentPreview?: ComponentType<FileAttachmentPreviewProps>;
  ImageAttachmentPreview?: ComponentType<ImageAttachmentPreviewProps<StreamChatGenerics>>;
  UnsupportedAttachmentPreview?: ComponentType<
    UnsupportedAttachmentPreviewProps<StreamChatGenerics>
  >;
  VideoAttachmentPreview?: ComponentType<FileAttachmentPreviewProps>;
  VoiceRecordingPreview?: ComponentType<VoiceRecordingPreviewProps<StreamChatGenerics>>;
};

export const AttachmentPreviewList = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>({
  AudioAttachmentPreview = DefaultFilePreview,
  FileAttachmentPreview = DefaultFilePreview,
  ImageAttachmentPreview = DefaultImagePreview,
  UnsupportedAttachmentPreview = DefaultUnknownAttachmentPreview,
  VideoAttachmentPreview = DefaultFilePreview,
  VoiceRecordingPreview = DefaultVoiceRecordingPreview,
}: AttachmentPreviewListProps<StreamChatGenerics>) => {
  const {
    attachments,
    removeAttachments,
    uploadAttachment,
  } = useMessageInputContext<StreamChatGenerics>('AttachmentPreviewList');

  return (
    <div className='str-chat__attachment-preview-list'>
      <div
        className='str-chat__attachment-list-scroll-container'
        data-testid='attachment-list-scroll-container'
      >
        {attachments.map((attachment) => {
          if (isScrapedContent(attachment)) return null;
          if (isLocalVoiceRecordingAttachment(attachment)) {
            return (
              <VoiceRecordingPreview
                attachment={attachment}
                handleRetry={uploadAttachment}
                key={attachment.localMetadata.id || attachment.asset_url}
                removeAttachments={removeAttachments}
              />
            );
          } else if (isLocalAudioAttachment(attachment)) {
            return (
              <AudioAttachmentPreview
                attachment={attachment}
                handleRetry={uploadAttachment}
                key={attachment.localMetadata.id || attachment.asset_url}
                removeAttachments={removeAttachments}
              />
            );
          } else if (isLocalMediaAttachment(attachment)) {
            return (
              <VideoAttachmentPreview
                attachment={attachment}
                handleRetry={uploadAttachment}
                key={attachment.localMetadata.id || attachment.asset_url}
                removeAttachments={removeAttachments}
              />
            );
          } else if (isLocalImageAttachment(attachment)) {
            return (
              <ImageAttachmentPreview
                attachment={attachment}
                handleRetry={uploadAttachment}
                key={attachment.localMetadata.id || attachment.image_url}
                removeAttachments={removeAttachments}
              />
            );
          } else if (isLocalFileAttachment(attachment)) {
            return (
              <FileAttachmentPreview
                attachment={attachment}
                handleRetry={uploadAttachment}
                key={attachment.localMetadata.id || attachment.asset_url}
                removeAttachments={removeAttachments}
              />
            );
          } else if (isLocalAttachment(attachment)) {
            return (
              <UnsupportedAttachmentPreview
                attachment={attachment}
                handleRetry={uploadAttachment}
                key={attachment.localMetadata.id}
                removeAttachments={removeAttachments}
              />
            );
          }
          return null;
        })}
      </div>
    </div>
  );
};
