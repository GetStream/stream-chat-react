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

type AttachmentPreviewableInGallery =
  | LocalImageAttachment
  | LocalVideoAttachment
  | LinkPreview
  | Attachment;

/** Fields shared with gallery items for image/video preview from an attachment. */
export type BaseImageDescriptor = {
  alt?: string;
  dimensions?: Dimensions;
  imageUrl?: string;
  title?: string;
  videoThumbnailUrl?: string;
  videoUrl?: string;
};

/**
 * Maps an attachment (or link preview) to image/video URLs and metadata for {@link BaseImage} or the gallery.
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
      alt: giphyVersion?.url || attachment.thumb_url,
      dimensions: giphyVersion
        ? {
            height: giphyVersion.height,
            width: giphyVersion.width,
          }
        : undefined,
      imageUrl: attachment.thumb_url,
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
      videoThumbnailUrl: attachment.thumb_url ?? attachment.localMetadata.previewUri,
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
