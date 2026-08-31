import type { ComponentType } from 'react';
import { useEffect } from 'react';
import { useRef, useState } from 'react';
import React from 'react';
import type { Coords, SharedLocationResponseData } from 'stream-chat';
import { useChannel, useChatContext, useTranslationContext } from '../../context';
import { ExternalLinkIcon } from './icons';
import { IconLocation } from '../Icons';
import { Button } from '../Button';
import { convertTimestampToDate, nowNs, nsToMs } from 'stream-chat';

export type GeolocationMapProps = Coords;

export type GeolocationProps = {
  location: SharedLocationResponseData;
  GeolocationAttachmentMapPlaceholder?: ComponentType<GeolocationAttachmentMapPlaceholderProps>;
  GeolocationMap?: ComponentType<GeolocationMapProps>;
};

export const Geolocation = ({
  GeolocationAttachmentMapPlaceholder = DefaultGeolocationAttachmentMapPlaceholder,
  GeolocationMap,
  location,
}: GeolocationProps) => {
  const { client } = useChatContext();
  const channel = useChannel();
  const { t } = useTranslationContext();

  const [stoppedSharing, setStoppedSharing] = useState(
    !!location.end_at && location.end_at < nowNs(),
  );
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const isMyLocation = location.user_id === client.userID;
  const isLiveLocation = !!location.end_at;

  useEffect(() => {
    if (!location.end_at) return;
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(
      () => setStoppedSharing(true),
      // Both operands are wire timestamps, so the difference is in nanoseconds. Passing it raw
      // made `setTimeout` fire immediately and end sharing on mount.
      Math.max(0, nsToMs(location.end_at - nowNs())),
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
            t(
              'attachment.geolocation.locationSharingEnded.text',
              'Location sharing ended',
            )
          ) : isMyLocation ? (
            <div className='str-chat__message-attachment-geolocation__status--active'>
              <Button
                appearance='outline'
                className='str-chat__message-attachment-geolocation__stop-sharing-button'
                onClick={() =>
                  // The request shape, not the whole response: `stopLiveLocationSharing` stamps
                  // `end_at` itself, and the response's timestamps are wire numbers a request
                  // field cannot take.
                  channel?.stopLiveLocationSharing({ message_id: location.message_id })
                }
                size='sm'
                variant='secondary'
              >
                {t('attachment.geolocation.stopSharing.text', 'Stop sharing')}
              </Button>
              <div className='str-chat__message-attachment-geolocation__status--active-until'>
                {t(
                  'attachment.geolocation.liveUntil.text',
                  'Live until {{ timestamp }}',
                  {
                    timestamp: t('timestamp.LiveLocation', {
                      timestamp: convertTimestampToDate(location.end_at),
                    }),
                  },
                )}
              </div>
            </div>
          ) : (
            <div className='str-chat__message-attachment-geolocation__status--active'>
              <div className='str-chat__message-attachment-geolocation__status--active-status'>
                {t('common.liveLocation.text', 'Live location')}
              </div>
              <div className='str-chat__message-attachment-geolocation__status--active-until'>
                {t(
                  'attachment.geolocation.liveUntil.text',
                  'Live until {{ timestamp }}',
                  {
                    timestamp: t('timestamp.LiveLocation', {
                      timestamp: convertTimestampToDate(location.end_at),
                    }),
                  },
                )}
              </div>
            </div>
          )
        ) : (
          t('common.currentLocation.text', 'Current location')
        )}
      </div>
    </div>
  );
};

export type GeolocationAttachmentMapPlaceholderProps = {
  location: SharedLocationResponseData;
};

const DefaultGeolocationAttachmentMapPlaceholder = ({
  location,
}: GeolocationAttachmentMapPlaceholderProps) => {
  const { t } = useTranslationContext();

  return (
    <div
      className='str-chat__message-attachment-geolocation__placeholder'
      data-testid='geolocation-attachment-map-placeholder'
    >
      <IconLocation />
      <a
        aria-label={t(
          'attachment.geolocation.openLocationMap.ariaLabel',
          'Open location in a map',
        )}
        className='str-chat__message-attachment-geolocation__placeholder-link'
        href={`https://maps.google.com?q=${[location.latitude, location.longitude].join()}`}
        rel='noreferrer'
        target='_blank'
      >
        <ExternalLinkIcon />
      </a>
    </div>
  );
};
