import React, { useCallback } from 'react';
import { StopAIGenerationButton as DefaultStopAIGenerationButton } from './StopAIGenerationButton';
import { CooldownTimer as DefaultCooldownTimer } from './CooldownTimer';
import { SendButton as DefaultSendButton } from './SendButton';
import {
  useChannel,
  useComponentContext,
  useComponentContextIcons,
  useMessageComposerContext,
} from '../../context';
import { useAIState } from '../AIStateIndicator';
import {
  useMessageComposerController,
  useMessageComposerSubmitFn,
  useMessageContentIsEmpty,
} from './hooks';
import { AudioRecordingButtonWithNotification } from '../MediaRecorder/AudioRecorder/AudioRecordingButtonWithNotification';
import { useIsCooldownActive } from './hooks/useIsCooldownActive';
import { AIStates } from 'stream-chat';
import type { AIState, MessageComposerState, TextComposerState } from 'stream-chat';
import { useStateStore } from '../../store';
import { useInertWhenHidden } from '../Accessibility';

// Typed as `AIState[]` because an inferred array of the literal-typed `AIStates` members would
// reject the wide `AIState` that `useAIState` returns.
const STOPPABLE_AI_STATES: readonly AIState[] = [AIStates.Thinking, AIStates.Generating];

const messageComposerStateSelector = ({ editedMessage }: MessageComposerState) => ({
  editedMessage,
});

const textComposerStateSelector = ({ command, text }: TextComposerState) => ({
  command,
  text,
});

export const MessageComposerActions = () => {
  const { IconCheckmark, IconSend } = useComponentContextIcons();
  const channel = useChannel();
  const { hideSendButton } = useMessageComposerContext();
  const messageComposer = useMessageComposerController();
  const {
    CooldownTimer = DefaultCooldownTimer,
    SendButton,
    StopAIGenerationButton: StopAIGenerationButtonOverride,
  } = useComponentContext();

  const { editedMessage } = useStateStore(
    messageComposer.state,
    messageComposerStateSelector,
  );

  const { command } = useStateStore(
    messageComposer.textComposer.state,
    textComposerStateSelector,
  );

  const contentIsEmpty = useMessageContentIsEmpty();
  // Only `undefined` falls back to the default, so a `StopAIGenerationButton: null` override
  // removes the stop button.
  const StopAIGenerationButton =
    StopAIGenerationButtonOverride === undefined
      ? DefaultStopAIGenerationButton
      : StopAIGenerationButtonOverride;

  const { recordingController } = useMessageComposerContext();
  const submitMessageFn = useMessageComposerSubmitFn();
  const isCooldownActive = useIsCooldownActive();

  const { aiState } = useAIState(channel);
  const stopGenerating = useCallback(() => channel?.stopAIResponse(), [channel]);
  const shouldDisplayStopAIGeneration =
    STOPPABLE_AI_STATES.includes(aiState) && !!StopAIGenerationButton;

  // Accounts for an iOS requirement, see https://bugs.webkit.org/show_bug.cgi?id=252303
  const recordingEnabled = !!(recordingController.recorder && navigator.mediaDevices);

  let content = SendButton ? (
    <SendButton sendMessage={submitMessageFn} />
  ) : (
    <DefaultSendButton sendMessage={submitMessageFn}>
      {editedMessage || command ? <IconCheckmark /> : <IconSend />}
    </DefaultSendButton>
  );

  if (shouldDisplayStopAIGeneration) {
    content = <StopAIGenerationButton onClick={stopGenerating} />;
  } else if (hideSendButton) return null;

  if (isCooldownActive) {
    content = <CooldownTimer />;
  } else if (contentIsEmpty && !editedMessage && !command && recordingEnabled) {
    content = <AudioRecordingButtonWithNotification />;
  }

  return <div className='str-chat__message-composer__actions'>{content}</div>;
};

export const AdditionalMessageComposerActions = () => {
  const { EmojiPicker } = useComponentContext();
  const isCooldownActive = useIsCooldownActive();
  const messageComposer = useMessageComposerController();
  const { command } = useStateStore(
    messageComposer.textComposer.state,
    textComposerStateSelector,
  );
  // Hidden by a CSS transition while a command is active. Inert keeps them out of the a11y tree
  // and tab order without `display: none`, which would break the transition.
  const inertProps = useInertWhenHidden(!!command, { setHiddenAttribute: false });

  return (
    <div className='str-chat__message-composer__additional-actions' {...inertProps}>
      {!isCooldownActive && EmojiPicker ? <EmojiPicker /> : null}
    </div>
  );
};
