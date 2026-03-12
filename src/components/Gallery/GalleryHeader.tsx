import React, { useContext, useMemo } from 'react';
import { sanitizeUrl } from '@braintree/sanitize-url';

import { type GalleryItem } from './GalleryContext';
import { Button } from '../Button';
import { IconArrowDownCircle, IconCrossMedium } from '../Icons';
import { MessageTimestamp as DefaultMessageTimestamp } from '../Message/MessageTimestamp';
import {
  ModalContext,
  useComponentContext,
  useMessageContext,
  useTranslationContext,
} from '../../context';

type GalleryHeaderProps = {
  currentItem: GalleryItem;
};

export const GalleryHeader = ({ currentItem }: GalleryHeaderProps) => {
  const { t } = useTranslationContext();
  const { MessageTimestamp = DefaultMessageTimestamp } = useComponentContext('GalleryUI');
  const { isMyMessage, message } = useMessageContext('GalleryUI');
  const modalContext = useContext(ModalContext);

  const headerTitle =
    (isMyMessage?.() && t('You')) ||
    message?.user?.name ||
    message?.user?.id ||
    currentItem.title ||
    t('User uploaded content');
  const downloadUrl = useMemo(() => {
    const rawDownloadUrl = currentItem.videoUrl ?? currentItem.imageUrl;

    if (!rawDownloadUrl) return undefined;

    const sanitizedUrl = sanitizeUrl(rawDownloadUrl);

    return sanitizedUrl === 'about:blank' ? undefined : sanitizedUrl;
  }, [currentItem.imageUrl, currentItem.videoUrl]);
  const downloadLabel = t('aria/Download attachment');

  return (
    <div className='str-chat__gallery__header'>
      <div aria-hidden='true' className='str-chat__gallery__header-spacer' />
      <div className='str-chat__gallery__header-meta'>
        <div className='str-chat__gallery__title'>{headerTitle}</div>
        {message?.created_at ? (
          <MessageTimestamp customClass='str-chat__gallery__timestamp' />
        ) : null}
      </div>
      <div className='str-chat__gallery__header-actions'>
        {downloadUrl ? (
          <a
            aria-label={downloadLabel}
            className='str-chat__gallery__action-button str-chat__gallery__action-button--download'
            download
            href={downloadUrl}
            rel='noreferrer'
            target='_blank'
            title={downloadLabel}
          >
            <IconArrowDownCircle />
          </a>
        ) : null}
        {modalContext?.close ? (
          <Button
            aria-label={t('Close')}
            className='str-chat__gallery__action-button str-chat__gallery__action-button--close'
            onClick={modalContext.close}
            title={t('Close')}
          >
            <IconCrossMedium />
          </Button>
        ) : null}
      </div>
    </div>
  );
};
