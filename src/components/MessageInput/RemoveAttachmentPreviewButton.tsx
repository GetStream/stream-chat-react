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
      aria-label={t('aria/Remove attachment')}
      className={clsx(
        'str-chat__attachment-preview__remove-button',
        'str-chat__button--solid',
        'str-chat__button--circular',
        className,
      )}
      data-testid='preview-item-delete-button'
      type='button'
      {...props}
      disabled={uploadState === 'uploading'}
    >
      <IconCrossSmall />
    </Button>
  );
};
