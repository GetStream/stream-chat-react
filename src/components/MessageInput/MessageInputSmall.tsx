import React, { useEffect } from 'react';
import { FileUploadButton, ImageDropzone } from 'react-file-utils';
import type { Event } from 'stream-chat';

import { EmojiPicker } from './EmojiPicker';
import { CooldownTimer as DefaultCooldownTimer } from './hooks/useCooldownTimer';
import {
  EmojiIconSmall as DefaultEmojiIcon,
  FileUploadIconFlat as DefaultFileUploadIcon,
  SendButton as DefaultSendButton,
} from './icons';
import { UploadsPreview } from './UploadsPreview';

import { ChatAutoComplete } from '../ChatAutoComplete/ChatAutoComplete';
import { Tooltip } from '../Tooltip/Tooltip';

import { useChatContext } from '../../context/ChatContext';
import { useChannelActionContext } from '../../context/ChannelActionContext';
import { useChannelStateContext } from '../../context/ChannelStateContext';
import { useTranslationContext } from '../../context/TranslationContext';
import { useMessageInputContext } from '../../context/MessageInputContext';
import { useComponentContext } from '../../context/ComponentContext';

import { QuotedMessagePreview as DefaultQuotedMessagePreview } from './QuotedMessagePreview';

import type { CustomTrigger, DefaultStreamChatGenerics } from '../../types/types';

export const MessageInputSmall = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
  V extends CustomTrigger = CustomTrigger
>() => {
  const {
    acceptedFiles,
    multipleUploads,
    quotedMessage,
  } = useChannelStateContext<StreamChatGenerics>('MessageInputSmall');
  const { setQuotedMessage } = useChannelActionContext('MessageInputSmall');
  const { t } = useTranslationContext('MessageInputSmall');
  const { channel } = useChatContext<StreamChatGenerics>('MessageInputSmall');

  const {
    closeEmojiPicker,
    cooldownRemaining,
    emojiPickerIsOpen,
    handleSubmit,
    isUploadEnabled,
    maxFilesLeft,
    numberOfUploads,
    openEmojiPicker,
    setCooldownRemaining,
    uploadNewFiles,
  } = useMessageInputContext<StreamChatGenerics, V>('MessageInputSmall');

  const {
    CooldownTimer = DefaultCooldownTimer,
    EmojiIcon = DefaultEmojiIcon,
    FileUploadIcon = DefaultFileUploadIcon,
    SendButton = DefaultSendButton,
    QuotedMessagePreview = DefaultQuotedMessagePreview,
  } = useComponentContext<StreamChatGenerics>('MessageInputSmall');

  useEffect(() => {
    const handleQuotedMessageUpdate = (e: Event<StreamChatGenerics>) => {
      if (!(quotedMessage && e.message?.id === quotedMessage.id)) return;
      if (e.type === 'message.deleted') {
        setQuotedMessage(undefined);
        return;
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
            SendButton ? 'str-chat__small-message-input--send-button-active' : ''
          } ${quotedMessage && quotedMessage.parent_id ? 'str-chat__input-flat-quoted' : ''} ${
            numberOfUploads ? 'str-chat__small-message-input-has-attachments' : ''
          } `}
        >
          {quotedMessage && quotedMessage.parent_id && (
            <QuotedMessagePreview quotedMessage={quotedMessage} />
          )}
          {isUploadEnabled && <UploadsPreview />}
          <div className='str-chat__small-message-input--textarea-wrapper'>
            <ChatAutoComplete />
            {cooldownRemaining ? (
              <div className='str-chat__input-small-cooldown'>
                <CooldownTimer
                  cooldownInterval={cooldownRemaining}
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
          {!cooldownRemaining && <SendButton sendMessage={handleSubmit} />}
        </div>
      </ImageDropzone>
    </div>
  );
};
