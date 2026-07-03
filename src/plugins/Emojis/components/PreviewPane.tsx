import { useEmojiPickerContext } from '../context/EmojiPickerContext';
import { useTranslationContext } from '../../../context';
import type { EmojiDataEmoji } from '../data';

export type PreviewPaneProps = {
  emoji: EmojiDataEmoji | null;
};

/**
 * Footer preview of the hovered/focused emoji: a large glyph, its name, and its
 * `:shortcode:` (so users learn the token that drives `:` autocomplete). Falls back to
 * a "Pick an emoji…" placeholder (like emoji-mart) so the footer is never empty.
 * Receives the previewed emoji as a prop (kept out of context) so hovering does not
 * re-render the emoji grid.
 */
export const PreviewPane = ({ emoji }: PreviewPaneProps) => {
  const { t } = useTranslationContext('EmojiPickerPreview');
  const { skinToneIndex } = useEmojiPickerContext('PreviewPane');

  return (
    <div aria-live='polite' className='str-chat__emoji-picker__preview'>
      <span aria-hidden='true' className='str-chat__emoji-picker__preview-emoji'>
        {emoji
          ? (emoji.skins[skinToneIndex]?.native ?? emoji.skins[0]?.native ?? '')
          : '☝️'}
      </span>
      <span className='str-chat__emoji-picker__preview-text'>
        <span className='str-chat__emoji-picker__preview-name'>
          {emoji ? emoji.name : t('Pick an emoji…')}
        </span>
        {emoji ? (
          <span className='str-chat__emoji-picker__preview-shortcode'>{`:${emoji.id}:`}</span>
        ) : null}
      </span>
    </div>
  );
};
