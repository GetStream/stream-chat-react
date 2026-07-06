import { useEmojiPickerContext } from '../context/EmojiPickerContext';
import { useTranslationContext } from '../../../context';
import type { EmojiDataEmoji } from '../data';

export type PreviewPaneProps = {
  emoji: EmojiDataEmoji | null;
  /** Emoji shown at rest (nothing hovered/focused) instead of the text placeholder. */
  placeholderEmoji?: EmojiDataEmoji | null;
};

/**
 * Footer preview of the hovered/focused emoji: a large glyph, its name, and its
 * `:shortcode:` (so users learn the token that drives `:` autocomplete). Falls back to
 * a "Pick an emoji…" placeholder (like emoji-mart) so the footer is never empty.
 * Receives the previewed emoji as a prop (kept out of context) so hovering does not
 * re-render the emoji grid.
 */
export const PreviewPane = ({ emoji, placeholderEmoji }: PreviewPaneProps) => {
  const { t } = useTranslationContext('EmojiPickerPreview');
  const { skinToneIndex } = useEmojiPickerContext('PreviewPane');
  // Prefer the hovered/focused emoji, then a configured resting emoji, then the text
  // placeholder.
  const shown = emoji ?? placeholderEmoji ?? null;

  return (
    <div aria-live='polite' className='str-chat__emoji-picker__preview'>
      <span aria-hidden='true' className='str-chat__emoji-picker__preview-emoji'>
        {shown
          ? (shown.skins[skinToneIndex]?.native ?? shown.skins[0]?.native ?? '')
          : '☝️'}
      </span>
      <span className='str-chat__emoji-picker__preview-text'>
        <span className='str-chat__emoji-picker__preview-name'>
          {shown ? shown.name : t('Pick an emoji…')}
        </span>
        {shown ? (
          <span className='str-chat__emoji-picker__preview-shortcode'>{`:${shown.id}:`}</span>
        ) : null}
      </span>
    </div>
  );
};
