import React from 'react';

import { EmojiPicker } from './EmojiPicker';
import { EmojiIconLarge as DefaultEmojiIcon, SendButton as DefaultSendButton } from './icons';

import { ChatAutoComplete } from '../ChatAutoComplete/ChatAutoComplete';
import { Tooltip } from '../Tooltip/Tooltip';

import { useTranslationContext } from '../../context/TranslationContext';
import { useMessageInputContext } from '../../context/MessageInputContext';
import { useComponentContext } from '../../context/ComponentContext';

import type {
  CustomTrigger,
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
} from '../../../types/types';

export const MessageInputSimple = <
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends DefaultChannelType = DefaultChannelType,
  Co extends DefaultCommandType = DefaultCommandType,
  Ev extends DefaultEventType = DefaultEventType,
  Me extends DefaultMessageType = DefaultMessageType,
  Re extends DefaultReactionType = DefaultReactionType,
  Us extends DefaultUserType<Us> = DefaultUserType,
  V extends CustomTrigger = CustomTrigger
>() => {
  const { t } = useTranslationContext();

  const {
    closeEmojiPicker,
    emojiPickerIsOpen,
    handleEmojiKeyDown,
    handleSubmit,
    openEmojiPicker,
  } = useMessageInputContext<At, Ch, Co, Ev, Me, Re, Us, V>();

  const { EmojiIcon = DefaultEmojiIcon, SendButton = DefaultSendButton } = useComponentContext<
    At,
    Ch,
    Co,
    Ev,
    Me,
    Re,
    Us
  >();

  return (
    <div
      className={`str-chat__input-flat ${
        SendButton ? 'str-chat__input-flat--send-button-active' : null
      }`}
    >
      <div className='str-chat__input-flat-wrapper'>
        <div className='str-chat__input-flat--textarea-wrapper'>
          <ChatAutoComplete />
          <div className='str-chat__emojiselect-wrapper'>
            <Tooltip>
              {emojiPickerIsOpen ? t('Close emoji picker') : t('Open emoji picker')}
            </Tooltip>
            <span
              className='str-chat__input-flat-emojiselect'
              onClick={emojiPickerIsOpen ? closeEmojiPicker : openEmojiPicker}
              onKeyDown={handleEmojiKeyDown}
              role='button'
              tabIndex={0}
            >
              <EmojiIcon />
            </span>
          </div>
          <EmojiPicker />
        </div>
        {SendButton && <SendButton sendMessage={handleSubmit} />}
      </div>
    </div>
  );
};
