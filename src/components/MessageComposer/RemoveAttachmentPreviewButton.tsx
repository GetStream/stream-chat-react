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
  // Deliberately still actionable mid-upload: `removeAttachments` forwards to
  // `UploadManager.deleteUploadRecord`, which aborts the request through its `AbortController`,
  // and the `uploadState: 'failed'` update that lands afterwards is a no-op because
  // `updateAttachment` ignores an id that is no longer in state.
  //
  // The button was disabled in this state from 2024 (#2339) until abortable uploads existed;
  // no comment ever recorded the original reason.
  const isInFlight = !!uploadState && IN_FLIGHT_UPLOAD_STATES.includes(uploadState);

  return (
    <Button
      aria-label={isInFlight ? t('aria/Cancel upload') : t('aria/Remove attachment')}
      circular
      className={clsx('str-chat__attachment-preview__remove-button', className)}
      data-testid='preview-item-delete-button'
      {...props}
    >
      <IconXmarkSmall />
    </Button>
  );
};
