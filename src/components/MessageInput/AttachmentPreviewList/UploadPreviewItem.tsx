import React, { ComponentType, useCallback, useMemo } from 'react';
import { FileAttachmentPreview, FileAttachmentPreviewProps } from './FileAttachmentPreview';
import { ImageAttachmentPreview, ImageAttachmentPreviewProps } from './ImageAttachmentPreview';
import { useMessageInputContext } from '../../../context';
import { LocalAttachment, LocalFileAttachment, LocalImageAttachment } from '../types';
import type { DefaultStreamChatGenerics } from '../../../types';

type PreviewAdapterProps<P> = { id: string; Preview?: ComponentType<P> };
export const ImageUploadPreviewAdapter = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>({
  id,
  Preview = ImageAttachmentPreview,
}: PreviewAdapterProps<ImageAttachmentPreviewProps<StreamChatGenerics>>) => {
  const { imageUploads, removeImage, uploadImage } = useMessageInputContext(
    'ImageUploadPreviewAdapter',
  );

  const removeAttachments = useCallback((ids: string[]) => removeImage(ids[0]), [removeImage]);

  const handleRetry = useCallback(
    (attachment: LocalAttachment<StreamChatGenerics>) =>
      attachment.$internal && uploadImage(attachment.$internal.id),
    [uploadImage],
  );

  const image = imageUploads[id];
  const attachment = useMemo<LocalImageAttachment<StreamChatGenerics> | undefined>(
    () =>
      // do not display scraped attachments
      !image || image.og_scrape_url
        ? undefined
        : {
            $internal: {
              file: image.file as File,
              id,
              uploadState: image.state,
            },
            image_url: image.previewUri ?? image.url,
            title: image.file.name,
            type: 'image',
          },
    [id, image],
  );

  if (!attachment) return null;

  return (
    <Preview
      attachment={attachment}
      handleRetry={handleRetry}
      removeAttachments={removeAttachments}
    />
  );
};

export const FileUploadPreviewAdapter = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>({
  id,
  Preview = FileAttachmentPreview,
}: PreviewAdapterProps<FileAttachmentPreviewProps>) => {
  const { fileUploads, removeFile, uploadFile } = useMessageInputContext(
    'FileUploadPreviewAdapter',
  );

  const removeAttachments = useCallback(
    (ids: string[]) => {
      removeFile(ids[0]);
    },
    [removeFile],
  );
  const handleRetry = useCallback(
    (attachment: LocalAttachment<StreamChatGenerics>) =>
      attachment.$internal && uploadFile(attachment.$internal.id),
    [uploadFile],
  );

  const file = fileUploads[id];
  const attachment = useMemo<LocalFileAttachment<StreamChatGenerics> | undefined>(
    () =>
      !file
        ? undefined
        : {
            $internal: {
              file: file.file as File,
              id,
              uploadState: file.state,
            },
            asset_url: file.url,
            mime_type: file.file.type,
            title: file.file.name,
            type: 'file',
          },
    [file, id],
  );

  if (!attachment) return null;

  return (
    <Preview
      attachment={attachment}
      handleRetry={handleRetry}
      removeAttachments={removeAttachments}
    />
  );
};
