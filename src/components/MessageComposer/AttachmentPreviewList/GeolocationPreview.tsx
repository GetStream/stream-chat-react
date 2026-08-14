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
  const title = shareDuration
    ? t('common.liveLocation.text', 'Live location')
    : t('common.currentLocation.text', 'Current location');

  return (
    <div className='str-chat__location-preview' data-testid='location-preview'>
      <PreviewImage location={location} />
      <div className='str-chat__location-preview__data'>
        <div
          className='str-chat__location-preview__data__title'
          title={t(
            'messageComposer.geolocationPreview.sharedLocation.title',
            'Shared location',
          )}
        >
          {title}
        </div>
        <div className='str-chat__location-preview__data__subtitle'>
          {t(
            'messageComposer.geolocationPreview.location.text',
            'Location: {{ coordinates }}',
            {
              coordinates: `${location.latitude}, ${location.longitude}`,
            },
          )}
        </div>
        {shareDuration && (
          <div className='str-chat__location-preview__data__sharing-duration'>
            {t('messageComposer.geolocationPreview.live.text', 'Live for {{duration}}', {
              duration: t('duration.shareLocation', {
                milliseconds: shareDuration,
              }),
            })}
          </div>
        )}
      </div>
      {remove && (
        <RemoveAttachmentPreviewButton
          aria-label={t(
            'messageComposer.geolocationPreview.removeLocationAttachment.ariaLabel',
            'Remove location attachment',
          )}
          className='str-chat__attachment-preview__remove-button'
          data-testid='location-preview-item-delete-button'
          onClick={remove}
        />
      )}
    </div>
  );
};
