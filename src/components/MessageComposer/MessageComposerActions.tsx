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
import { useCanScheduleMessage } from '../ScheduledMessages/hooks/useCanScheduleMessage';
import { ScheduleMessageButton as DefaultScheduleMessageButton } from '../ScheduledMessages/ScheduleMessageButton';

// Typed as `AIState[]` because an inferred array of the literal-typed `AIStates` members would
// reject the wide `AIState` that `useAIState` returns.
const STOPPABLE_AI_STATES: readonly AIState[] = [AIStates.Thinking, AIStates.Generating];

const messageComposerStateSelector = ({
  editedMessage,
  editedScheduledMessage,
}: MessageComposerState) => ({
  isEditing: !!editedMessage || !!editedScheduledMessage,
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
    ScheduleMessageButton: ScheduleMessageButtonOverride,
    SendButton,
    StopAIGenerationButton: StopAIGenerationButtonOverride,
  } = useComponentContext();

  const canScheduleMessage = useCanScheduleMessage();
  const { isEditing } = useStateStore(
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

  const ScheduleMessageButton =
    ScheduleMessageButtonOverride === undefined
      ? DefaultScheduleMessageButton
      : ScheduleMessageButtonOverride;

  const sendButton = SendButton ? (
    <SendButton sendMessage={submitMessageFn} />
  ) : (
    <DefaultSendButton sendMessage={submitMessageFn}>
      {isEditing || command ? <IconCheckmark /> : <IconSend />}
    </DefaultSendButton>
  );

  // One control fills the slot, first match wins. While the AI is answering, stopping it is the
  // only useful action, so the stop button outranks everything else, `hideSendButton` included.
  let content: React.ReactNode;
  if (shouldDisplayStopAIGeneration) {
    content = <StopAIGenerationButton onClick={stopGenerating} />;
  } else if (hideSendButton) {
    return null;
  } else if (isCooldownActive) {
    content = <CooldownTimer />;
  } else if (contentIsEmpty && !isEditing && !command && recordingEnabled) {
    content = <AudioRecordingButtonWithNotification />;
  } else if (canScheduleMessage && ScheduleMessageButton) {
    content = (
      <div className='str-chat__split-send-button'>
        {sendButton}
        <ScheduleMessageButton />
      </div>
    );
  } else {
    content = sendButton;
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
