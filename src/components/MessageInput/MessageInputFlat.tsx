import React from 'react';
import { FileUploadButton, ImageDropzone } from 'react-file-utils';

import { EmojiPicker } from './EmojiPicker';
import { useMessageInput } from './hooks/messageInput';
import {
  EmojiIconLarge as DefaultEmojiIcon,
  FileUploadIconFlat as DefaultFileUploadIcon,
  SendButton as DefaultSendButton,
} from './icons';
import { UploadsPreview } from './UploadsPreview';

import { ChatAutoComplete } from '../ChatAutoComplete/ChatAutoComplete';
import { Tooltip } from '../Tooltip/Tooltip';

import { useChannelContext } from '../../context/ChannelContext';
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

export const MessageInputFlat = <
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
    publishTypingEvent = true,
    SendButton = DefaultSendButton,
    SuggestionList,
  } = props;

  const channelContext = useChannelContext<At, Ch, Co, Ev, Me, Re, Us>();
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
      <ImageDropzone
        accept={channelContext.acceptedFiles}
        disabled={
          !messageInput.isUploadEnabled || messageInput.maxFilesLeft === 0
        }
        handleFiles={messageInput.uploadNewFiles}
        maxNumberOfFiles={messageInput.maxFilesLeft}
        multiple={channelContext.multipleUploads}
      >
        <div className='str-chat__input-flat-wrapper'>
          <div className='str-chat__input-flat--textarea-wrapper'>
            {messageInput.isUploadEnabled && (
              <UploadsPreview {...messageInput} />
            )}

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

            <ChatAutoComplete
              additionalTextareaProps={additionalTextareaProps}
              commands={messageInput.getCommands()}
              disabled={disabled}
              disableMentions={disableMentions}
              grow={grow}
              handleSubmit={messageInput.handleSubmit}
              innerRef={messageInput.textareaRef}
              maxRows={maxRows}
              onChange={messageInput.handleChange}
              onPaste={messageInput.onPaste}
              onSelectItem={messageInput.onSelectItem}
              placeholder={t('Type your message')}
              rows={1}
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
                  accepts={channelContext.acceptedFiles}
                  disabled={messageInput.maxFilesLeft === 0}
                  handleFiles={messageInput.uploadNewFiles}
                  multiple={channelContext.multipleUploads}
                >
                  <span className='str-chat__input-flat-fileupload'>
                    <FileUploadIcon />
                  </span>
                </FileUploadButton>
              </div>
            )}
          </div>
          {SendButton && <SendButton sendMessage={messageInput.handleSubmit} />}
        </div>
      </ImageDropzone>
    </div>
  );
};
