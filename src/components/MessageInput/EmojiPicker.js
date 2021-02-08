import React, { useContext } from 'react';
import { ChannelContext, TranslationContext } from '../../context';

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
  const { emojiConfig } = useContext(ChannelContext);
  const { t } = useContext(TranslationContext);

  const { emojiData, EmojiPicker: Picker } = emojiConfig;

  if (emojiPickerIsOpen) {
    const className = small
      ? 'str-chat__small-message-input-emojipicker'
      : 'str-chat__input--emojipicker';

    return (
      <div className={className} ref={emojiPickerRef}>
        {Picker && (
          <Picker
            color='#006CFF'
            data={emojiData}
            emoji='point_up'
            emojisToShowFilter={filterEmoji}
            native
            onSelect={onSelectEmoji}
            set={'facebook'}
            showPreview={false}
            showSkinTones={false}
            title={t('Pick your emoji')}
            useButton={true}
          />
        )}
      </div>
    );
  }
  return null;
};

export default EmojiPicker;
