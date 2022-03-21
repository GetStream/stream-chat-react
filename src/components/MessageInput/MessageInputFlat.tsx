import React, { useEffect } from 'react';
import { FileUploadButton, ImageDropzone } from 'react-file-utils';
import type { Event } from 'stream-chat';

import { EmojiPicker } from './EmojiPicker';
import { CooldownTimer as DefaultCooldownTimer } from './hooks/useCooldownTimer';
import {
  EmojiIconLarge as DefaultEmojiIcon,
  FileUploadIconFlat as DefaultFileUploadIcon,
  SendButton as DefaultSendButton,
} from './icons';
import { QuotedMessagePreview as DefaultQuotedMessagePreview } from './QuotedMessagePreview';
import { UploadsPreview } from './UploadsPreview';

import { ChatAutoComplete } from '../ChatAutoComplete/ChatAutoComplete';
import { Tooltip } from '../Tooltip/Tooltip';

import { useChatContext } from '../../context/ChatContext';
import { useChannelActionContext } from '../../context/ChannelActionContext';
import { useChannelStateContext } from '../../context/ChannelStateContext';
import { useTranslationContext } from '../../context/TranslationContext';
import { useMessageInputContext } from '../../context/MessageInputContext';
import { useComponentContext } from '../../context/ComponentContext';

import type { DefaultStreamChatGenerics } from '../../types/types';

export const MessageInputFlat = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>() => {
  const {
    acceptedFiles,
    multipleUploads,
    quotedMessage,
  } = useChannelStateContext<StreamChatGenerics>('MessageInputFlat');
  const { setQuotedMessage } = useChannelActionContext('MessageInputFlat');
  const { t } = useTranslationContext('MessageInputFlat');
  const { channel } = useChatContext<StreamChatGenerics>('MessageInputFlat');
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
    uploadNewFiles,
  } = useMessageInputContext<StreamChatGenerics>('MessageInputFlat');

  const {
    CooldownTimer = DefaultCooldownTimer,
    EmojiIcon = DefaultEmojiIcon,
    FileUploadIcon = DefaultFileUploadIcon,
    QuotedMessagePreview = DefaultQuotedMessagePreview,
    SendButton = DefaultSendButton,
  } = useComponentContext<StreamChatGenerics>('MessageInputFlat');

  useEffect(() => {
    const handleQuotedMessageUpdate = (e: Event<StreamChatGenerics>) => {
      if (e.message?.id !== quotedMessage?.id) return;
      if (e.message?.deleted_at) {
        setQuotedMessage(undefined);
      }
      setQuotedMessage(e.message);
    };
    channel?.on('message.deleted', handleQuotedMessageUpdate);
    channel?.on('message.updated', handleQuotedMessageUpdate);

    return () => {
      channel?.off('message.deleted', handleQuotedMessageUpdate);
      channel?.off('message.updated', handleQuotedMessageUpdate);
    };
  }, [channel, quotedMessage]);

  return (
    <div
      className={`str-chat__input-flat ${
        SendButton ? 'str-chat__input-flat--send-button-active' : ''
      } ${quotedMessage && !quotedMessage.parent_id ? 'str-chat__input-flat-quoted' : ''}
      ${numberOfUploads ? 'str-chat__input-flat-has-attachments' : ''}
      `}
    >
      <ImageDropzone
        accept={acceptedFiles}
        disabled={!isUploadEnabled || maxFilesLeft === 0 || !!cooldownRemaining}
        handleFiles={uploadNewFiles}
        maxNumberOfFiles={maxFilesLeft}
        multiple={multipleUploads}
      >
        {quotedMessage && !quotedMessage.parent_id && (
          <QuotedMessagePreview quotedMessage={quotedMessage} />
        )}
        <div className='str-chat__input-flat-wrapper'>
          {isUploadEnabled && <UploadsPreview />}
          <div className='str-chat__input-flat--textarea-wrapper'>
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
          {!cooldownRemaining && <SendButton sendMessage={handleSubmit} />}
        </div>
      </ImageDropzone>
    </div>
  );
};
