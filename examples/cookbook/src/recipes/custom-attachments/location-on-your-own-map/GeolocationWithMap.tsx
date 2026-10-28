import { createContext, useContext } from 'react';
import type { SharedLocationResponseData } from 'stream-chat';
import { convertTimestampToDate } from 'stream-chat';
import type {
  AttachmentProps,
  GeolocationMapProps,
  GeolocationProps,
} from 'stream-chat-react';
import { Attachment, Geolocation, useTranslationContext } from 'stream-chat-react';
import { LocationMap } from './LocationMap';

/**
 * `Geolocation` gives its map only the coordinates. The rest of the location (whose it is, when it
 * last moved) reaches the map through this context.
 */
const SharedLocationContext = createContext<SharedLocationResponseData | undefined>(
  undefined,
);

/** "Updated 10:42 AM", for a live location: when its position last changed. */
const useLastUpdate = (location?: SharedLocationResponseData) => {
  const { userLanguage } = useTranslationContext();
  const updatedAt = location?.end_at ? convertTimestampToDate(location.updated_at) : null;
  if (!updatedAt) return undefined;
  const time = new Intl.DateTimeFormat(userLanguage || undefined, {
    timeStyle: 'short',
  }).format(updatedAt);
  return `Updated ${time}`;
};

const MessageMap = ({ latitude, longitude }: GeolocationMapProps) => {
  const location = useContext(SharedLocationContext);
  const lastUpdate = useLastUpdate(location);

  return (
    <LocationMap
      badge={lastUpdate}
      compact
      label={location?.end_at ? 'Map of a live location' : 'Map of a shared location'}
      latitude={latitude}
      longitude={longitude}
    />
  );
};

const GeolocationWithMap = (props: GeolocationProps) => (
  <SharedLocationContext.Provider value={props.location}>
    <Geolocation {...props} GeolocationMap={MessageMap} />
  </SharedLocationContext.Provider>
);

export const AttachmentWithMaps = (props: AttachmentProps) => (
  <Attachment {...props} Geolocation={GeolocationWithMap} />
);
