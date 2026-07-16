import { useEmojiPickerContext } from '../context/EmojiPickerContext';
import { useEmojiPickerPreviewContext } from '../context/EmojiPickerPreviewContext';
import { useTranslationContext } from '../../../context';

/**
 * Footer preview of the hovered/focused emoji: a large glyph, its name, and its
 * `:shortcode:` (so users learn the token that drives `:` autocomplete). Falls back to
 * a "Pick an emoji…" placeholder (like emoji-mart) so the footer is never empty. Reads
 * the previewed emoji from the internal preview context (kept out of the public context
 * so hovering does not re-render the emoji grid).
 */
export const PreviewPane = () => {
  const { t } = useTranslationContext();
  const { resolveNative } = useEmojiPickerContext();
  const { previewedEmoji } = useEmojiPickerPreviewContext();

  return (
    <div aria-live='polite' className='str-chat__emoji-picker__preview'>
      <span aria-hidden='true' className='str-chat__emoji-picker__preview-emoji'>
        {previewedEmoji ? resolveNative(previewedEmoji) : '☝️'}
      </span>
      <span className='str-chat__emoji-picker__preview-text'>
        <span className='str-chat__emoji-picker__preview-name'>
          {previewedEmoji ? previewedEmoji.name : t('Pick an emoji…')}
        </span>
        {previewedEmoji ? (
          <span className='str-chat__emoji-picker__preview-shortcode'>{`:${previewedEmoji.id}:`}</span>
        ) : null}
      </span>
    </div>
  );
};
