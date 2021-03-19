import React, { useEffect } from 'react';
import { FileUploadButton, ImageDropzone } from 'react-file-utils';

import { EmojiPicker } from './EmojiPicker';
import { useMessageInput } from './hooks/messageInput';
import {
  EmojiIconSmall as DefaultEmojiIcon,
  FileUploadIcon as DefaultFileUploadIcon,
} from './icons';
import { UploadsPreview } from './UploadsPreview';

import { KEY_CODES } from '../AutoCompleteTextarea/listener';
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

export const EditMessageForm = <
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
    clearEditingState,
    disabled = false,
    EmojiIcon = DefaultEmojiIcon,
    FileUploadIcon = DefaultFileUploadIcon,
    focus = false,
    grow = true,
    maxRows = 10,
    mentionAllAppUsers,
    mentionQueryParams,
    publishTypingEvent = true,
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

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.keyCode === KEY_CODES.ESC && clearEditingState)
        clearEditingState();
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [clearEditingState]);

  return (
    <div className='str-chat__edit-message-form'>
      <ImageDropzone
        accept={channelContext.acceptedFiles}
        disabled={
          !messageInput.isUploadEnabled || messageInput.maxFilesLeft === 0
        }
        handleFiles={messageInput.uploadNewFiles}
        maxNumberOfFiles={messageInput.maxFilesLeft}
        multiple={channelContext.multipleUploads}
      >
        <form onSubmit={messageInput.handleSubmit}>
          {messageInput.isUploadEnabled && <UploadsPreview {...messageInput} />}
          <EmojiPicker {...messageInput} small />
          <ChatAutoComplete
            additionalTextareaProps={additionalTextareaProps}
            commands={messageInput.getCommands()}
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
            value={messageInput.text}
          />
          <div className='str-chat__message-team-form-footer'>
            <div className='str-chat__edit-message-form-options'>
              <span
                className='str-chat__input-emojiselect'
                onClick={messageInput.openEmojiPicker}
              >
                <EmojiIcon />
              </span>
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
                    <span className='str-chat__input-fileupload'>
                      <FileUploadIcon />
                    </span>
                  </FileUploadButton>
                </div>
              )}
            </div>
            <div>
              <button
                onClick={() => {
                  if (clearEditingState) {
                    clearEditingState();
                  }
                }}
              >
                {t('Cancel')}
              </button>
              <button type='submit'>{t('Send')}</button>
            </div>
          </div>
        </form>
      </ImageDropzone>
    </div>
  );
};
