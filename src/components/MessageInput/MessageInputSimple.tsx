import React from 'react';

import { EmojiPicker } from './EmojiPicker';
import { useMessageInput } from './hooks/messageInput';
import {
  EmojiIconLarge as DefaultEmojiIcon,
  SendButton as DefaultSendButton,
} from './icons';

import { ChatAutoComplete } from '../ChatAutoComplete/ChatAutoComplete';
import { Tooltip } from '../Tooltip/Tooltip';

import { useTranslationContext } from '../../context/TranslationContext';

import type { MessageInputProps } from './MessageInput';

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
>(
  props: MessageInputProps<At, Ch, Co, Ev, Me, Re, Us, V>,
) => {
  const {
    additionalTextareaProps = {},
    autocompleteTriggers,
    disabled = false,
    disableMentions,
    EmojiIcon = DefaultEmojiIcon,
    focus = false,
    grow = true,
    maxRows = 10,
    mentionAllAppUsers,
    mentionQueryParams,
    publishTypingEvent = true,
    SendButton = DefaultSendButton,
    SuggestionItem,
    SuggestionList,
  } = props;

  const { t } = useTranslationContext();

  const messageInput = useMessageInput({
    ...props,
    additionalTextareaProps,
    disabled,
    focus,
    grow,
    maxRows,
    publishTypingEvent,
  });

  return (
    <div
      className={`str-chat__input-flat ${
        SendButton ? 'str-chat__input-flat--send-button-active' : null
      }`}
    >
      <div className='str-chat__input-flat-wrapper'>
        <div className='str-chat__input-flat--textarea-wrapper'>
          <ChatAutoComplete
            additionalTextareaProps={additionalTextareaProps}
            commands={messageInput.getCommands()}
            disabled={disabled}
            disableMentions={disableMentions}
            grow={grow}
            handleSubmit={messageInput.handleSubmit}
            innerRef={messageInput.textareaRef}
            maxRows={maxRows}
            mentionAllAppUsers={mentionAllAppUsers}
            mentionQueryParams={mentionQueryParams}
            onChange={messageInput.handleChange}
            onPaste={messageInput.onPaste}
            onSelectItem={messageInput.onSelectItem}
            placeholder={t('Type your message')}
            rows={1}
            SuggestionItem={SuggestionItem}
            SuggestionList={SuggestionList}
            triggers={autocompleteTriggers}
            value={messageInput.text}
          />
          <div className='str-chat__emojiselect-wrapper'>
            <Tooltip>
              {messageInput.emojiPickerIsOpen
                ? t('Close emoji picker')
                : t('Open emoji picker')}
            </Tooltip>
            <span
              className='str-chat__input-flat-emojiselect'
              onClick={
                messageInput.emojiPickerIsOpen
                  ? messageInput.closeEmojiPicker
                  : messageInput.openEmojiPicker
              }
              onKeyDown={messageInput.handleEmojiKeyDown}
              role='button'
              tabIndex={0}
            >
              <EmojiIcon />
            </span>
          </div>
          <EmojiPicker {...messageInput} />
        </div>
        {SendButton && <SendButton sendMessage={messageInput.handleSubmit} />}
      </div>
    </div>
  );
};
