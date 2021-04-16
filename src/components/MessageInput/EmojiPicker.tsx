import React from 'react';

import { useChannelStateContext } from '../../context/ChannelStateContext';
import { useComponentContext } from '../../context/ComponentContext';
import { useTranslationContext } from '../../context/TranslationContext';

import type { EmojiData } from 'emoji-mart';

import { useMessageInputContext } from '../../context/MessageInputContext';

import type {
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
} from '../../../types/types';

const filterEmoji = (emoji: EmojiData) => {
  if (emoji.name === 'White Smiling Face' || emoji.name === 'White Frowning Face') {
    return false;
  }
  return true;
};

export type MessageInputEmojiPickerProps = {
  small?: boolean;
};

export const EmojiPicker = <
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends DefaultChannelType = DefaultChannelType,
  Co extends DefaultCommandType = DefaultCommandType,
  Ev extends DefaultEventType = DefaultEventType,
  Me extends DefaultMessageType = DefaultMessageType,
  Re extends DefaultReactionType = DefaultReactionType,
  Us extends DefaultUserType<Us> = DefaultUserType
>(
  props: MessageInputEmojiPickerProps,
) => {
  const { small } = props;

  const { emojiConfig } = useChannelStateContext<At, Ch, Co, Ev, Me, Re, Us>();
  const { EmojiPicker } = useComponentContext<At, Ch, Co, Ev, Me, Re, Us>();
  const { t } = useTranslationContext();

  const messageInput = useMessageInputContext<At, Ch, Co, Ev, Me, Re, Us>();

  const { emojiData } = emojiConfig || {};

  if (messageInput.emojiPickerIsOpen && emojiData) {
    const className = small
      ? 'str-chat__small-message-input-emojipicker'
      : 'str-chat__input--emojipicker';

    return (
      <div className={className} ref={messageInput.emojiPickerRef}>
        {EmojiPicker && (
          <EmojiPicker
            color='#006CFF'
            data={emojiData}
            emoji='point_up'
            emojisToShowFilter={filterEmoji}
            native
            onSelect={messageInput.onSelectEmoji}
            set='facebook'
            showPreview={false}
            showSkinTones={false}
            title={t('Pick your emoji')}
            useButton
          />
        )}
      </div>
    );
  }
  return null;
};
