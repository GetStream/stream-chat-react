import React from 'react';
import { FileUploadButton, ImageDropzone } from 'react-file-utils';

import { EmojiPicker } from './EmojiPicker';
import {
  EmojiIconLarge as DefaultEmojiIcon,
  FileUploadIconFlat as DefaultFileUploadIcon,
  SendButton as DefaultSendButton,
} from './icons';
import { UploadsPreview } from './UploadsPreview';

import { ChatAutoComplete } from '../ChatAutoComplete/ChatAutoComplete';
import { Tooltip } from '../Tooltip/Tooltip';

import { useChannelStateContext } from '../../context/ChannelStateContext';
import { useTranslationContext } from '../../context/TranslationContext';
import { useMessageInputContext } from '../../context/MessageInputContext';
import { useComponentContext } from '../../context/ComponentContext';

import type {
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
  Us extends DefaultUserType<Us> = DefaultUserType
>() => {
  const { acceptedFiles, multipleUploads } = useChannelStateContext<At, Ch, Co, Ev, Me, Re, Us>();
  const { t } = useTranslationContext();

  const {
    closeEmojiPicker,
    emojiPickerIsOpen,
    handleEmojiKeyDown,
    handleSubmit,
    isUploadEnabled,
    maxFilesLeft,
    openEmojiPicker,
    uploadNewFiles,
  } = useMessageInputContext<At, Ch, Co, Ev, Me, Re, Us>();

  const {
    EmojiIcon = DefaultEmojiIcon,
    FileUploadIcon = DefaultFileUploadIcon,
    SendButton = DefaultSendButton,
  } = useComponentContext<At, Ch, Co, Ev, Me, Re, Us>();

  return (
    <div
      className={`str-chat__input-flat ${
        SendButton ? 'str-chat__input-flat--send-button-active' : null
      }`}
    >
      <ImageDropzone
        accept={acceptedFiles}
        disabled={!isUploadEnabled || maxFilesLeft === 0}
        handleFiles={uploadNewFiles}
        maxNumberOfFiles={maxFilesLeft}
        multiple={multipleUploads}
      >
        <div className='str-chat__input-flat-wrapper'>
          <div className='str-chat__input-flat--textarea-wrapper'>
            {isUploadEnabled && <UploadsPreview />}
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
            <ChatAutoComplete />
            {isUploadEnabled && (
              <div className='str-chat__fileupload-wrapper' data-testid='fileinput'>
                <Tooltip>
                  {maxFilesLeft
                    ? t('Attach files')
                    : t("You've reached the maximum number of files")}
                </Tooltip>
                <FileUploadButton
                  accepts={acceptedFiles}
                  disabled={maxFilesLeft === 0}
                  handleFiles={uploadNewFiles}
                  multiple={multipleUploads}
                >
                  <span className='str-chat__input-flat-fileupload'>
                    <FileUploadIcon />
                  </span>
                </FileUploadButton>
              </div>
            )}
          </div>
          {SendButton && <SendButton sendMessage={handleSubmit} />}
        </div>
      </ImageDropzone>
    </div>
  );
};
