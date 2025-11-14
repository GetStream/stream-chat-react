import type { ComponentType } from 'react';
import { useEffect } from 'react';
import { useRef, useState } from 'react';
import React from 'react';
import type { Coords, SharedLocationResponse } from 'stream-chat';
import { useChatContext, useTranslationContext } from '../../context';
import { ExternalLinkIcon, GeolocationIcon } from './icons';

export type GeolocationMapProps = Coords;

export type GeolocationProps = {
  location: SharedLocationResponse;
  GeolocationAttachmentMapPlaceholder?: ComponentType<GeolocationAttachmentMapPlaceholderProps>;
  GeolocationMap?: ComponentType<GeolocationMapProps>;
};

export const Geolocation = ({
  GeolocationAttachmentMapPlaceholder = DefaultGeolocationAttachmentMapPlaceholder,
  GeolocationMap,
  location,
}: GeolocationProps) => {
  const { channel, client } = useChatContext();
  const { t } = useTranslationContext();

  const [stoppedSharing, setStoppedSharing] = useState(
    !!location.end_at && new Date(location.end_at).getTime() < new Date().getTime(),
  );
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const isMyLocation = location.user_id === client.userID;
  const isLiveLocation = !!location.end_at;

  useEffect(() => {
    if (!location.end_at) return;
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(
      () => setStoppedSharing(true),
      new Date(location.end_at).getTime() - Date.now(),
    );
  }, [location.end_at]);

  return (
    <div
      className='str-chat__message-attachment-geolocation'
      data-testid='attachment-geolocation'
    >
      <div className='str-chat__message-attachment-geolocation__location-preview'>
        {GeolocationMap ? (
          <GeolocationMap latitude={location.latitude} longitude={location.longitude} />
        ) : (
          <GeolocationAttachmentMapPlaceholder location={location} />
        )}
      </div>
      <div className='str-chat__message-attachment-geolocation__status'>
        {isLiveLocation ? (
          stoppedSharing ? (
            t('Location sharing ended')
          ) : isMyLocation ? (
            <div className='str-chat__message-attachment-geolocation__status--active'>
              <button
                className='str-chat__message-attachment-geolocation__stop-sharing-button'
                onClick={() => channel?.stopLiveLocationSharing(location)}
                type='button'
              >
                {t('Stop sharing')}
              </button>
              <div className='str-chat__message-attachment-geolocation__status--active-until'>
                {t('Live until {{ timestamp }}', {
                  timestamp: t('timestamp/LiveLocation', { timestamp: location.end_at }),
                })}
              </div>
            </div>
          ) : (
            <div className='str-chat__message-attachment-geolocation__status--active'>
              <div className='str-chat__message-attachment-geolocation__status--active-status'>
                {t('Live location')}
              </div>
              <div className='str-chat__message-attachment-geolocation__status--active-until'>
                {t('Live until {{ timestamp }}', {
                  timestamp: t('timestamp/LiveLocation', { timestamp: location.end_at }),
                })}
              </div>
            </div>
          )
        ) : (
          t('Current location')
        )}
      </div>
    </div>
  );
};

export type GeolocationAttachmentMapPlaceholderProps = {
  location: SharedLocationResponse;
};

const DefaultGeolocationAttachmentMapPlaceholder = ({
  location,
}: GeolocationAttachmentMapPlaceholderProps) => (
  <div
    className='str-chat__message-attachment-geolocation__placeholder'
    data-testid='geolocation-attachment-map-placeholder'
  >
    <GeolocationIcon />
    <a
      className='str-chat__message-attachment-geolocation__placeholder-link'
      href={`https://maps.google.com?q=${[location.latitude, location.longitude].join()}`}
      rel='noreferrer'
      target='_blank'
    >
      <ExternalLinkIcon />
    </a>
  </div>
);
