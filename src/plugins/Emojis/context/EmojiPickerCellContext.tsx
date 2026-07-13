import { createContext, useContext } from 'react';
import type { EmojiDataEmoji } from '../data';

export type EmojiPickerCellContextValue = {
  /** Resolves an emoji's native glyph for the active skin tone. */
  resolveNative: (emoji: EmojiDataEmoji) => string;
  /** Report the user's emoji choice back to the SDK (inserts it). */
  selectEmoji: (emoji: EmojiDataEmoji) => void;
};

const EmojiPickerCellContext = createContext<EmojiPickerCellContextValue | undefined>(
  undefined,
);

export const EmojiPickerCellProvider = EmojiPickerCellContext.Provider;

/**
 * Internal (NOT exported from the `emojis` entry): the cold subset of the picker
 * contract the default emoji cell needs — resolving a glyph and reporting a selection.
 * The grid can mount hundreds of cells, and React context has no partial subscription:
 * a cell reading the public `EmojiPickerContext` would re-render on every change to its
 * hot fields (scroll-spy `activeCategoryId`, the live `query`, `scrollTarget`), even
 * though the cell reads none of them. These two values change only when the skin tone or
 * `onEmojiSelect` changes — the cases where a cell genuinely must re-render — so the
 * default `EmojiButton` subscribes here instead. The same values remain on the public
 * `EmojiPickerContext` for custom grid slots.
 */
export const useEmojiPickerCellContext = () => {
  const context = useContext(EmojiPickerCellContext);
  if (!context) {
    throw new Error(
      'Emoji picker cells must be rendered within a StreamEmojiPicker.Root.',
    );
  }
  return context;
};
