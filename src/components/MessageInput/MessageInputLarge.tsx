import React from 'react';
import { FileUploadButton, ImageDropzone } from 'react-file-utils';

import { EmojiPicker } from './EmojiPicker';
import { CooldownTimer as DefaultCooldownTimer } from './hooks/useCooldownTimer';
import {
  EmojiIconSmall as DefaultEmojiIcon,
  FileUploadIcon as DefaultFileUploadIcon,
  SendButton as DefaultSendButton,
} from './icons';
import { UploadsPreview } from './UploadsPreview';

import { ChatAutoComplete } from '../ChatAutoComplete/ChatAutoComplete';
import { Tooltip } from '../Tooltip/Tooltip';

import { useChannelStateContext } from '../../context/ChannelStateContext';
import { useChatContext } from '../../context/ChatContext';
import { useTranslationContext } from '../../context/TranslationContext';
import { useTypingContext } from '../../context/TypingContext';
import { useMessageInputContext } from '../../context/MessageInputContext';
import { useComponentContext } from '../../context/ComponentContext';

import type { Event } from 'stream-chat';

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

/**
 * @deprecated - This UI component will be removed in the next major release.
 */
export const MessageInputLarge = <
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends DefaultChannelType = DefaultChannelType,
  Co extends DefaultCommandType = DefaultCommandType,
  Ev extends DefaultEventType = DefaultEventType,
  Me extends DefaultMessageType = DefaultMessageType,
  Re extends DefaultReactionType = DefaultReactionType,
  Us extends DefaultUserType<Us> = DefaultUserType,
  V extends CustomTrigger = CustomTrigger
>() => {
  const { acceptedFiles, multipleUploads, watcher_count } = useChannelStateContext<
    At,
    Ch,
    Co,
    Ev,
    Me,
    Re,
    Us
  >();
  const { client } = useChatContext<At, Ch, Co, Ev, Me, Re, Us>();
  const { t } = useTranslationContext();
  const { typing } = useTypingContext<At, Ch, Co, Ev, Me, Re, Us>();

  const {
    closeEmojiPicker,
    cooldownInterval,
    cooldownRemaining,
    emojiPickerIsOpen,
    emojiPickerRef,
    handleEmojiKeyDown,
    handleSubmit,
    isUploadEnabled,
    maxFilesLeft,
    openEmojiPicker,
    setCooldownRemaining,
    uploadNewFiles,
  } = useMessageInputContext<At, Ch, Co, Ev, Me, Re, Us, V>();

  const {
    CooldownTimer = DefaultCooldownTimer,
    EmojiIcon = DefaultEmojiIcon,
    FileUploadIcon = DefaultFileUploadIcon,
    SendButton = DefaultSendButton,
  } = useComponentContext<At, Ch, Co, Ev, Me, Re, Us>();

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
        disabled={!isUploadEnabled || maxFilesLeft === 0 || !!cooldownRemaining}
        handleFiles={uploadNewFiles}
        maxNumberOfFiles={maxFilesLeft}
        multiple={multipleUploads}
      >
        <div className='str-chat__input'>
          <div className='str-chat__input--textarea-wrapper'>
            {isUploadEnabled && <UploadsPreview />}
            <ChatAutoComplete />
            {cooldownRemaining ? (
              <div className='str-chat__input-large-cooldown'>
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
                      <span className='str-chat__input-fileupload'>
                        <FileUploadIcon />
                      </span>
                    </FileUploadButton>
                  </div>
                )}
                <div className='str-chat__emojiselect-wrapper'>
                  <Tooltip>
                    {emojiPickerIsOpen ? t('Close emoji picker') : t('Open emoji picker')}
                  </Tooltip>
                  <span
                    className='str-chat__input-emojiselect'
                    onClick={emojiPickerIsOpen ? closeEmojiPicker : openEmojiPicker}
                    onKeyDown={handleEmojiKeyDown}
                    ref={emojiPickerRef}
                    role='button'
                    tabIndex={0}
                  >
                    <EmojiIcon />
                  </span>
                </div>
              </>
            )}
            <EmojiPicker />
          </div>
          {!cooldownRemaining && <SendButton sendMessage={handleSubmit} />}
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
