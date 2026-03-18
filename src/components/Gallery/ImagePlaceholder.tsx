import React from 'react';
import clsx from 'clsx';
import { useTranslationContext } from '../../context/TranslationContext';
import { IconImages1Alt } from '../Icons';

export type ImagePlaceholderProps = {
  className?: string;
};

export const ImagePlaceholder = ({ className }: ImagePlaceholderProps) => {
  const { t } = useTranslationContext('ImagePlaceholder');
  return (
    <div
      aria-label={t('aria/Image failed to load')}
      className={clsx('str-chat__image-placeholder', className)}
      data-testid='str-chat__base-image-placeholder'
      role='img'
    >
      <IconImages1Alt />
    </div>
  );
};
