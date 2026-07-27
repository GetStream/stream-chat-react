import clsx from 'clsx';
import { Button } from '../Button';
import React, { type ComponentProps } from 'react';
import { useComponentContextIcons, useTranslationContext } from '../../context';
import type { AttachmentLoadingState } from 'stream-chat';

export const RemoveAttachmentPreviewButton = ({
  className,
  uploadState,
  ...props
}: ComponentProps<'button'> & {
  uploadState?: AttachmentLoadingState;
}) => {
  const { IconXmarkSmall } = useComponentContextIcons();

  const { t } = useTranslationContext();
  return (
    <Button
      aria-label={t('aria/Remove attachment')}
      circular
      className={clsx('str-chat__attachment-preview__remove-button', className)}
      data-testid='preview-item-delete-button'
      disabled={uploadState === 'uploading'}
      {...props}
    >
      <IconXmarkSmall />
    </Button>
  );
};
