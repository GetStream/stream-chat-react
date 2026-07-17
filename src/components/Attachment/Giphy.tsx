import type { Attachment } from 'stream-chat';
import { BaseImage as DefaultBaseImage } from '../BaseImage';
import { toGalleryItemDescriptors } from '../Gallery';
import { getGiphyDescriptiveTitle } from './giphyAccessibility';
import clsx from 'clsx';
import {
  useChannelStateContext,
  useComponentContext,
  useTranslationContext,
} from '../../context';
import { IconGiphy as DefaultIconGiphy } from '../Icons';
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
  const dimensions = imageDescriptors && imageDescriptors.dimensions;
  const imageUrl = imageDescriptors && imageDescriptors.imageUrl;
  const title = imageDescriptors && imageDescriptors.title;
  const resolvedImageUrl = attachmentConfiguration?.url || imageUrl;
  // For giphy attachments `imageDescriptors.alt`/`title` may both resolve to a raw
  // media URL (Giphy payloads rarely carry a human title), which is useless to
  // screen-reader users. Prefer a real, non-URL title; otherwise fall back to a
  // localized generic label instead of exposing the URL as the accessible name.
  const descriptiveTitle = getGiphyDescriptiveTitle(title);
  const accessibleName = descriptiveTitle
    ? t('aria/Animated GIF: {{ title }}', { title: descriptiveTitle })
    : t('aria/Animated GIF');
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
        alt={accessibleName}
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

const GiphyBadge = () => {
  const { icons: { IconGiphy = DefaultIconGiphy } = {} } = useComponentContext();
  return (
    <div className='str-chat__giphy-badge'>
      <IconGiphy />
      Giphy
    </div>
  );
};
