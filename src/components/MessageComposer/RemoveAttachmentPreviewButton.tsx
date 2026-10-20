import clsx from 'clsx';
import { Button } from '../Button';
import React, { type ComponentProps } from 'react';
import { useComponentContextIcons, useTranslationContext } from '../../context';
import type { AttachmentLoadingState } from 'stream-chat';

/** Upload states in which the request is still running, so removing also cancels it. */
const IN_FLIGHT_UPLOAD_STATES: AttachmentLoadingState[] = ['pending', 'uploading'];

export const RemoveAttachmentPreviewButton = ({
  className,
  uploadState,
  ...props
}: ComponentProps<'button'> & {
  uploadState?: AttachmentLoadingState;
}) => {
  const { IconXmarkSmall } = useComponentContextIcons();
  const { t } = useTranslationContext();

  // The button stays actionable mid-upload: `removeAttachments` forwards to
  // `UploadManager.deleteUploadRecord`, which aborts the request through its `AbortController`.
  // The `uploadState: 'failed'` update that follows is a no-op because `updateAttachment` ignores
  // an ID that is no longer in state.
  const isInFlight = !!uploadState && IN_FLIGHT_UPLOAD_STATES.includes(uploadState);

  return (
    <Button
      aria-label={
        isInFlight
          ? t(
              'messageComposer.removeAttachmentPreviewButton.cancelUpload.ariaLabel',
              'Cancel upload',
            )
          : t(
              'messageComposer.removeAttachmentPreview.removeAttachment.ariaLabel',
              'Remove attachment',
            )
      }
      circular
      className={clsx('str-chat__attachment-preview__remove-button', className)}
      data-testid='preview-item-delete-button'
      {...props}
    >
      <IconXmarkSmall />
    </Button>
  );
};
