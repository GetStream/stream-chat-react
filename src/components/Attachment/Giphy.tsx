import type { Attachment } from 'stream-chat';
import { BaseImage as DefaultBaseImage } from '../BaseImage';
import { toGalleryItemDescriptors } from '../Gallery';
import clsx from 'clsx';
import {
  useChannelStateContext,
  useComponentContext,
  useTranslationContext,
} from '../../context';
import { IconGiphy } from '../Icons';
import { type CSSProperties, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { ImageAttachmentConfiguration } from '../../types/types';

export type GiphyAttachmentProps = {
  attachment: Attachment;
};

export const Giphy = ({ attachment }: GiphyAttachmentProps) => {
  const { giphyVersion: giphyVersionName, imageAttachmentSizeHandler } =
    useChannelStateContext();
  const { BaseImage = DefaultBaseImage } = useComponentContext();
  const { t } = useTranslationContext();
  const usesDefaultBaseImage = BaseImage === DefaultBaseImage;
  const imageElement = useRef<HTMLImageElement>(null);
  const [attachmentConfiguration, setAttachmentConfiguration] = useState<
    ImageAttachmentConfiguration | undefined
  >(undefined);

  const imageDescriptors = useMemo(
    () => toGalleryItemDescriptors(attachment, { giphyVersionName }),
    [attachment, giphyVersionName],
  );
  const alt = imageDescriptors && imageDescriptors.alt;
  const dimensions = imageDescriptors && imageDescriptors.dimensions;
  const imageUrl = imageDescriptors && imageDescriptors.imageUrl;
  const title = imageDescriptors && imageDescriptors.title;
  const resolvedImageUrl = attachmentConfiguration?.url || imageUrl;
  const imageStyleVariables = useMemo(() => {
    const originalHeight = Number(dimensions?.height);
    const originalWidth = Number(dimensions?.width);

    return {
      '--original-height': String(originalHeight > 1 ? originalHeight : 1000000),
      '--original-width': String(originalWidth > 1 ? originalWidth : 1000000),
    } as CSSProperties;
  }, [dimensions?.height, dimensions?.width]);

  useLayoutEffect(() => {
    if (!imageElement.current || !imageAttachmentSizeHandler) return;

    const config = imageAttachmentSizeHandler(attachment, imageElement.current);
    setAttachmentConfiguration(config);
  }, [attachment, imageAttachmentSizeHandler]);

  if (!imageUrl) return null;

  return (
    <div className={clsx(`str-chat__message-attachment-giphy`)}>
      <BaseImage
        alt={alt ?? title ?? t('User uploaded content')}
        height={dimensions?.height}
        ref={imageElement}
        src={resolvedImageUrl}
        style={imageStyleVariables}
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
