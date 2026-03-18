import type { Attachment } from 'stream-chat';
import { BaseImage as DefaultBaseImage, toGalleryItemDescriptors } from '../Gallery';
import clsx from 'clsx';
import {
  useChannelStateContext,
  useComponentContext,
  useTranslationContext,
} from '../../context';
import { IconGiphy } from '../Icons';
import { useMemo } from 'react';

export type GiphyAttachmentProps = {
  attachment: Attachment;
};

export const Giphy = ({ attachment }: GiphyAttachmentProps) => {
  const { giphyVersion: giphyVersionName } = useChannelStateContext();
  const { BaseImage = DefaultBaseImage } = useComponentContext();
  const { t } = useTranslationContext();
  const usesDefaultBaseImage = BaseImage === DefaultBaseImage;

  const imageDescriptors = useMemo(
    () => toGalleryItemDescriptors(attachment, { giphyVersionName }),
    [attachment, giphyVersionName],
  );

  if (!imageDescriptors?.imageUrl) return null;

  const { alt, dimensions, imageUrl, title } = imageDescriptors;

  return (
    <div className={clsx(`str-chat__message-attachment-giphy`)}>
      <BaseImage
        alt={alt ?? title ?? t('User uploaded content')}
        height={dimensions?.height}
        src={imageUrl}
        width={dimensions?.width}
        {...(usesDefaultBaseImage ? { showDownloadButtonOnError: false } : {})}
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
