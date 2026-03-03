import type { Attachment } from 'stream-chat';
import { toGalleryItemDescriptors } from '../Gallery';
import clsx from 'clsx';
import { useChannelStateContext } from '../../context';
import { IconGiphy } from '../Icons';
import { useMemo } from 'react';
import { ImageComponent } from './Image';

export type GiphyAttachmentProps = {
  attachment: Attachment;
};

export const Giphy = ({ attachment }: GiphyAttachmentProps) => {
  const { giphyVersion: giphyVersionName } = useChannelStateContext();

  const imageDescriptors = useMemo(
    () => toGalleryItemDescriptors(attachment, { giphyVersionName }),
    [attachment, giphyVersionName],
  );

  if (!imageDescriptors) return null;

  return (
    <div className={clsx(`str-chat__message-attachment-giphy`)}>
      <ImageComponent {...imageDescriptors} />
      <GiphyBadge />
    </div>
  );
};

const GiphyBadge = () => (
  <div className='str-chat__giphy-badge'>
    <IconGiphy />
    Giphy
  </div>
);
