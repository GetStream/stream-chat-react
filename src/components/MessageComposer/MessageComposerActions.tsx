import React, { useCallback, useMemo } from 'react';
import { StopAIGenerationButton as DefaultStopAIGenerationButton } from './StopAIGenerationButton';
import { CooldownTimer as DefaultCooldownTimer } from './CooldownTimer';
import { SendButton as DefaultSendButton } from './SendButton';
import {
  useChannel,
  useComponentContext,
  useMessageComposerContext,
} from '../../context';
import { useAIState } from '../AIStateIndicator';
import {
  useMessageComposerController,
  useMessageContentIsEmpty,
  useSendMessageFn,
  useUpdateMessageFn,
} from './hooks';
import { AudioRecordingButtonWithNotification } from '../MediaRecorder/AudioRecorder/AudioRecordingButtonWithNotification';
import { useIsCooldownActive } from './hooks/useIsCooldownActive';
import { AIStates } from 'stream-chat';
import type { AIState, MessageComposerState, TextComposerState } from 'stream-chat';
import { useStateStore } from '../../store';
import { IconCheckmark, IconSend } from '../Icons';
import { useInertWhenHidden } from '../Accessibility';

// `AIStates` is imported from its owner rather than through the `../AIStateIndicator` barrel: that
// barrel participates in an import cycle, which would leave the re-exported binding uninitialized
// while this module-scope const evaluates.
// Widened to `AIState` deliberately: `AIStates` is a literal-typed const, so an inferred array of
// its members would reject the wide `AIState` that `useAIState` returns.
const STOPPABLE_AI_STATES: readonly AIState[] = [AIStates.Thinking, AIStates.Generating];

const messageComposerStateSelector = ({ editedMessage }: MessageComposerState) => ({
  editedMessage,
});

const textComposerStateSelector = ({ command, text }: TextComposerState) => ({
  command,
  text,
});

export const MessageComposerActions = () => {
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

  const { recordingController } = useMessageComposerContext();
  const sendMessageFn = useSendMessageFn();
  const updateMessageFn = useUpdateMessageFn();
  const submitMessageFn = useMemo(
    () => (editedMessage ? updateMessageFn : sendMessageFn),
    [editedMessage, sendMessageFn, updateMessageFn],
  );
  const isCooldownActive = useIsCooldownActive();

  const { aiState } = useAIState(channel);
  const stopGenerating = useCallback(() => channel?.stopAIResponse(), [channel]);
  const shouldDisplayStopAIGeneration =
    STOPPABLE_AI_STATES.includes(aiState) && !!StopAIGenerationButton;

  const recordingEnabled = !!(recordingController.recorder && navigator.mediaDevices); // account for requirement on iOS as per this bug report: https://bugs.webkit.org/show_bug.cgi?id=252303

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
  // The additional actions are visually hidden via a CSS transition while a
  // command is active; keep them removed from the a11y tree and tab order
  // without setting `display: none` (which would kill the transition).
  const inertProps = useInertWhenHidden(!!command, { setHiddenAttribute: false });

  return (
    <div className='str-chat__message-composer__additional-actions' {...inertProps}>
      {!isCooldownActive && EmojiPicker ? <EmojiPicker /> : null}
    </div>
  );
};
