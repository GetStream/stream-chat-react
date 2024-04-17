import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FileUploadButton, ImageDropzone, UploadButton } from '../ReactFileUtilities';
import type { Event } from 'stream-chat';
import clsx from 'clsx';
import { useDropzone } from 'react-dropzone';
import { nanoid } from 'nanoid';

import {
  FileUploadIconFlat as DefaultFileUploadIcon,
  UploadIcon as DefaultUploadIcon,
} from './icons';
import { CooldownTimer as DefaultCooldownTimer } from './CooldownTimer';
import { SendButton as DefaultSendButton } from './SendButton';
import {
  AudioRecorder as DefaultAudioRecorder,
  RecordingPermissionDeniedNotification as DefaultRecordingPermissionDeniedNotification,
  StartRecordingAudioButton as DefaultStartRecordingAudioButton,
  RecordingPermission,
} from '../MediaRecorder';
import {
  QuotedMessagePreview as DefaultQuotedMessagePreview,
  QuotedMessagePreviewHeader,
} from './QuotedMessagePreview';
import { AttachmentPreviewList as DefaultAttachmentPreviewList } from './AttachmentPreviewList';
import { LinkPreviewList as DefaultLinkPreviewList } from './LinkPreviewList';
import { UploadsPreview } from './UploadsPreview';

import { ChatAutoComplete } from '../ChatAutoComplete/ChatAutoComplete';
import { Tooltip } from '../Tooltip/Tooltip';
import { RecordingAttachmentType } from '../MediaRecorder/classes';

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
  const { quotedMessage } = useChannelStateContext<StreamChatGenerics>('MessageInputFlat');
  const { setQuotedMessage } = useChannelActionContext('MessageInputFlat');
  const { channel, themeVersion } = useChatContext<StreamChatGenerics>('MessageInputFlat');

  useEffect(() => {
    const handleQuotedMessageUpdate = (e: Event<StreamChatGenerics>) => {
      if (e.message?.id !== quotedMessage?.id) return;
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channel, quotedMessage]);

  return themeVersion === '2' ? (
    <MessageInputV2<StreamChatGenerics> />
  ) : (
    <MessageInputV1<StreamChatGenerics> />
  );
};

const MessageInputV1 = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>() => {
  const {
    acceptedFiles,
    multipleUploads,
    quotedMessage,
  } = useChannelStateContext<StreamChatGenerics>('MessageInputFlat');
  const { t } = useTranslationContext('MessageInputFlat');
  const {
    cooldownRemaining,
    handleSubmit,
    hideSendButton,
    isUploadEnabled,
    maxFilesLeft,
    numberOfUploads,
    setCooldownRemaining,
    uploadNewFiles,
  } = useMessageInputContext<StreamChatGenerics>('MessageInputFlat');

  const {
    CooldownTimer = DefaultCooldownTimer,
    FileUploadIcon = DefaultFileUploadIcon,
    QuotedMessagePreview = DefaultQuotedMessagePreview,
    SendButton = DefaultSendButton,
    AttachmentPreviewList = UploadsPreview,
    EmojiPicker,
  } = useComponentContext<StreamChatGenerics>('MessageInputFlat');

  return (
    <div
      className={clsx('str-chat__input-flat', 'str-chat__message-input', {
        'str-chat__input-flat--send-button-active': !!SendButton,
        'str-chat__input-flat-has-attachments': numberOfUploads,
        'str-chat__input-flat-quoted': quotedMessage && !quotedMessage.parent_id,
      })}
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
          {isUploadEnabled && <AttachmentPreviewList />}
          <div className='str-chat__input-flat--textarea-wrapper'>
            {EmojiPicker && <EmojiPicker />}
            {!!cooldownRemaining && (
              <div className='str-chat__input-flat-cooldown'>
                <CooldownTimer
                  cooldownInterval={cooldownRemaining}
                  setCooldownRemaining={setCooldownRemaining}
                />
              </div>
            )}
            <ChatAutoComplete />
            {isUploadEnabled && !cooldownRemaining && (
              <div className='str-chat__fileupload-wrapper' data-testid='fileinput'>
                <Tooltip>
                  {maxFilesLeft
                    ? t<string>('Attach files')
                    : t<string>("You've reached the maximum number of files")}
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
          {!(cooldownRemaining || hideSendButton) && <SendButton sendMessage={handleSubmit} />}
        </div>
      </ImageDropzone>
    </div>
  );
};

const MessageInputV2 = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>() => {
  const {
    acceptedFiles = [],
    multipleUploads,
    quotedMessage,
  } = useChannelStateContext<StreamChatGenerics>('MessageInputV2');

  const { t } = useTranslationContext('MessageInputV2');

  const {
    asyncMessagesMultiSendEnabled,
    attachments,
    cooldownRemaining,
    findAndEnqueueURLsToEnrich,
    handleSubmit,
    hideSendButton,
    isUploadEnabled,
    linkPreviews,
    maxFilesLeft,
    message,
    numberOfUploads,
    recordingController,
    setCooldownRemaining,
    text,
    uploadNewFiles,
  } = useMessageInputContext<StreamChatGenerics>('MessageInputV2');

  const {
    AudioRecorder = DefaultAudioRecorder,
    AttachmentPreviewList = DefaultAttachmentPreviewList,
    CooldownTimer = DefaultCooldownTimer,
    FileUploadIcon = DefaultUploadIcon,
    LinkPreviewList = DefaultLinkPreviewList,
    QuotedMessagePreview = DefaultQuotedMessagePreview,
    RecordingPermissionDeniedNotification = DefaultRecordingPermissionDeniedNotification,
    SendButton = DefaultSendButton,
    StartRecordingAudioButton = DefaultStartRecordingAudioButton,
    EmojiPicker,
  } = useComponentContext<StreamChatGenerics>('MessageInputV2');

  const [
    showRecordingPermissionDeniedNotification,
    setShowRecordingPermissionDeniedNotification,
  ] = useState(false);
  const closePermissionDeniedNotification = useCallback(() => {
    setShowRecordingPermissionDeniedNotification(false);
  }, []);

  const id = useMemo(() => nanoid(), []);

  const accept = useMemo(
    () =>
      acceptedFiles.reduce<Record<string, Array<string>>>((mediaTypeMap, mediaType) => {
        mediaTypeMap[mediaType] ??= [];
        return mediaTypeMap;
      }, {}),
    [acceptedFiles],
  );

  const { getRootProps, isDragActive, isDragReject } = useDropzone({
    accept,
    disabled: !isUploadEnabled || maxFilesLeft === 0,
    multiple: multipleUploads,
    noClick: true,
    onDrop: uploadNewFiles,
  });

  if (recordingController.recordingState) return <AudioRecorder />;

  // TODO: "!message" condition is a temporary fix for shared
  // state when editing a message (fix shared state issue)
  const displayQuotedMessage = !message && quotedMessage && !quotedMessage.parent_id;
  const recordingEnabled = !!(recordingController.recorder && navigator.mediaDevices); // account for requirement on iOS as per this bug report: https://bugs.webkit.org/show_bug.cgi?id=252303
  const isRecording = !!recordingController.recordingState;

  return (
    <>
      <div {...getRootProps({ className: 'str-chat__message-input' })}>
        {recordingEnabled &&
          recordingController.permissionState === 'denied' &&
          showRecordingPermissionDeniedNotification && (
            <RecordingPermissionDeniedNotification
              onClose={closePermissionDeniedNotification}
              permissionName={RecordingPermission.MIC}
            />
          )}
        {findAndEnqueueURLsToEnrich && (
          <LinkPreviewList linkPreviews={Array.from(linkPreviews.values())} />
        )}
        {isDragActive && (
          <div
            className={clsx('str-chat__dropzone-container', {
              'str-chat__dropzone-container--not-accepted': isDragReject,
            })}
          >
            {!isDragReject && <p>{t<string>('Drag your files here')}</p>}
            {isDragReject && <p>{t<string>('Some of the files will not be accepted')}</p>}
          </div>
        )}
        {displayQuotedMessage && <QuotedMessagePreviewHeader />}

        <div className='str-chat__message-input-inner'>
          <div className='str-chat__file-input-container' data-testid='file-upload-button'>
            <UploadButton
              accept={acceptedFiles?.join(',')}
              aria-label={t('aria/File upload')}
              className='str-chat__file-input'
              data-testid='file-input'
              disabled={!isUploadEnabled || maxFilesLeft === 0}
              id={id}
              multiple={multipleUploads}
              onFileChange={uploadNewFiles}
            />
            <label className='str-chat__file-input-label' htmlFor={id}>
              <FileUploadIcon />
            </label>
          </div>
          <div className='str-chat__message-textarea-container'>
            {displayQuotedMessage && <QuotedMessagePreview quotedMessage={quotedMessage} />}
            {isUploadEnabled && !!(numberOfUploads || attachments.length) && (
              <AttachmentPreviewList />
            )}

            <div className='str-chat__message-textarea-with-emoji-picker'>
              <ChatAutoComplete />

              {EmojiPicker && <EmojiPicker />}
            </div>
          </div>
          {!hideSendButton && (
            <>
              {cooldownRemaining ? (
                <CooldownTimer
                  cooldownInterval={cooldownRemaining}
                  setCooldownRemaining={setCooldownRemaining}
                />
              ) : (
                <>
                  <SendButton
                    disabled={!numberOfUploads && !text.length && !attachments.length}
                    sendMessage={handleSubmit}
                  />
                  {recordingEnabled && (
                    <StartRecordingAudioButton
                      disabled={
                        isRecording ||
                        (!asyncMessagesMultiSendEnabled &&
                          attachments.some(
                            (a) => a.type === RecordingAttachmentType.VOICE_RECORDING,
                          ))
                      }
                      onClick={() => {
                        recordingController.recorder?.start();
                        setShowRecordingPermissionDeniedNotification(true);
                      }}
                    />
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
};
