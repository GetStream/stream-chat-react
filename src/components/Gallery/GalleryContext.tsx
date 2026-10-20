import { createContext, useContext } from 'react';
import type { LocalMessage, UserResponse } from 'stream-chat';

import { requireContext } from '../../context/requireContext';
import { toBaseImageDescriptors } from '../BaseImage';
import type { BaseImageProps } from '../BaseImage';
import type { Dimensions } from '../../types/types';

export type GalleryItem = Omit<BaseImageProps, 'src'> & {
  /** When the media was shared; drives the gallery header timestamp. */
  createdAt?: string | Date;
  dimensions?: Dimensions;
  imageUrl?: string;
  /** Message the media was shared in; passed to a `ComponentContext.MessageTimestamp` override. */
  message?: LocalMessage;
  /** User who shared the media; drives the gallery header title. */
  user?: UserResponse;
  videoThumbnailUrl?: string;
  videoUrl?: string;
};

/**
 * Maps an attachment or link preview to gallery item fields. Takes the same arguments as
 * {@link toBaseImageDescriptors}.
 */
export const toGalleryItemDescriptors = (
  ...args: Parameters<typeof toBaseImageDescriptors>
):
  | Pick<
      GalleryItem,
      'alt' | 'dimensions' | 'imageUrl' | 'title' | 'videoThumbnailUrl' | 'videoUrl'
    >
  | undefined => toBaseImageDescriptors(...args);

export type GalleryContextValue = {
  /** Whether clicking the empty gallery background requests close. */
  closeOnBackgroundClick: boolean;
  currentIndex: number;
  currentItem: GalleryItem;
  /** Ignores indexes outside the item range. */
  goToIndex: (index: number) => void;
  /** Does nothing at the last item. */
  goToNext: () => void;
  /** Does nothing at the first item. */
  goToPrevious: () => void;
  hasNext: boolean;
  hasPrevious: boolean;
  itemCount: number;
  items: GalleryItem[];
  /** The default `GalleryUI` prefers the enclosing modal's `close` over this handler. */
  onRequestClose?: () => void;
};

export const GalleryContext = createContext<GalleryContextValue | undefined>(undefined);

export const useGalleryContext = () =>
  requireContext(useContext(GalleryContext), 'useGalleryContext', 'Gallery');
