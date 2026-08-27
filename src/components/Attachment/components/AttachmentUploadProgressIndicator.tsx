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
 * Upload progress for an attachment carried by a message whose send is already under way.
 *
 * Renders exactly what the composer's attachment previews render — the shared
 * {@link UploadProgressIndicator} (a progress ring, or a spinner when the transfer length is
 * not computable) followed by {@link AttachmentUploadedSizeIndicator}'s uploaded/total bytes —
 * so an attachment looks the same either side of pressing send.
 *
 * Renders `null` for any attachment that is not mid-upload, which is every attachment that came
 * back from the API. Placing it in the default widgets therefore changes nothing for messages
 * that are already sent.
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
        The byte readout keeps the real value, so it settles on "4.3 MB / 4.3 MB" rather than
        vanishing while the spinner runs — all the bytes genuinely have been sent.
        Byte counts only make sense for a single attachment; a gallery shows just the ring.
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
