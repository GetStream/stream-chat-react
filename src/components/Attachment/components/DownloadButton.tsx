import React from 'react';
import clsx from 'clsx';
import { sanitizeUrl } from '@braintree/sanitize-url';

import { useComponentContextIcons, useTranslationContext } from '../../../context';

export type DownloadButtonProps = {
  /** Attachment asset URL (e.g. `asset_url`). */
  assetUrl?: string;
  className?: string;
  /** Suggested filename for the `download` attribute (not the HTML `title` tooltip). */
  suggestedFileName?: string;
  /** Native browser tooltip. Defaults to the translated "Download Attachment". */
  tooltipTitle?: string;
};

/**
 * Icon button that downloads an attachment asset. Renders nothing without an `assetUrl` or when
 * the URL is unsafe (`sanitizeUrl` turns it into `about:blank`).
 */
export const DownloadButton = ({
  assetUrl,
  className,
  suggestedFileName,
  tooltipTitle,
}: DownloadButtonProps) => {
  const { IconDownload } = useComponentContextIcons();
  const { t } = useTranslationContext();
  if (!assetUrl) return null;
  const href = sanitizeUrl(assetUrl);
  if (href === 'about:blank') return null;

  return (
    <a
      aria-label={t('common.downloadAttachment.ariaLabel', 'Download attachment')}
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
      title={tooltipTitle ?? t('common.downloadAttachment.title', 'Download Attachment')}
    >
      <div className='str-chat__button__content'>
        <IconDownload className='str-chat__icon str-chat__audio-attachment-download-button__icon' />
      </div>
    </a>
  );
};
