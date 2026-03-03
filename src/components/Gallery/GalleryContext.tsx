import { createContext, useContext } from 'react';

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
import type { BaseImageProps } from './BaseImage';

type AttachmentPreviewableInGallery =
  | LocalImageAttachment
  | LocalVideoAttachment
  | LinkPreview
  | Attachment;

export const toGalleryItemDescriptors = (
  attachment: AttachmentPreviewableInGallery,
  options: { giphyVersionName?: string } = {},
): Pick<
  GalleryItem,
  'alt' | 'dimensions' | 'imageUrl' | 'title' | 'videoThumbnailUrl' | 'videoUrl'
> | void => {
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
    // LinkPreview + OGAttachment
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
};

export type GalleryItem = Omit<BaseImageProps, 'src'> & {
  dimensions?: Dimensions;
  imageUrl?: string;
  videoThumbnailUrl?: string;
  videoUrl?: string;
};

export type GalleryContextValue = {
  /** Currently displayed item index */
  currentIndex: number;
  /** Currently displayed item */
  currentItem: GalleryItem;
  /** Navigate to a specific index */
  goToIndex: (index: number) => void;
  /** Navigate to the next item */
  goToNext: () => void;
  /** Navigate to the previous item */
  goToPrevious: () => void;
  /** Whether there is a next item */
  hasNext: boolean;
  /** Whether there is a previous item */
  hasPrevious: boolean;
  /** Total number of items */
  itemCount: number;
  /** All items in the gallery */
  items: GalleryItem[];
};

export const GalleryContext = createContext<GalleryContextValue | undefined>(undefined);

export const useGalleryContext = () => {
  const contextValue = useContext(GalleryContext);

  if (!contextValue) {
    console.warn(
      `The useGalleryContext hook was called outside of the GalleryContext provider. Make sure this hook is called within a child of the Gallery component.`,
    );

    return {} as GalleryContextValue;
  }

  return contextValue;
};
