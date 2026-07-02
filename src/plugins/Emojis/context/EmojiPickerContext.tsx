import { createContext, useContext } from 'react';
import type { EmojiDataEmoji } from '../data';

export type EmojiPickerContextValue = {
  onSelectEmoji: (emoji: EmojiDataEmoji) => void;
  setPreviewedEmoji: (emoji: EmojiDataEmoji | null) => void;
  skinToneIndex: number;
};

const EmojiPickerContext = createContext<EmojiPickerContextValue | undefined>(undefined);

export const EmojiPickerProvider = EmojiPickerContext.Provider;

/**
 * Shares the stable picker callbacks and the active skin tone with the picker's
 * child components. Deliberately excludes transient state (like the previewed
 * emoji) so consuming the context does not re-render the whole emoji grid.
 */
export const useEmojiPickerContext = (componentName = 'EmojiPicker') => {
  const context = useContext(EmojiPickerContext);
  if (!context) {
    throw new Error(
      `The ${componentName} component must be rendered within an EmojiPickerPanel.`,
    );
  }
  return context;
};
