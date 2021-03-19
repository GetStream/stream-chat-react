import React from 'react';
import { FileUploadButton, ImageDropzone } from 'react-file-utils';

import { EmojiPicker } from './EmojiPicker';
import { useMessageInput } from './hooks/messageInput';
import {
  EmojiIconSmall as DefaultEmojiIcon,
  FileUploadIcon as DefaultFileUploadIcon,
  SendButton as DefaultSendButton,
} from './icons';
import { UploadsPreview } from './UploadsPreview';

import { ChatAutoComplete } from '../ChatAutoComplete/ChatAutoComplete';
import { Tooltip } from '../Tooltip/Tooltip';

import { useChannelContext } from '../../context/ChannelContext';
import { useTranslationContext } from '../../context/TranslationContext';

import type { Event } from 'stream-chat';

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

export const MessageInputLarge = <
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
    FileUploadIcon = DefaultFileUploadIcon,
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

  const {
    acceptedFiles,
    client,
    multipleUploads,
    typing,
    watcher_count,
  } = useChannelContext<At, Ch, Co, Ev, Me, Re, Us>();
  const { t } = useTranslationContext();

  const messageInput = useMessageInput<At, Ch, Co, Ev, Me, Re, Us, V>({
    ...props,
    additionalTextareaProps,
    focus,
    publishTypingEvent,
  });

  const constructTypingString = (
    typingUsers: Record<string, Event<At, Ch, Co, Ev, Me, Re, Us>>,
  ) => {
    const otherTypingUsers = Object.values(typingUsers)
      .filter(({ user }) => client.user?.id !== user?.id)
      .map(({ user }) => user?.name || user?.id);
    if (otherTypingUsers.length === 0) return '';
    if (otherTypingUsers.length === 1) {
      return t('{{ user }} is typing...', { user: otherTypingUsers[0] });
    }
    if (otherTypingUsers.length === 2) {
      // joins all with "and" but =no commas
      // example: "bob and sam"
      return t('{{ firstUser }} and {{ secondUser }} are typing...', {
        firstUser: otherTypingUsers[0],
        secondUser: otherTypingUsers[1],
      });
    }
    // joins all with commas, but last one gets ", and" (oxford comma!)
    // example: "bob, joe, and sam"
    return t('{{ commaSeparatedUsers }} and {{ lastUser }} are typing...', {
      commaSeparatedUsers: otherTypingUsers.slice(0, -1).join(', '),
      lastUser: otherTypingUsers[otherTypingUsers.length - 1],
    });
  };

  return (
    <div className='str-chat__input-large'>
      <ImageDropzone
        accept={acceptedFiles}
        disabled={
          !messageInput.isUploadEnabled || messageInput.maxFilesLeft === 0
        }
        handleFiles={messageInput.uploadNewFiles}
        maxNumberOfFiles={messageInput.maxFilesLeft}
        multiple={multipleUploads}
      >
        <div className='str-chat__input'>
          <div className='str-chat__input--textarea-wrapper'>
            {messageInput.isUploadEnabled && (
              <UploadsPreview {...messageInput} />
            )}
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
            {messageInput.isUploadEnabled && (
              <div
                className='str-chat__fileupload-wrapper'
                data-testid='fileinput'
              >
                <Tooltip>
                  {messageInput.maxFilesLeft
                    ? t('Attach files')
                    : t("You've reached the maximum number of files")}
                </Tooltip>
                <FileUploadButton
                  accepts={acceptedFiles}
                  disabled={messageInput.maxFilesLeft === 0}
                  handleFiles={messageInput.uploadNewFiles}
                  multiple={multipleUploads}
                >
                  <span className='str-chat__input-fileupload'>
                    <FileUploadIcon />
                  </span>
                </FileUploadButton>
              </div>
            )}
            <div className='str-chat__emojiselect-wrapper'>
              <Tooltip>
                {messageInput.emojiPickerIsOpen
                  ? t('Close emoji picker')
                  : t('Open emoji picker')}
              </Tooltip>
              <span
                className='str-chat__input-emojiselect'
                onClick={
                  messageInput.emojiPickerIsOpen
                    ? messageInput.closeEmojiPicker
                    : messageInput.openEmojiPicker
                }
                onKeyDown={messageInput.handleEmojiKeyDown}
                ref={messageInput.emojiPickerRef}
                role='button'
                tabIndex={0}
              >
                <EmojiIcon />
              </span>
            </div>
            <EmojiPicker {...messageInput} />
          </div>
          <SendButton sendMessage={messageInput.handleSubmit} />
        </div>
        <div>
          <div className='str-chat__input-footer'>
            <span
              className={`str-chat__input-footer--count ${
                !watcher_count ? 'str-chat__input-footer--count--hidden' : ''
              }`}
            >
              {t('{{ watcherCount }} online', {
                watcherCount: watcher_count,
              })}
            </span>
            <span className='str-chat__input-footer--typing'>
              {constructTypingString(typing || {})}
            </span>
          </div>
        </div>
      </ImageDropzone>
    </div>
  );
};
