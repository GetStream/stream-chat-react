import { useEmojiPickerContext } from '../context/EmojiPickerContext';
import type { EmojiDataEmoji } from '../data';

export type PreviewPaneProps = {
  emoji: EmojiDataEmoji | null;
};

/**
 * Footer preview of the hovered/focused emoji: a large glyph plus its name.
 * Receives the previewed emoji as a prop (kept out of context) so hovering does
 * not re-render the emoji grid.
 */
export const PreviewPane = ({ emoji }: PreviewPaneProps) => {
  const { skinToneIndex } = useEmojiPickerContext('PreviewPane');

  return (
    <div aria-live='polite' className='str-chat__emoji-picker__preview'>
      {emoji ? (
        <>
          <span aria-hidden='true' className='str-chat__emoji-picker__preview-emoji'>
            {emoji.skins[skinToneIndex]?.native ?? emoji.skins[0]?.native ?? ''}
          </span>
          <span className='str-chat__emoji-picker__preview-name'>{emoji.name}</span>
        </>
      ) : null}
    </div>
  );
};
