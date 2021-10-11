import React, { useEffect } from 'react';
import { FileUploadButton, ImageDropzone } from 'react-file-utils';

import { EmojiPicker } from './EmojiPicker';
import {
  EmojiIconSmall as DefaultEmojiIcon,
  FileUploadIcon as DefaultFileUploadIcon,
} from './icons';
import { UploadsPreview } from './UploadsPreview';

import { KEY_CODES } from '../AutoCompleteTextarea/listener';
import { ChatAutoComplete } from '../ChatAutoComplete/ChatAutoComplete';
import { Tooltip } from '../Tooltip/Tooltip';

import { useChannelStateContext } from '../../context/ChannelStateContext';
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
} from '../../types/types';

export const EditMessageForm = <
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends DefaultChannelType = DefaultChannelType,
  Co extends DefaultCommandType = DefaultCommandType,
  Ev extends DefaultEventType = DefaultEventType,
  Me extends DefaultMessageType = DefaultMessageType,
  Re extends DefaultReactionType = DefaultReactionType,
  Us extends DefaultUserType<Us> = DefaultUserType,
  V extends CustomTrigger = CustomTrigger
>() => {
  const { acceptedFiles, multipleUploads } = useChannelStateContext<At, Ch, Co, Ev, Me, Re, Us>(
    'EditMessageForm',
  );
  const { t } = useTranslationContext('EditMessageForm');

  const {
    clearEditingState,
    handleSubmit,
    isUploadEnabled,
    maxFilesLeft,
    openEmojiPicker,
    uploadNewFiles,
  } = useMessageInputContext<At, Ch, Co, Ev, Me, Re, Us, V>('EditMessageForm');

  const {
    EmojiIcon = DefaultEmojiIcon,
    FileUploadIcon = DefaultFileUploadIcon,
  } = useComponentContext<At, Ch, Co, Ev, Me, Re, Us>('EditMessageForm');

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.keyCode === KEY_CODES.ESC && clearEditingState) clearEditingState();
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [clearEditingState]);

  return (
    <div className='str-chat__edit-message-form'>
      <ImageDropzone
        accept={acceptedFiles}
        disabled={!isUploadEnabled || maxFilesLeft === 0}
        handleFiles={uploadNewFiles}
        maxNumberOfFiles={maxFilesLeft}
        multiple={multipleUploads}
      >
        <form onSubmit={handleSubmit}>
          {isUploadEnabled && <UploadsPreview />}
          <EmojiPicker small />
          <ChatAutoComplete />
          <div className='str-chat__message-team-form-footer'>
            <div className='str-chat__edit-message-form-options'>
              <span className='str-chat__input-emojiselect' onClick={openEmojiPicker}>
                <EmojiIcon />
              </span>
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
