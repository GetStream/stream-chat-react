import React from 'react';
import clsx from 'clsx';
import { useTranslationContext } from '../../context/TranslationContext';
import { useComponentContextIcons } from '../../context';

export type ImagePlaceholderProps = {
  className?: string;
};

export const ImagePlaceholder = ({ className }: ImagePlaceholderProps) => {
  const { IconImage } = useComponentContextIcons();

  const { t } = useTranslationContext();
  return (
    <div
      aria-label={t('aria/Image failed to load')}
      className={clsx('str-chat__image-placeholder', className)}
      data-testid='str-chat__base-image-placeholder'
      role='img'
    >
      <IconImage />
    </div>
  );
};
