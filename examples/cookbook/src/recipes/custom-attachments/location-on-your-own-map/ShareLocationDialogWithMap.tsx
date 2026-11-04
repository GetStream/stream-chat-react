import type {
  ShareGeolocationMapProps,
  ShareLocationDialogProps,
} from 'stream-chat-react';
import { Button, ShareLocationDialog } from 'stream-chat-react';
import { LocationMap } from './LocationMap';
import './ShareLocationDialogWithMap.css';

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;

// Declared once: the dialog filters out durations shorter than a minute whenever it gets a new list.
const shareDurations = [15 * MINUTE, HOUR, 3 * HOUR];

/** The browser's reason, in words the user can act on. */
const describeError = (error: GeolocationPositionError) =>
  error.code === error.PERMISSION_DENIED
    ? 'Location access is blocked. Allow it for this site in your browser, then try again.'
    : "Your location isn't available right now.";

const DialogMap = ({
  geolocationPositionError,
  latitude,
  loadingLocation,
  longitude,
  restartLocationWatching,
}: ShareGeolocationMapProps) => {
  if (geolocationPositionError) {
    return (
      <div className='cookbook-share-location-map__status' role='alert'>
        <p>{describeError(geolocationPositionError)}</p>
        <Button
          appearance='outline'
          onClick={restartLocationWatching}
          size='sm'
          variant='secondary'
        >
          Try again
        </Button>
      </div>
    );
  }

  // Before the first position arrives, the dialog may not report loading yet.
  if (loadingLocation || latitude == null || longitude == null) {
    return (
      <div className='cookbook-share-location-map__status' role='status'>
        Finding your location…
      </div>
    );
  }

  return (
    <div className='cookbook-share-location-map'>
      <LocationMap
        label='Map of your location'
        latitude={latitude}
        longitude={longitude}
      />
    </div>
  );
};

export const ShareLocationDialogWithMap = (props: ShareLocationDialogProps) => (
  <ShareLocationDialog
    {...props}
    GeolocationMap={DialogMap}
    shareDurations={shareDurations}
  />
);
