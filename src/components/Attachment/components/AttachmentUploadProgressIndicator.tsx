import React, { useMemo } from 'react';
import clsx from 'clsx';
import type { Attachment, LocalAttachment } from 'stream-chat';

import { useAttachmentsUploadState } from '../hooks/useAttachmentUploadState';
import { AttachmentUploadedSizeIndicator } from '../../Loading/AttachmentUploadedSizeIndicator';
import { UploadProgressIndicator } from '../../Loading/UploadProgressIndicator';

export type AttachmentUploadProgressIndicatorProps = {
  /** The attachment being uploaded. Nothing renders unless its upload is still in flight. */
  attachment?: Attachment | LocalAttachment;
  /**
   * Several attachments sharing one indicator, used by galleries. Their progress is averaged
   * and the uploaded/total size is omitted. Ignored when `attachment` is given.
   */
  attachments?: (Attachment | LocalAttachment)[];
  className?: string;
  /**
   * `inline` sits in the row that normally holds the file size (file, audio, voice recording).
   * `overlay` is absolutely positioned over the media itself (image, video, gallery), inset
   * from the bottom edge.
   * @default 'inline'
   */
  variant?: 'inline' | 'overlay';
};

/**
 * Upload progress of an attachment whose message is being sent. Renders the same
 * {@link UploadProgressIndicator} and {@link AttachmentUploadedSizeIndicator} as the composer's
 * attachment previews, and `null` for an attachment that is not mid-upload, such as any attachment
 * returned by the API.
 */
export const AttachmentUploadProgressIndicator = ({
  attachment,
  attachments,
  className,
  variant = 'inline',
}: AttachmentUploadProgressIndicatorProps) => {
  const resolvedAttachments = useMemo(
    () => (attachment ? [attachment] : (attachments ?? [])),
    [attachment, attachments],
  );
  const { isUploading, progress, uploadConfirmationPending } =
    useAttachmentsUploadState(resolvedAttachments);

  if (!isUploading) return null;

  return (
    <div
      className={clsx(
        'str-chat__attachment-upload-progress',
        `str-chat__attachment-upload-progress--${variant}`,
        className,
      )}
      data-testid='attachment-upload-progress'
    >
      <UploadProgressIndicator
        uploadConfirmationPending={uploadConfirmationPending}
        uploadProgress={progress}
      />
      {/*
        The byte readout keeps the real value, so it settles on "4.3 MB / 4.3 MB" while the
        spinner runs. Byte counts only make sense for one attachment; a gallery shows the ring.
      */}
      {attachment && (
        <AttachmentUploadedSizeIndicator
          attachment={attachment}
          uploadProgress={progress}
        />
      )}
    </div>
  );
};
