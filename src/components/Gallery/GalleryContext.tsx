import { createContext, useContext } from 'react';
import type { UserResponse } from 'stream-chat';

import { requireContext } from '../../context/requireContext';
import { toBaseImageDescriptors } from '../BaseImage';
import type { BaseImageProps } from '../BaseImage';
import type { Dimensions } from '../../types/types';

export type GalleryItem = Omit<BaseImageProps, 'src'> & {
  /** When the media was shared; drives the gallery header timestamp. */
  createdAt?: string | Date;
  dimensions?: Dimensions;
  imageUrl?: string;
  /** User who shared the media; drives the gallery header title. */
  user?: UserResponse;
  videoThumbnailUrl?: string;
  videoUrl?: string;
};

/**
 * Maps an attachment (or link preview) to gallery item fields.
 * Delegates to {@link toBaseImageDescriptors}.
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
  /** Whether clicking the empty gallery background should request close */
  closeOnBackgroundClick: boolean;
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
  /** Request closing the gallery viewer */
  onRequestClose?: () => void;
};

export const GalleryContext = createContext<GalleryContextValue | undefined>(undefined);

export const useGalleryContext = () =>
  requireContext(useContext(GalleryContext), 'useGalleryContext', 'Gallery');
