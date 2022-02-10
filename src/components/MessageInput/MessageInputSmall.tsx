import React, { useEffect, useRef } from 'react';
import { FileUploadButton, ImageDropzone } from 'react-file-utils';

import { EmojiPicker } from './EmojiPicker';
import { CooldownTimer as DefaultCooldownTimer } from './hooks/useCooldownTimer';
import {
  EmojiIconSmall as DefaultEmojiIcon,
  FileUploadIconFlat as DefaultFileUploadIcon,
  SendButton as DefaultSendButton,
} from './icons';
import { UploadsPreview } from './UploadsPreview';

import { useBreakpoint } from '../Message/hooks';
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

export const MessageInputSmall = <
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
    'MessageInputSmall',
  );
  const { t } = useTranslationContext('MessageInputSmall');

  const {
    closeEmojiPicker,
    cooldownInterval,
    cooldownRemaining,
    emojiPickerIsOpen,
    handleSubmit,
    isUploadEnabled,
    maxFilesLeft,
    numberOfUploads,
    openEmojiPicker,
    setCooldownRemaining,
    text,
    uploadNewFiles,
  } = useMessageInputContext<At, Ch, Co, Ev, Me, Re, Us, V>('MessageInputSmall');

  const {
    CooldownTimer = DefaultCooldownTimer,
    EmojiIcon = DefaultEmojiIcon,
    FileUploadIcon = DefaultFileUploadIcon,
    SendButton = DefaultSendButton,
  } = useComponentContext<At, Ch, Co, Ev, Me, Re, Us>('MessageInputSmall');

  const { device } = useBreakpoint();

  const sendButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const sendButton = sendButtonRef.current;

    if (sendButton) {
      if ((numberOfUploads && !text) || device !== 'full') {
        sendButton.style.display = 'block';
      } else {
        sendButton.style.display = 'none';
      }
    }
  }, [device, numberOfUploads, text]);

  return (
    <div className='str-chat__small-message-input__wrapper'>
      <ImageDropzone
        accept={acceptedFiles}
        disabled={!isUploadEnabled || maxFilesLeft === 0 || !!cooldownRemaining}
        handleFiles={uploadNewFiles}
        maxNumberOfFiles={maxFilesLeft}
        multiple={multipleUploads}
      >
        <div
          className={`str-chat__small-message-input ${
            SendButton ? 'str-chat__small-message-input--send-button-active' : null
          }`}
        >
          <div className='str-chat__small-message-input--textarea-wrapper'>
            {isUploadEnabled && <UploadsPreview />}
            <ChatAutoComplete />
            {cooldownRemaining ? (
              <div className='str-chat__input-small-cooldown'>
                <CooldownTimer
                  cooldownInterval={cooldownInterval}
                  setCooldownRemaining={setCooldownRemaining}
                />
              </div>
            ) : (
              <>
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
                      <span className='str-chat__small-message-input-fileupload'>
                        <FileUploadIcon />
                      </span>
                    </FileUploadButton>
                  </div>
                )}
                <div className='str-chat__emojiselect-wrapper'>
                  <Tooltip>
                    {emojiPickerIsOpen ? t('Close emoji picker') : t('Open emoji picker')}
                  </Tooltip>
                  <button
                    aria-label='Emoji picker'
                    className='str-chat__small-message-input-emojiselect'
                    onClick={emojiPickerIsOpen ? closeEmojiPicker : openEmojiPicker}
                  >
                    <EmojiIcon />
                  </button>
                </div>
              </>
            )}
            <EmojiPicker small />
          </div>
          {!cooldownRemaining && (
            <SendButton
              ref={sendButtonRef}
              sendMessage={(event: React.BaseSyntheticEvent) =>
                handleSubmit(event, event.target.value)
              }
            />
          )}
        </div>
      </ImageDropzone>
    </div>
  );
};
