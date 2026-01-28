import type { ComponentType } from 'react';
import React from 'react';
import {
  isLocalAttachment,
  isLocalAudioAttachment,
  isLocalFileAttachment,
  isLocalImageAttachment,
  isLocalVideoAttachment,
  isLocalVoiceRecordingAttachment,
  isScrapedContent,
} from 'stream-chat';
import {
  UnsupportedAttachmentPreview as DefaultUnknownAttachmentPreview,
  type UnsupportedAttachmentPreviewProps,
} from './UnsupportedAttachmentPreview';
import { type VoiceRecordingPreviewProps } from './VoiceRecordingPreview';
import {
  FileAttachmentPreview as DefaultFileAttachmentPreview,
  type FileAttachmentPreviewProps,
} from './FileAttachmentPreview';
import {
  type AudioAttachmentPreviewProps,
  AudioAttachmentPreview as DefaultAudioAttachmentPreview,
} from './AudioAttachmentPreview';
import { type ImageAttachmentPreviewProps } from './ImageAttachmentPreview';
import { useAttachmentsForPreview, useMessageComposer } from '../hooks';
import {
  GeolocationPreview as DefaultGeolocationPreview,
  type GeolocationPreviewProps,
} from './GeolocationPreview';
import {
  MediaAttachmentPreview,
  type MediaAttachmentPreviewProps,
} from './MediaAttachmentPreview';

export type AttachmentPreviewListProps = {
  AudioAttachmentPreview?: ComponentType<AudioAttachmentPreviewProps>;
  FileAttachmentPreview?: ComponentType<FileAttachmentPreviewProps>;
  GeolocationPreview?: ComponentType<GeolocationPreviewProps>;
  ImageAttachmentPreview?: ComponentType<ImageAttachmentPreviewProps>;
  UnsupportedAttachmentPreview?: ComponentType<UnsupportedAttachmentPreviewProps>;
  VideoAttachmentPreview?: ComponentType<MediaAttachmentPreviewProps>;
  VoiceRecordingPreview?: ComponentType<VoiceRecordingPreviewProps>;
};

export const AttachmentPreviewList = ({
  AudioAttachmentPreview = DefaultAudioAttachmentPreview,
  FileAttachmentPreview = DefaultFileAttachmentPreview,
  GeolocationPreview = DefaultGeolocationPreview,
  ImageAttachmentPreview = MediaAttachmentPreview,
  UnsupportedAttachmentPreview = DefaultUnknownAttachmentPreview,
  VideoAttachmentPreview = MediaAttachmentPreview,
  VoiceRecordingPreview = DefaultAudioAttachmentPreview,
}: AttachmentPreviewListProps) => {
  const messageComposer = useMessageComposer();

  // todo: we could also allow to attach poll to a message composition
  const { attachments, location } = useAttachmentsForPreview();

  if (!attachments.length && !location) return null;

  return (
    <div className='str-chat__attachment-preview-list'>
      {/*<div*/}
      {/*  className='str-chat__attachment-list-scroll-container'*/}
      {/*  data-testid='attachment-list-scroll-container'*/}
      {/*>*/}
      {location && (
        <GeolocationPreview
          location={location}
          // It is not possible to nullify shared_location field so we do not show a preview when editing
          // to prevent a user from wanting to remove the location
          remove={
            messageComposer.editedMessage
              ? undefined
              : messageComposer.locationComposer.initState
          }
        />
      )}
      {attachments.map((attachment) => {
        if (isScrapedContent(attachment)) return null;
        if (isLocalVoiceRecordingAttachment(attachment)) {
          return (
            <VoiceRecordingPreview
              attachment={attachment}
              handleRetry={messageComposer.attachmentManager.uploadAttachment}
              key={attachment.localMetadata.id || attachment.asset_url}
              removeAttachments={messageComposer.attachmentManager.removeAttachments}
            />
          );
        } else if (isLocalAudioAttachment(attachment)) {
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
      {/*</div>*/}
    </div>
  );
};
