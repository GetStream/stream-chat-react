import type { GalleryItem } from 'stream-chat-react';
import './LightboxMedia.css';

/**
 * The lightbox's current item: a video plays in the browser's own player, with its thumbnail as
 * the poster; an image shows at full size.
 */
export const LightboxMedia = ({ item }: { item: GalleryItem }) =>
  item.videoUrl ? (
    <video
      className='cookbook-lightbox-media'
      controls
      // A new key per video, so moving to another item stops the one that was playing.
      key={item.videoUrl}
      poster={item.videoThumbnailUrl}
      preload='metadata'
      src={item.videoUrl}
    />
  ) : (
    <img
      alt={item.title ?? ''}
      className='cookbook-lightbox-media'
      draggable={false}
      src={item.imageUrl}
    />
  );
