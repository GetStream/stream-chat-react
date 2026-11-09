import 'leaflet/dist/leaflet.css';
import { divIcon } from 'leaflet';
import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { MapContainer, Marker, TileLayer, useMap } from 'react-leaflet';
import './LocationMap.css';

const TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

// Leaflet's default pin builds its image URLs from where leaflet.css was loaded, which a bundler
// changes, so the pin shows as a broken image. A div marker needs no images and takes the theme's colors.
const markerIcon = divIcon({
  className: 'cookbook-location-map__marker',
  iconSize: [20, 20],
});

/** `MapContainer` reads `center` only when it mounts; this keeps a moving position in view. */
const FollowPosition = ({
  latitude,
  longitude,
}: {
  latitude: number;
  longitude: number;
}) => {
  const map = useMap();

  useEffect(() => {
    map.panTo([latitude, longitude]);
  }, [map, latitude, longitude]);

  return null;
};

export type LocationMapProps = {
  /** Names the map for screen readers, for example "Map of Bob's location". */
  label: string;
  latitude: number;
  longitude: number;
  /** Shown over the map's top corner. */
  badge?: ReactNode;
  /** A small map inside a message: no zoom buttons, and the mouse wheel scrolls the list. */
  compact?: boolean;
};

/** An OpenStreetMap map centred on one position, with a marker on it. */
export const LocationMap = ({
  badge,
  compact = false,
  label,
  latitude,
  longitude,
}: LocationMapProps) => (
  <div aria-label={label} className='cookbook-location-map' role='region'>
    <MapContainer
      center={[latitude, longitude]}
      className='cookbook-location-map__map'
      scrollWheelZoom={!compact}
      zoom={15}
      zoomControl={!compact}
    >
      <TileLayer attribution={TILE_ATTRIBUTION} url={TILE_URL} />
      {/* Not focusable: the marker does nothing when activated. */}
      <Marker icon={markerIcon} keyboard={false} position={[latitude, longitude]} />
      <FollowPosition latitude={latitude} longitude={longitude} />
    </MapContainer>
    {badge && <div className='cookbook-location-map__badge'>{badge}</div>}
  </div>
);
