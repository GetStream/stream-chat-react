import React, { useEffect, useRef } from 'react';
import { FileUploadButton, ImageDropzone } from 'react-file-utils';

import { EmojiPicker } from './EmojiPicker';
import { CooldownTimer as DefaultCooldownTimer } from './hooks/useCooldownTimer';
import {
  EmojiIconLarge as DefaultEmojiIcon,
  FileUploadIconFlat as DefaultFileUploadIcon,
  SendButton as DefaultSendButton,
} from './icons';
import { QuotedMessagePreview as DefaultQuotedMessagePreview } from './QuotedMessagePreview';
import { UploadsPreview } from './UploadsPreview';

import { useBreakpoint } from '../Message/hooks';
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
} from '../../types/types';

export const MessageInputFlat = <
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends DefaultChannelType = DefaultChannelType,
  Co extends DefaultCommandType = DefaultCommandType,
  Ev extends DefaultEventType = DefaultEventType,
  Me extends DefaultMessageType = DefaultMessageType,
  Re extends DefaultReactionType = DefaultReactionType,
  Us extends DefaultUserType<Us> = DefaultUserType
>() => {
  const { acceptedFiles, multipleUploads, quotedMessage } = useChannelStateContext<
    At,
    Ch,
    Co,
    Ev,
    Me,
    Re,
    Us
  >('MessageInputFlat');
  const { t } = useTranslationContext('MessageInputFlat');

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
  } = useMessageInputContext<At, Ch, Co, Ev, Me, Re, Us>('MessageInputFlat');

  const {
    CooldownTimer = DefaultCooldownTimer,
    EmojiIcon = DefaultEmojiIcon,
    FileUploadIcon = DefaultFileUploadIcon,
    QuotedMessagePreview = DefaultQuotedMessagePreview,
    SendButton = DefaultSendButton,
  } = useComponentContext<At, Ch, Co, Ev, Me, Re, Us>('MessageInputFlat');

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
    <div
      className={`str-chat__input-flat ${
        SendButton ? 'str-chat__input-flat--send-button-active' : null
      } ${quotedMessage ? 'str-chat__input-flat-quoted' : null}`}
    >
      <ImageDropzone
        accept={acceptedFiles}
        disabled={!isUploadEnabled || maxFilesLeft === 0 || !!cooldownRemaining}
        handleFiles={uploadNewFiles}
        maxNumberOfFiles={maxFilesLeft}
        multiple={multipleUploads}
      >
        {quotedMessage && <QuotedMessagePreview quotedMessage={quotedMessage} />}
        <div className='str-chat__input-flat-wrapper'>
          <div className='str-chat__input-flat--textarea-wrapper'>
            {isUploadEnabled && <UploadsPreview />}
            <div className='str-chat__emojiselect-wrapper'>
              <Tooltip>
                {emojiPickerIsOpen ? t('Close emoji picker') : t('Open emoji picker')}
              </Tooltip>
              <button
                aria-label='Emoji picker'
                className='str-chat__input-flat-emojiselect'
                onClick={emojiPickerIsOpen ? closeEmojiPicker : openEmojiPicker}
              >
                {cooldownRemaining ? (
                  <div className='str-chat__input-flat-cooldown'>
                    <CooldownTimer
                      cooldownInterval={cooldownInterval}
                      setCooldownRemaining={setCooldownRemaining}
                    />
                  </div>
                ) : (
                  <EmojiIcon />
                )}
              </button>
            </div>
            <EmojiPicker />
            <ChatAutoComplete />
            {isUploadEnabled && !cooldownRemaining && (
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
          {!cooldownRemaining && (
            <SendButton
              ref={sendButtonRef}
              sendMessage={(event: React.BaseSyntheticEvent) => handleSubmit(event, event.target.value)}
            />
          )}
        </div>
      </ImageDropzone>
    </div>
  );
};
