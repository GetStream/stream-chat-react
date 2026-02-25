import clsx from 'clsx';
import { IconCrossSmall } from '../Icons';
import { Button } from '../Button';
import React, { type ComponentProps } from 'react';
import { useTranslationContext } from '../../context';
import type { AttachmentLoadingState } from 'stream-chat';

export const RemoveAttachmentPreviewButton = ({
  className,
  uploadState,
  ...props
}: ComponentProps<'button'> & {
  uploadState?: AttachmentLoadingState;
}) => {
  const { t } = useTranslationContext();
  return (
    <Button
      appearance='solid'
      aria-label={t('aria/Remove attachment')}
      circular
      className={clsx('str-chat__attachment-preview__remove-button', className)}
      data-testid='preview-item-delete-button'
      disabled={uploadState === 'uploading'}
      type='button'
      variant='secondary'
      {...props}
    >
      <IconCrossSmall />
    </Button>
  );
};
