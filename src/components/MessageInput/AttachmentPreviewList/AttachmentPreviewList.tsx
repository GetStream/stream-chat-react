import React, { ComponentType } from 'react';
import { UnsupportedAttachmentPreview as DefaultUnknownAttachmentPreview } from './UnsupportedAttachmentPreview';
import {
  VoiceRecordingPreview as DefaultVoiceRecordingPreview,
  VoiceRecordingPreviewProps,
} from './VoiceRecordingPreview';
import {
  FileAttachmentPreview as DefaultFilePreview,
  FileAttachmentPreviewProps,
} from './FileAttachmentPreview';
import { FileUploadPreviewAdapter, ImageUploadPreviewAdapter } from './UploadPreviewItem';
import {
  ImageAttachmentPreview as DefaultImagePreview,
  ImageAttachmentPreviewProps,
} from './ImageAttachmentPreview';
import {
  isAudioAttachment,
  isFileAttachment,
  isMediaAttachment,
  isUploadedImage,
  isVoiceRecordingAttachment,
} from '../../Attachment';
import { useMessageInputContext } from '../../../context';

import type { DefaultStreamChatGenerics } from '../../../types';
import type { AttachmentPreviewProps } from './types';

export type AttachmentPreviewListProps = {
  FileAttachmentPreview?: ComponentType<FileAttachmentPreviewProps>;
  ImageAttachmentPreview?: ComponentType<ImageAttachmentPreviewProps>;
  UnsupportedAttachmentPreview?: ComponentType<AttachmentPreviewProps>;
  VoiceRecordingPreview?: ComponentType<VoiceRecordingPreviewProps>;
};

export const AttachmentPreviewList = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>({
  FileAttachmentPreview = DefaultFilePreview,
  ImageAttachmentPreview = DefaultImagePreview,
  UnsupportedAttachmentPreview = DefaultUnknownAttachmentPreview,
  VoiceRecordingPreview = DefaultVoiceRecordingPreview,
}: AttachmentPreviewListProps) => {
  const {
    attachments,
    fileOrder,
    imageOrder,
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
          if (isVoiceRecordingAttachment(attachment)) {
            return (
              <VoiceRecordingPreview
                attachment={attachment}
                handleRetry={uploadAttachment}
                key={attachment.$internal?.id || attachment.asset_url}
                removeAttachments={removeAttachments}
              />
            );
          } else if (
            isFileAttachment(attachment) ||
            isAudioAttachment(attachment) ||
            isMediaAttachment(attachment)
          ) {
            return (
              <FileAttachmentPreview
                attachment={attachment}
                handleRetry={uploadAttachment}
                key={attachment.$internal?.id || attachment.asset_url}
                removeAttachments={removeAttachments}
              />
            );
          } else if (isUploadedImage(attachment)) {
            return (
              <ImageAttachmentPreview
                attachment={attachment}
                handleRetry={uploadAttachment}
                key={attachment.$internal?.id || attachment.image_url}
                removeAttachments={removeAttachments}
              />
            );
          }
          return (
            <UnsupportedAttachmentPreview
              attachment={attachment}
              handleRetry={uploadAttachment}
              key={attachment.$internal.id}
              removeAttachments={removeAttachments}
            />
          );
        })}
        {imageOrder.map((id) => (
          <ImageUploadPreviewAdapter id={id} key={id} Preview={ImageAttachmentPreview} />
        ))}
        {fileOrder.map((id) => (
          <FileUploadPreviewAdapter id={id} key={id} Preview={FileAttachmentPreview} />
        ))}
      </div>
    </div>
  );
};
