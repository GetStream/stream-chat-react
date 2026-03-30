import type { LiveLocationPreview, StaticLocationPreview } from 'stream-chat';
import type { ComponentType } from 'react';
import React from 'react';
import { useTranslationContext } from '../../../context';
import { IconLocation } from '../../Icons';
import { RemoveAttachmentPreviewButton } from '../RemoveAttachmentPreviewButton';

type GeolocationPreviewImageProps = {
  location: StaticLocationPreview | LiveLocationPreview;
};

const GeolocationPreviewImage = () => (
  <div className='str-chat__location-preview-image'>
    <IconLocation />
  </div>
);

export type GeolocationPreviewProps = {
  location: StaticLocationPreview | LiveLocationPreview;
  PreviewImage?: ComponentType<GeolocationPreviewImageProps>;
  remove?: () => void;
};

export const GeolocationPreview = ({
  location,
  PreviewImage = GeolocationPreviewImage,
  remove,
}: GeolocationPreviewProps) => {
  const { t } = useTranslationContext();
  const shareDuration = (location as LiveLocationPreview).durationMs;
  const title = shareDuration ? t('Live location') : t('Current location');

  return (
    <div className='str-chat__location-preview' data-testid='location-preview'>
      <PreviewImage location={location} />
      <div className='str-chat__location-preview__data'>
        <div
          className='str-chat__location-preview__data__title'
          title={t('Shared location')}
        >
          {title}
        </div>
        <div className='str-chat__location-preview__data__subtitle'>
          {t('Location: {{ coordinates }}', {
            coordinates: `${location.latitude}, ${location.longitude}`,
          })}
        </div>
        {shareDuration && (
          <div className='str-chat__location-preview__data__sharing-duration'>
            {t('Live for {{duration}}', {
              duration: t('duration/Share Location', {
                milliseconds: shareDuration,
              }),
            })}
          </div>
        )}
      </div>
      {remove && (
        <RemoveAttachmentPreviewButton
          aria-label={t('aria/Remove location attachment')}
          className='str-chat__attachment-preview__remove-button'
          data-testid='location-preview-item-delete-button'
          onClick={remove}
        />
      )}
    </div>
  );
};
