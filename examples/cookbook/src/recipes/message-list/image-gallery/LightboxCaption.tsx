import type { GalleryItem } from 'stream-chat-react';
import './LightboxCaption.css';

/**
 * The caption under the current item: the attachment's own `title`, or the text of the message it
 * was shared in when the attachment has none.
 */
export const LightboxCaption = ({ item }: { item: GalleryItem }) => {
  const caption = item.title || item.message?.text;
  if (!caption) return null;

  return <figcaption className='cookbook-lightbox-caption'>{caption}</figcaption>;
};
