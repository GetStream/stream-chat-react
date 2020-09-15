// @ts-check
import React, { useContext } from 'react';
// @ts-ignore
import { Picker } from 'emoji-mart';
import { TranslationContext } from '../../context';

/** @type { (emoji: import('emoji-mart').EmojiData) => boolean } */
const filterEmoji = (emoji) => {
  if (
    emoji.name === 'White Smiling Face' ||
    emoji.name === 'White Frowning Face'
  ) {
    return false;
  }
  return true;
};

/** @type {React.FC<import("types").MessageInputEmojiPickerProps>} */
const EmojiPicker = ({
  emojiPickerIsOpen,
  emojiPickerRef,
  onSelectEmoji,
  small,
}) => {
  const { t } = useContext(TranslationContext);
  if (emojiPickerIsOpen) {
    const className = small
      ? 'str-chat__small-message-input-emojipicker'
      : 'str-chat__input--emojipicker';

    return (
      <div className={className} ref={emojiPickerRef}>
        <Picker
          native
          emoji="point_up"
          title={t('Pick your emoji')}
          onSelect={onSelectEmoji}
          color="#006CFF"
          showPreview={false}
          useButton={true}
          emojisToShowFilter={filterEmoji}
        />
      </div>
    );
  }
  return null;
};

export default EmojiPicker;
