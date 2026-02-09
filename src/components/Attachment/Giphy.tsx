import type { Attachment } from 'stream-chat';
import { ImageComponent } from '../Gallery';
import clsx from 'clsx';
import { useChannelStateContext } from '../../context';
import { IconGiphy } from '../Icons';

export type GiphyAttachmentProps = {
  attachment: Attachment;
};

export const Giphy = ({ attachment }: GiphyAttachmentProps) => {
  const { giphy, thumb_url, title } = attachment;
  const { giphyVersion: giphyVersionName } = useChannelStateContext();

  if (typeof giphy === 'undefined') return null;

  const giphyVersion = giphy[giphyVersionName as keyof NonNullable<Attachment['giphy']>];

  const fallback = giphyVersion.url || thumb_url;
  const dimensions: { height?: string; width?: string } = {
    height: giphyVersion.height,
    width: giphyVersion.width,
  };

  return (
    <div className={clsx(`str-chat__message-attachment-giphy`)}>
      <ImageComponent
        fallback={fallback}
        thumb_url={thumb_url}
        title={title || fallback}
        {...dimensions}
      />
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
