import React from 'react';
import clsx from 'clsx';
import { sanitizeUrl } from '@braintree/sanitize-url';

import { useTranslationContext } from '../../../context';
import { IconDownload } from '../../Icons';

export type AudioDownloadButtonProps = {
  /** Attachment asset URL (e.g. `asset_url`). */
  assetUrl?: string;
  className?: string;
  /** Suggested download filename (`download` attribute); falls back to browser default from URL. */
  title?: string;
};

/**
 * Download control for the {@link Audio} attachment widget (Figma: Chat SDK — audio attachment).
 * Distinct from {@link DownloadButton}, which remains for {@link BaseImage} and other image flows.
 */
export const AudioDownloadButton = ({
  assetUrl,
  className,
  title,
}: AudioDownloadButtonProps) => {
  const { t } = useTranslationContext();
  if (!assetUrl) return null;
  const href = sanitizeUrl(assetUrl);
  if (!href) return null;

  return (
    <a
      aria-label={t('aria/Download attachment')}
      className={clsx(
        'str-chat__button',
        'str-chat__button--secondary',
        'str-chat__button--outline',
        'str-chat__button--circular',
        'str-chat__button--size-sm',
        'str-chat__audio-attachment-download-button',
        className,
      )}
      download={title ?? ''}
      href={href}
      rel='noopener noreferrer'
      target='_blank'
    >
      <div className='str-chat__button__content'>
        <IconDownload className='str-chat__icon str-chat__audio-attachment-download-button__icon' />
      </div>
    </a>
  );
};
