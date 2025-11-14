import type { LiveLocationPreview, StaticLocationPreview } from 'stream-chat';
import { CloseIcon } from '../icons';
import type { ComponentType } from 'react';
import React from 'react';
import { useTranslationContext } from '../../../context';
import { GeolocationIcon } from '../../Attachment/icons';

type GeolocationPreviewImageProps = {
  location: StaticLocationPreview | LiveLocationPreview;
};

const GeolocationPreviewImage = () => (
  <div className='str-chat__location-preview-image'>
    <GeolocationIcon />
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
  return (
    <div className='str-chat__location-preview' data-testid='location-preview'>
      <PreviewImage location={location} />
      {remove && (
        <button
          aria-label={t('aria/Remove location attachment')}
          className='str-chat__attachment-preview-delete'
          data-testid='location-preview-item-delete-button'
          onClick={remove}
          type='button'
        >
          <CloseIcon />
        </button>
      )}

      <div className='str-chat__attachment-preview-metadata'>
        {(location as LiveLocationPreview).durationMs ? (
          <>
            <div
              className='str-chat__attachment-preview-title'
              title={t('Shared live location')}
            >
              {t('Live location')}
            </div>
            <div className='str-chat__attachment-preview-subtitle'>
              {t('Live for {{duration}}', {
                duration: t('duration/Share Location', {
                  milliseconds: (location as LiveLocationPreview).durationMs,
                }),
              })}
            </div>
          </>
        ) : (
          <>
            <div
              className='str-chat__attachment-preview-title'
              title={t('Current location')}
            >
              {t('Current location')}
            </div>
            <div className='str-chat__attachment-preview-subtitle'>
              {location.latitude}, {location.longitude}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
