import React from 'react';

import { useComponentContext } from '../../../context';
import { FileSizeIndicator as DefaultFileSizeIndicator } from '../../Attachment/components/FileSizeIndicator';
import { UploadedSizeIndicator as DefaultUploadedSizeIndicator } from '../../Loading/UploadedSizeIndicator';

function resolveAttachmentFullByteSize(attachment: {
  file_size?: number | string;
  localMetadata?: { file?: { size?: unknown } } | null;
}): number | undefined {
  const fromFile = attachment.localMetadata?.file?.size;
  if (typeof fromFile === 'number' && Number.isFinite(fromFile) && fromFile >= 0) {
    return fromFile;
  }
  const raw = attachment.file_size;
  if (typeof raw === 'number' && Number.isFinite(raw) && raw >= 0) return raw;
  if (typeof raw === 'string') {
    const n = parseFloat(raw);
    if (Number.isFinite(n) && n >= 0) return n;
  }
  return undefined;
}

export type AttachmentUploadedSizeIndicatorProps = {
  attachment: {
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
}: AttachmentUploadedSizeIndicatorProps) => {
  const {
    FileSizeIndicator = DefaultFileSizeIndicator,
    UploadedSizeIndicator = DefaultUploadedSizeIndicator,
  } = useComponentContext();
  const { uploadProgress, uploadState } = attachment.localMetadata ?? {};
  const fullBytes = resolveAttachmentFullByteSize(attachment);
  const uploaded =
    uploadProgress !== undefined && fullBytes !== undefined
      ? Math.round((uploadProgress / 100) * fullBytes)
      : undefined;

  if (uploadState === 'uploading' && uploaded !== undefined && fullBytes !== undefined) {
    return <UploadedSizeIndicator fullBytes={fullBytes} uploadedBytes={uploaded} />;
  }

  if (uploadState === 'finished') {
    return <FileSizeIndicator fileSize={attachment.file_size} />;
  }

  return null;
};
