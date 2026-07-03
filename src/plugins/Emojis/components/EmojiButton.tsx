import { memo } from 'react';
import { useEmojiPickerContext } from '../context/EmojiPickerContext';
import type { EmojiDataEmoji } from '../data';

export type EmojiButtonProps = {
  emoji: EmojiDataEmoji;
};

/**
 * A single selectable emoji cell rendering the native unicode glyph for the active
 * skin tone. Memoized because the grid can render ~1800 of these.
 */
export const EmojiButton = memo(function EmojiButton({ emoji }: EmojiButtonProps) {
  const { onSelectEmoji, setPreviewedEmoji, skinToneIndex } =
    useEmojiPickerContext('EmojiButton');
  const native = emoji.skins[skinToneIndex]?.native ?? emoji.skins[0]?.native ?? '';

  return (
    <button
      aria-label={emoji.name}
      className='str-chat__emoji-picker__emoji'
      data-emoji-id={emoji.id}
      onClick={() => onSelectEmoji(emoji)}
      onFocus={() => setPreviewedEmoji(emoji)}
      onMouseEnter={() => setPreviewedEmoji(emoji)}
      // Native <button> semantics (not role='gridcell'): the category view is
      // virtualized, so a valid grid/row/gridcell tree can't be guaranteed. Roving
      // tabIndex still drives 2D arrow-key navigation (see useGridKeyboardNav).
      tabIndex={-1}
      type='button'
    >
      {native}
    </button>
  );
});
