import {
  type Attachment,
  isGiphyAttachment,
  isImageAttachment,
  isLocalImageAttachment,
  isLocalVideoAttachment,
  isScrapedContent,
  isVideoAttachment,
  type LinkPreview,
  type LocalImageAttachment,
  type LocalVideoAttachment,
} from 'stream-chat';
import type { Dimensions } from '../../types/types';
import { getGiphyDescriptiveTitle } from '../Attachment/giphyAccessibility';

type AttachmentPreviewableInGallery =
  | LocalImageAttachment
  | LocalVideoAttachment
  | LinkPreview
  | Attachment;

/** Image and video fields shared with gallery items. */
export type BaseImageDescriptor = {
  alt?: string;
  dimensions?: Dimensions;
  imageUrl?: string;
  title?: string;
  videoThumbnailUrl?: string;
  videoUrl?: string;
};

/**
 * Maps an attachment or link preview to the image and video fields that {@link BaseImage} and the
 * gallery render.
 *
 * @param attachment - Attachment or link preview to describe.
 * @param options.giphyVersionName - Key of `attachment.giphy` that supplies the image URL and
 * dimensions of a Giphy attachment. Without that version the image loads from `thumb_url`.
 * @returns The descriptor, or undefined when the attachment is not an image, video, Giphy or link
 * preview.
 */
export const toBaseImageDescriptors = (
  attachment: AttachmentPreviewableInGallery,
  options: { giphyVersionName?: string } = {},
): BaseImageDescriptor | undefined => {
  if (isGiphyAttachment(attachment)) {
    const giphyVersion =
      options?.giphyVersionName && attachment.giphy
        ? attachment.giphy[
            options.giphyVersionName as keyof NonNullable<Attachment['giphy']>
          ]
        : undefined;

    return {
      // Giphy titles are often media URLs, which are not a usable text alternative.
      alt: getGiphyDescriptiveTitle(attachment.title),
      dimensions: giphyVersion
        ? {
            height: giphyVersion.height,
            width: giphyVersion.width,
          }
        : undefined,
      imageUrl: giphyVersion?.url || attachment.thumb_url,
      title: attachment.title || attachment.thumb_url,
    };
  }

  if (isScrapedContent(attachment)) {
    const imageUrl = attachment.image_url || attachment.thumb_url;
    return {
      alt: attachment.title || imageUrl,
      imageUrl,
      title: attachment.title,
    };
  }

  if (isLocalVideoAttachment(attachment)) {
    return {
      title: attachment.title,
      // `previewUri` is the video file's own blob URL, which cannot render as an image.
      videoThumbnailUrl: attachment.thumb_url,
      videoUrl: attachment.asset_url ?? attachment.localMetadata.previewUri,
    };
  }

  if (isVideoAttachment(attachment)) {
    return {
      title: attachment.title,
      videoThumbnailUrl: attachment.thumb_url,
      videoUrl: attachment.asset_url,
    };
  }

  if (isLocalImageAttachment(attachment)) {
    const imageUrl = attachment.image_url || attachment.localMetadata.previewUri;
    return {
      alt: attachment.title || imageUrl,
      imageUrl,
      title: attachment.title,
    };
  }

  if (isImageAttachment(attachment)) {
    const imageUrl = attachment.image_url;
    return {
      alt: attachment.title || imageUrl,
      imageUrl,
      title: attachment.title,
    };
  }

  return undefined;
};
