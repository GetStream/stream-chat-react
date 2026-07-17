import clsx from 'clsx';
import { IconXmarkSmall as DefaultIconXmarkSmall } from '../Icons';
import { Button } from '../Button';
import React, { type ComponentProps } from 'react';
import { useComponentContext, useTranslationContext } from '../../context';
import type { AttachmentLoadingState } from 'stream-chat';

export const RemoveAttachmentPreviewButton = ({
  className,
  uploadState,
  ...props
}: ComponentProps<'button'> & {
  uploadState?: AttachmentLoadingState;
}) => {
  const { icons: { IconXmarkSmall = DefaultIconXmarkSmall } = {} } =
    useComponentContext();

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
