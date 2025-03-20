import React, { useCallback, useMemo, useState } from 'react';
import clsx from 'clsx';
import { useDropzone } from 'react-dropzone';
import {
  AttachmentSelector as DefaultAttachmentSelector,
  SimpleAttachmentSelector,
} from './AttachmentSelector';
import { AttachmentPreviewList as DefaultAttachmentPreviewList } from './AttachmentPreviewList';
import { CooldownTimer as DefaultCooldownTimer } from './CooldownTimer';
import { SendButton as DefaultSendButton } from './SendButton';
import { StopAIGenerationButton as DefaultStopAIGenerationButton } from './StopAIGenerationButton';
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
import { LinkPreviewList as DefaultLinkPreviewList } from './LinkPreviewList';
import { RecordingAttachmentType } from '../MediaRecorder/classes';

import { useChatContext } from '../../context/ChatContext';
import { useChannelStateContext } from '../../context/ChannelStateContext';
import { useTranslationContext } from '../../context/TranslationContext';
import { useMessageInputContext } from '../../context/MessageInputContext';
import { useComponentContext } from '../../context/ComponentContext';
import { useStateStore } from '../../store';
import { AIStates, useAIState } from '../AIStateIndicator';
import type { AttachmentManagerState, TextComposerState } from 'stream-chat';
import { useMessageComposer } from './hooks/messageComposer/useMessageComposer';
import { TextAreaComposer } from '../TextAreaComposer';

const attachmentManagerStateSelector = (state: AttachmentManagerState) => ({
  attachments: state.attachments,
});
const textComposerStateSelector = (state: TextComposerState) => state;

export const MessageInputFlat = () => {
  const { t } = useTranslationContext('MessageInputFlat');
  const {
    asyncMessagesMultiSendEnabled,
    cooldownRemaining,
    findAndEnqueueURLsToEnrich,
    handleSubmit,
    hideSendButton,
    linkPreviews,
    message,
    recordingController,
    setCooldownRemaining,
  } = useMessageInputContext('MessageInputFlat');

  const {
    AttachmentPreviewList = DefaultAttachmentPreviewList,
    AttachmentSelector = message ? SimpleAttachmentSelector : DefaultAttachmentSelector,
    AudioRecorder = DefaultAudioRecorder,
    CooldownTimer = DefaultCooldownTimer,
    EmojiPicker,
    LinkPreviewList = DefaultLinkPreviewList,
    QuotedMessagePreview = DefaultQuotedMessagePreview,
    RecordingPermissionDeniedNotification = DefaultRecordingPermissionDeniedNotification,
    SendButton = DefaultSendButton,
    StartRecordingAudioButton = DefaultStartRecordingAudioButton,
    StopAIGenerationButton: StopAIGenerationButtonOverride,
  } = useComponentContext('MessageInputFlat');
  const { acceptedFiles = [] } = useChannelStateContext('MessageInputFlat');
  const { channel } = useChatContext('MessageInputFlat');
  const messageComposer = useMessageComposer();

  const { aiState } = useAIState(channel);

  const stopGenerating = useCallback(() => channel?.stopAIResponse(), [channel]);

  const [
    showRecordingPermissionDeniedNotification,
    setShowRecordingPermissionDeniedNotification,
  ] = useState(false);
  const closePermissionDeniedNotification = useCallback(() => {
    setShowRecordingPermissionDeniedNotification(false);
  }, []);

  const accept = useMemo(
    () =>
      acceptedFiles.reduce<Record<string, Array<string>>>((mediaTypeMap, mediaType) => {
        mediaTypeMap[mediaType] ??= [];
        return mediaTypeMap;
      }, {}),
    [acceptedFiles],
  );

  const { attachments } = useStateStore(
    messageComposer.attachmentManager.state,
    attachmentManagerStateSelector,
  );
  const { text: actualText } = useStateStore(
    messageComposer.textComposer.state,
    textComposerStateSelector,
  );

  const { getRootProps, isDragActive, isDragReject } = useDropzone({
    accept,
    disabled: !messageComposer.attachmentManager.isUploadEnabled || !!cooldownRemaining,
    multiple: messageComposer.attachmentManager.maxNumberOfFilesPerMessage > 1,
    noClick: true,
    onDrop: messageComposer.attachmentManager.uploadFiles,
  });

  if (recordingController.recordingState) return <AudioRecorder />;

  const recordingEnabled = !!(recordingController.recorder && navigator.mediaDevices); // account for requirement on iOS as per this bug report: https://bugs.webkit.org/show_bug.cgi?id=252303
  const isRecording = !!recordingController.recordingState;

  /**
   * This bit here is needed to make sure that we can get rid of the default behaviour
   * if need be. Essentially this allows us to pass StopAIGenerationButton={null} and
   * completely circumvent the default logic if it's not what we want. We need it as a
   * prop because there is no other trivial way to override the SendMessage button otherwise.
   */
  const StopAIGenerationButton =
    StopAIGenerationButtonOverride === undefined
      ? DefaultStopAIGenerationButton
      : StopAIGenerationButtonOverride;
  const shouldDisplayStopAIGeneration =
    [AIStates.Thinking, AIStates.Generating].includes(aiState) &&
    !!StopAIGenerationButton;

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
        <QuotedMessagePreviewHeader />

        <div className='str-chat__message-input-inner'>
          <AttachmentSelector />
          <div className='str-chat__message-textarea-container'>
            <QuotedMessagePreview />
            {messageComposer.attachmentManager.isUploadEnabled &&
              attachments.length > 0 && <AttachmentPreviewList />}

            <div className='str-chat__message-textarea-with-emoji-picker'>
              <TextAreaComposer />

              {EmojiPicker && <EmojiPicker />}
            </div>
          </div>
          {shouldDisplayStopAIGeneration ? (
            <StopAIGenerationButton onClick={stopGenerating} />
          ) : (
            !hideSendButton && (
              <>
                {cooldownRemaining ? (
                  <CooldownTimer
                    cooldownInterval={cooldownRemaining}
                    setCooldownRemaining={setCooldownRemaining}
                  />
                ) : (
                  <>
                    <SendButton
                      disabled={
                        !actualText.length &&
                        attachments.length ===
                          messageComposer.attachmentManager.failedUploadsCount
                      }
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
            )
          )}
        </div>
      </div>
    </>
  );
};
