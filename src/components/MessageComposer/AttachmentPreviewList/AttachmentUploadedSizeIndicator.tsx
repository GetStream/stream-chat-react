import React from 'react';
import { FileSizeIndicator } from '../../Attachment';
import { prettifyFileSize } from '../hooks/utils';

function formatUploadByteFraction(
  uploadPercent: number,
  fullBytes: number,
  maximumFractionDigits?: number,
): string {
  const uploaded = Math.round((uploadPercent / 100) * fullBytes);
  return `${prettifyFileSize(uploaded, maximumFractionDigits)} / ${prettifyFileSize(fullBytes, maximumFractionDigits)}`;
}

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
  const { uploadProgress, uploadState } = attachment.localMetadata ?? {};
  const fullBytes = resolveAttachmentFullByteSize(attachment);

  if (
    uploadState === 'uploading' &&
    uploadProgress !== undefined &&
    fullBytes !== undefined
  ) {
    return (
      <span
        className='str-chat__attachment-preview-file__upload-size-fraction'
        data-testid='upload-size-fraction'
      >
        {formatUploadByteFraction(uploadProgress, fullBytes)}
      </span>
    );
  }

  if (uploadState === 'finished') {
    return <FileSizeIndicator fileSize={attachment.file_size} />;
  }

  return null;
};
