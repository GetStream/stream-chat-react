import React from 'react';
import { FileUploadButton, ImageDropzone } from 'react-file-utils';

import { EmojiPicker } from './EmojiPicker';
import {
  EmojiIconSmall as DefaultEmojiIcon,
  FileUploadIconFlat as DefaultFileUploadIcon,
  SendButton as DefaultSendButton,
} from './icons';
import { UploadsPreview } from './UploadsPreview';

import { ChatAutoComplete } from '../ChatAutoComplete/ChatAutoComplete';
import { Tooltip } from '../Tooltip/Tooltip';

import { useChannelStateContext } from '../../context/ChannelStateContext';
import { useTranslationContext } from '../../context/TranslationContext';
import { useMessageInput } from '../../context/MessageInputContext';

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

export const MessageInputSmall = <
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
    grow = true,
    maxRows = 10,
    mentionAllAppUsers,
    mentionQueryParams,
    SendButton = DefaultSendButton,
    SuggestionItem,
    SuggestionList,
  } = props;

  const { acceptedFiles, multipleUploads } = useChannelStateContext<At, Ch, Co, Ev, Me, Re, Us>();
  const { t } = useTranslationContext();

  const messageInput = useMessageInput<At, Co, Us>();

  return (
    <div className='str-chat__small-message-input__wrapper'>
      <ImageDropzone
        accept={acceptedFiles}
        disabled={!messageInput.isUploadEnabled || messageInput.maxFilesLeft === 0}
        handleFiles={messageInput.uploadNewFiles}
        maxNumberOfFiles={messageInput.maxFilesLeft}
        multiple={multipleUploads}
      >
        <div
          className={`str-chat__small-message-input ${
            SendButton ? 'str-chat__small-message-input--send-button-active' : null
          }`}
        >
          <div className='str-chat__small-message-input--textarea-wrapper'>
            {messageInput.isUploadEnabled && <UploadsPreview />}
            <ChatAutoComplete
              additionalTextareaProps={additionalTextareaProps}
              disabled={disabled}
              disableMentions={disableMentions}
              grow={grow}
              maxRows={maxRows}
              mentionAllAppUsers={mentionAllAppUsers}
              mentionQueryParams={mentionQueryParams}
              placeholder={t('Type your message')}
              rows={1}
              SuggestionItem={SuggestionItem}
              SuggestionList={SuggestionList}
              triggers={autocompleteTriggers}
            />
            {messageInput.isUploadEnabled && (
              <div className='str-chat__fileupload-wrapper' data-testid='fileinput'>
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
                  <span className='str-chat__small-message-input-fileupload'>
                    <FileUploadIcon />
                  </span>
                </FileUploadButton>
              </div>
            )}
            <div className='str-chat__emojiselect-wrapper'>
              <Tooltip>
                {messageInput.emojiPickerIsOpen ? t('Close emoji picker') : t('Open emoji picker')}
              </Tooltip>
              <span
                className='str-chat__small-message-input-emojiselect'
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
            <EmojiPicker {...messageInput} small />
          </div>
          {SendButton && <SendButton sendMessage={messageInput.handleSubmit} />}
        </div>
      </ImageDropzone>
    </div>
  );
};
