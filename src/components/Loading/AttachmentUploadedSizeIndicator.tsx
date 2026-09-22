import React from 'react';
import { resolveAttachmentFileSize, resolveAttachmentFullByteSize } from 'stream-chat';

import { useComponentContext } from '../../context';
import { FileSizeIndicator as DefaultFileSizeIndicator } from '../Attachment/components/FileSizeIndicator';
import { UploadedSizeIndicator as DefaultUploadedSizeIndicator } from './UploadedSizeIndicator';

export type AttachmentUploadedSizeIndicatorProps = {
  /**
   * Live progress, overriding `localMetadata.uploadProgress`. Required when rendering an
   * attachment carried by a message: the value stored there is a snapshot frozen when the
   * message was composed, whereas `client.uploadManager` keeps reporting.
   */
  uploadProgress?: number;
  attachment: {
    custom?: { file_size?: number | string } | null;
    file_size?: number | string;
    localMetadata?: {
      file?: { size?: unknown };
      uploadProgress?: number;
      uploadState?: string;
    } | null;
  };
};

export const AttachmentUploadedSizeIndicator = ({
  attachment,
  uploadProgress: liveUploadProgress,
}: AttachmentUploadedSizeIndicatorProps) => {
  const {
    FileSizeIndicator = DefaultFileSizeIndicator,
    UploadedSizeIndicator = DefaultUploadedSizeIndicator,
  } = useComponentContext();
  const { uploadState } = attachment.localMetadata ?? {};
  const uploadProgress = liveUploadProgress ?? attachment.localMetadata?.uploadProgress;
  const fullBytes = resolveAttachmentFullByteSize(attachment);
  const uploaded =
    uploadProgress !== undefined && fullBytes !== undefined
      ? Math.round((uploadProgress / 100) * fullBytes)
      : undefined;

  if (uploadState === 'uploading' && uploaded !== undefined && fullBytes !== undefined) {
    return <UploadedSizeIndicator fullBytes={fullBytes} uploadedBytes={uploaded} />;
  }

  if (uploadState === 'finished') {
    return <FileSizeIndicator fileSize={resolveAttachmentFileSize(attachment)} />;
  }

  return null;
};
