import { memo } from 'react';
import { useEmojiPickerCellContext } from '../context/EmojiPickerCellContext';
import { useEmojiPickerPreviewContext } from '../context/EmojiPickerPreviewContext';
import type { EmojiDataEmoji } from '../data';

export type EmojiButtonProps = {
  emoji: EmojiDataEmoji;
};

/**
 * A single selectable emoji cell rendering the native unicode glyph for the active
 * skin tone. Memoized because the grid can render ~1800 of these — and it subscribes to
 * the cold cell context (not the public picker context) so scroll-spy/search updates,
 * which a cell reads none of, never re-render the grid.
 */
export const EmojiButton = memo(function EmojiButton({ emoji }: EmojiButtonProps) {
  const { resolveNative, selectEmoji } = useEmojiPickerCellContext();
  const { setPreviewedEmoji } = useEmojiPickerPreviewContext();

  return (
    <button
      aria-label={emoji.name}
      className='str-chat__emoji-picker__emoji'
      data-emoji-id={emoji.id}
      onClick={() => selectEmoji(emoji)}
      onFocus={() => setPreviewedEmoji(emoji)}
      onMouseEnter={() => setPreviewedEmoji(emoji)}
      // Native <button> semantics (not role='gridcell'): the category view is
      // virtualized, so a valid grid/row/gridcell tree can't be guaranteed. Roving
      // tabIndex still drives 2D arrow-key navigation (see useGridKeyboardNav).
      tabIndex={-1}
      type='button'
    >
      {resolveNative(emoji)}
    </button>
  );
});
