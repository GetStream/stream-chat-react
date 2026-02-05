import React, { useCallback } from 'react';
import { StopAIGenerationButton as DefaultStopAIGenerationButton } from './StopAIGenerationButton';
import { CooldownTimer as DefaultCooldownTimer } from './CooldownTimer';
import { SendButton as DefaultSendButton } from './SendButton';
import {
  useChannelStateContext,
  useComponentContext,
  useMessageInputContext,
} from '../../context';
import { AIStates, useAIState } from '../AIStateIndicator';
import { useMessageComposer, useMessageCompositionIsEmpty } from './hooks';
import { AudioRecordingButtonWithNotification } from '../MediaRecorder/AudioRecorder/AudioRecordingButtonWithNotification';
import { useIsCooldownActive } from './hooks/useIsCooldownActive';
import type { MessageComposerState, TextComposerState } from 'stream-chat';
import { useStateStore } from '../../store';
import { IconCheckmark, IconPaperPlane } from '../Icons';

const messageComposerStateSelector = ({ editedMessage }: MessageComposerState) => ({
  editedMessage,
});

const textComposerStateSelector = ({ command, text }: TextComposerState) => ({
  command,
  text,
});

export const MessageComposerActions = () => {
  const { channel } = useChannelStateContext();
  const { hideSendButton } = useMessageInputContext();
  const messageComposer = useMessageComposer();
  const {
    CooldownTimer = DefaultCooldownTimer,
    SendButton,
    StopAIGenerationButton: StopAIGenerationButtonOverride,
  } = useComponentContext();

  const { editedMessage } = useStateStore(
    messageComposer.state,
    messageComposerStateSelector,
  );

  const { command, text } = useStateStore(
    messageComposer.textComposer.state,
    textComposerStateSelector,
  );

  const compositionIsEmpty = useMessageCompositionIsEmpty();
  /**
   * This bit here is needed to make sure that we can get rid of the default behaviour
   * if need be. Essentially, this allows us to pass StopAIGenerationButton={null} and
   * completely circumvent the default logic if it's not what we want. We need it as a
   * prop because there is no other trivial way to override the SendMessage button otherwise.
   */
  const StopAIGenerationButton =
    StopAIGenerationButtonOverride === undefined
      ? DefaultStopAIGenerationButton
      : StopAIGenerationButtonOverride;

  const { handleSubmit, recordingController } = useMessageInputContext();
  const isCooldownActive = useIsCooldownActive();

  const { aiState } = useAIState(channel);
  const stopGenerating = useCallback(() => channel?.stopAIResponse(), [channel]);
  const shouldDisplayStopAIGeneration =
    [AIStates.Thinking, AIStates.Generating].includes(aiState) &&
    !!StopAIGenerationButton;

  const recordingEnabled = !!(recordingController.recorder && navigator.mediaDevices); // account for requirement on iOS as per this bug report: https://bugs.webkit.org/show_bug.cgi?id=252303

  let content = SendButton ? (
    <SendButton sendMessage={handleSubmit} />
  ) : (
    <DefaultSendButton sendMessage={handleSubmit}>
      {editedMessage || command ? <IconCheckmark /> : <IconPaperPlane />}
    </DefaultSendButton>
  );

  if (shouldDisplayStopAIGeneration) {
    content = <StopAIGenerationButton onClick={stopGenerating} />;
  } else if (hideSendButton) return null;

  if (isCooldownActive) {
    content = <CooldownTimer />;
  } else if ((compositionIsEmpty || (editedMessage && !text)) && recordingEnabled) {
    content = <AudioRecordingButtonWithNotification />;
  }

  return <div className='str-chat__message-composer__actions'>{content}</div>;
};

export const AdditionalMessageComposerActions = () => {
  const { EmojiPicker } = useComponentContext();
  const isCooldownActive = useIsCooldownActive();

  return (
    <div className='str-chat__message-composer__additional-actions'>
      {!isCooldownActive && EmojiPicker ? <EmojiPicker /> : null}
    </div>
  );
};
