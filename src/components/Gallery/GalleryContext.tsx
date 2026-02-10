import { createContext, useContext } from 'react';

import type {
  ImageAttachment,
  LocalImageAttachment,
  LocalVideoAttachment,
  VideoAttachment,
} from 'stream-chat';

export type GalleryItem =
  | LocalImageAttachment
  | ImageAttachment
  | LocalVideoAttachment
  | VideoAttachment;

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
