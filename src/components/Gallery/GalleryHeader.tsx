import React, { useContext, useMemo } from 'react';
import { sanitizeUrl } from '@braintree/sanitize-url';

import { type GalleryItem } from './GalleryContext';
import { Button } from '../Button';
import { IconArrowDownCircle, IconXmark } from '../Icons';
import { ModalContext, useChatContext, useTranslationContext } from '../../context';
import { getDateString, isDate } from '../../i18n/utils';

type GalleryHeaderProps = {
  currentItem: GalleryItem;
};

const normalizeTimestamp = (timestamp: GalleryItem['createdAt']) => {
  if (!timestamp) return undefined;
  return isDate(timestamp) ? timestamp.toISOString() : timestamp;
};

/**
 * The gallery renders outside any `MessageProvider` — channel media flattens many messages into a
 * single item list — so the timestamp is derived from the item rather than from message context.
 */
const GalleryTimestamp = ({ createdAt }: Pick<GalleryItem, 'createdAt'>) => {
  const { t, tDateTimeParser } = useTranslationContext();
  const normalizedTimestamp = normalizeTimestamp(createdAt);

  const when = useMemo(
    () =>
      getDateString({
        messageCreatedAt: normalizedTimestamp,
        t,
        tDateTimeParser,
        timestampTranslationKey: 'timestamp.GalleryTimestamp',
      }),
    [normalizedTimestamp, t, tDateTimeParser],
  );

  if (!when) return null;

  return (
    <time className='str-chat__gallery__timestamp' dateTime={normalizedTimestamp}>
      {when}
    </time>
  );
};

export const GalleryHeader = ({ currentItem }: GalleryHeaderProps) => {
  const { t } = useTranslationContext();
  const { client } = useChatContext();
  const modalContext = useContext(ModalContext);
  const { createdAt, user } = currentItem;

  const headerTitle =
    (!!user?.id && user.id === client.userID && t('common.you.label', 'You')) ||
    user?.name ||
    user?.id ||
    currentItem.title ||
    t('common.userUploadedContent.label', 'User uploaded content');
  const downloadUrl = useMemo(() => {
    const rawDownloadUrl = currentItem.videoUrl ?? currentItem.imageUrl;

    if (!rawDownloadUrl) return undefined;

    const sanitizedUrl = sanitizeUrl(rawDownloadUrl);

    return sanitizedUrl === 'about:blank' ? undefined : sanitizedUrl;
  }, [currentItem.imageUrl, currentItem.videoUrl]);
  const downloadLabel = t('common.downloadAttachment.ariaLabel', 'Download attachment');

  return (
    <div className='str-chat__gallery__header'>
      <div aria-hidden='true' className='str-chat__gallery__header-spacer' />
      <div className='str-chat__gallery__header-meta'>
        <div className='str-chat__gallery__title'>{headerTitle}</div>
        <GalleryTimestamp createdAt={createdAt} />
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
            aria-label={t('common.close.ariaLabel', 'Close')}
            className='str-chat__gallery__action-button str-chat__gallery__action-button--close'
            onClick={modalContext.close}
            title={t('common.close.ariaLabel', 'Close')}
          >
            <IconXmark />
          </Button>
        ) : null}
      </div>
    </div>
  );
};
