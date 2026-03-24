import React, { type ComponentType, useCallback, useMemo, useRef, useState } from 'react';
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
import { toBaseImageDescriptors } from '../../BaseImage';
import { Gallery } from '../../Gallery';
import { GlobalModal } from '../../Modal';
import { useComponentContext } from '../../../context';

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
  const { Modal = GlobalModal } = useComponentContext();
  const [showPreview, setShowPreview] = useState(false);
  const initialIndexRef = useRef(0);

  const { attachments } = useAttachmentsForPreview();
  const filteredAttachments = useMemo(
    () => attachments.filter((a) => !isVoiceRecordingAttachment(a)),
    [attachments],
  );

  const { galleryItems, previewIndexById } = useMemo(() => {
    const items: NonNullable<ReturnType<typeof toBaseImageDescriptors>>[] = [];
    const indexById: Record<string, number> = {};
    for (const a of attachments) {
      if (isLocalImageAttachment(a) || isLocalVideoAttachment(a)) {
        const descriptor = toBaseImageDescriptors(a);
        if (descriptor) {
          indexById[a.localMetadata.id] = items.length;
          items.push(descriptor);
        }
      }
    }
    return { galleryItems: items, previewIndexById: indexById };
  }, [attachments]);

  const openPreviewAtIndex = useCallback((index: number) => {
    initialIndexRef.current = index;
    setShowPreview(true);
  }, []);

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
              openPreview={() =>
                openPreviewAtIndex(previewIndexById[attachment.localMetadata.id] ?? 0)
              }
              removeAttachments={messageComposer.attachmentManager.removeAttachments}
            />
          );
        } else if (isLocalImageAttachment(attachment)) {
          return (
            <ImageAttachmentPreview
              attachment={attachment}
              handleRetry={messageComposer.attachmentManager.uploadAttachment}
              key={attachment.localMetadata.id || attachment.image_url}
              openPreview={() =>
                openPreviewAtIndex(previewIndexById[attachment.localMetadata.id] ?? 0)
              }
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
      {galleryItems.length > 0 && (
        <Modal
          className='str-chat__gallery-modal'
          onClose={() => setShowPreview(false)}
          open={showPreview}
        >
          <Gallery initialIndex={initialIndexRef.current} items={galleryItems} />
        </Modal>
      )}
    </div>
  );
};
