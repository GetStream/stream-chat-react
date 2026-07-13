import { createContext, useContext } from 'react';
import type { EmojiDataEmoji } from '../data';

export type EmojiPickerPreviewContextValue = {
  previewedEmoji: EmojiDataEmoji | null;
  setPreviewedEmoji: (emoji: EmojiDataEmoji | null) => void;
};

const EmojiPickerPreviewContext = createContext<
  EmojiPickerPreviewContextValue | undefined
>(undefined);

export const EmojiPickerPreviewProvider = EmojiPickerPreviewContext.Provider;

/**
 * Internal (NOT exported from the `emojis` entry): the hovered/focused emoji shared
 * between the default grid (writes) and the default preview (reads). Kept out of the
 * public `EmojiPickerContext` so hover changes don't re-render the grid, and so a custom
 * grid does not implicitly drive the default preview — hover-preview is a private
 * mechanic of the default components.
 */
export const useEmojiPickerPreviewContext = () => {
  const context = useContext(EmojiPickerPreviewContext);
  if (!context) {
    throw new Error(
      'Emoji preview components must be rendered within a StreamEmojiPicker.Root.',
    );
  }
  return context;
};
