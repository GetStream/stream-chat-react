import React from 'react';
import clsx from 'clsx';
import { sanitizeUrl } from '@braintree/sanitize-url';

import { useTranslationContext } from '../../../context';
import { IconDownload } from '../../Icons';

export type DownloadButtonProps = {
  /** Attachment asset URL (e.g. `asset_url`). */
  assetUrl?: string;
  className?: string;
  /** Suggested filename for the `download` attribute (not the HTML `title` tooltip). */
  suggestedFileName?: string;
  /** Native browser tooltip; defaults to translated “Download Attachment”. */
  tooltipTitle?: string;
};

/**
 * Icon download control for {@link Audio} and {@link FileAttachment} rows.
 * (BaseImage defines its own small download link when `showDownloadButtonOnError` is used.)
 */
export const DownloadButton = ({
  assetUrl,
  className,
  suggestedFileName,
  tooltipTitle,
}: DownloadButtonProps) => {
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
      download={suggestedFileName ?? ''}
      href={href}
      rel='noopener noreferrer'
      target='_blank'
      title={tooltipTitle ?? t('Download Attachment')}
    >
      <div className='str-chat__button__content'>
        <IconDownload className='str-chat__icon str-chat__audio-attachment-download-button__icon' />
      </div>
    </a>
  );
};
