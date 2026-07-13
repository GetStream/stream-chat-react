import { createContext, useContext } from 'react';
import type { EmojiDataEmoji } from '../data';
import type { EmojiPickerCategory } from '../components/EmojiGrid';
import type { SkinTone } from '../components/skinTones';

export type EmojiPickerContextValue = {
  /** Currently-focused category id (browse mode). Always a valid id; never empty once loaded. */
  activeCategoryId: string;
  /** The browse model — filtered dataset, `frequent` prepended. */
  categories: EmojiPickerCategory[];
  /** `true` while a search query is active (=== `searchResults !== null`). */
  isSearching: boolean;
  /** The live search query. */
  query: string;
  /** Focus + scroll a category into view (sets active, bumps `scrollTarget`, clears search). */
  requestScrollToCategory: (categoryId: string) => void;
  /** Resolves an emoji's native glyph for the active skin tone. */
  resolveNative: (emoji: EmojiDataEmoji) => string;
  /** Retry loading the dataset after an error. */
  retry: () => void;
  /** Advanced: a "scroll here" signal for a scrolling grid (nonce re-fires repeats). May evolve. */
  scrollTarget: { categoryId: string; nonce: number } | null;
  /** Search matches, or `null` when not searching (`[]` = no matches). */
  searchResults: EmojiDataEmoji[] | null;
  /** Report the user's emoji choice back to the SDK (inserts it). */
  selectEmoji: (emoji: EmojiDataEmoji) => void;
  /** Set the active (highlighted) category without scrolling — used by scroll-spy. */
  setActiveCategory: (categoryId: string) => void;
  /** Feed the search query. */
  setQuery: (query: string) => void;
  /** Feed the active skin tone index. */
  setSkinTone: (skinToneIndex: number) => void;
  /** Active skin tone index (0 = default, 1–5 = light → dark). */
  skinToneIndex: number;
  /** The available skin tones (glyph + i18n key) for a skin-tone selector. */
  skinTones: SkinTone[];
  /** Dataset load status. */
  status: 'error' | 'loading' | 'ready';
};

const EmojiPickerContext = createContext<EmojiPickerContextValue | undefined>(undefined);

export const EmojiPickerProvider = EmojiPickerContext.Provider;

/**
 * The public emoji-picker contract shared with every slot (`useEmojiPickerContext()`).
 * Exposes the data the SDK owns + the report-back setters a slot feeds; deliberately
 * carries no behavioral coordination (scroll mechanics, keyboard, hover) — those stay
 * private to each slot. Hover-preview state lives in a separate internal context so
 * consuming this one does not re-render the emoji grid.
 */
export const useEmojiPickerContext = () => {
  const context = useContext(EmojiPickerContext);
  if (!context) {
    throw new Error(
      'Emoji picker slots must be rendered within a StreamEmojiPicker.Root.',
    );
  }
  return context;
};
