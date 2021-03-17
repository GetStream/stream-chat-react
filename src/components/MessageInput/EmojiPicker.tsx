import React from 'react';

import { useChannelContext } from '../../context/ChannelContext';
import { useTranslationContext } from '../../context/TranslationContext';

import type { EmojiData } from 'emoji-mart';

import type { MessageInputState } from './hooks/messageInput';

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
  if (
    emoji.name === 'White Smiling Face' ||
    emoji.name === 'White Frowning Face'
  ) {
    return false;
  }
  return true;
};

export type MessageInputEmojiPickerProps<
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Us extends DefaultUserType<Us> = DefaultUserType
> = MessageInputState<At, Us> & {
  emojiPickerRef: React.MutableRefObject<HTMLDivElement | null>;
  onSelectEmoji: (emoji: EmojiData) => void;
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
  props: MessageInputEmojiPickerProps<At, Us>,
) => {
  const { emojiPickerIsOpen, emojiPickerRef, onSelectEmoji, small } = props;

  const { emojiConfig } = useChannelContext<At, Ch, Co, Ev, Me, Re, Us>();
  const { t } = useTranslationContext();

  const { emojiData, EmojiPicker: Picker } = emojiConfig || {};

  if (emojiPickerIsOpen && emojiData) {
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
