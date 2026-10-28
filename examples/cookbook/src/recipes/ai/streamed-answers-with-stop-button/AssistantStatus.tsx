import { useEffect } from 'react';
import { AIStates } from 'stream-chat';
import type { AIState } from 'stream-chat';
import {
  TypingIndicator,
  useAIState,
  useChannel,
  useThreadContext,
} from 'stream-chat-react';
import type { TypingIndicatorProps } from 'stream-chat-react';
import { useAnswerAnnouncements } from './useAnswerAnnouncements';
import './AssistantStatus.css';

/** What the status line says in each state that shows it. */
const labels: Partial<Record<AIState, string>> = {
  [AIStates.Error]: 'Couldn’t finish the answer',
  [AIStates.ExternalSources]: 'Checking sources…',
  [AIStates.Generating]: 'Writing…',
  [AIStates.Thinking]: 'Thinking…',
};

/**
 * The assistant's state at the end of the channel's message list, where the answer appears, and
 * the default typing indicator while the assistant is idle. Screen reader announcements come from
 * `useAnswerAnnouncements()`, so the line itself isn't a live region.
 */
const ChannelAssistantStatus = (props: TypingIndicatorProps) => {
  const { isMessageListScrolledToBottom = true, scrollToBottom } = props;
  const channel = useChannel();
  const { aiState } = useAIState(channel);
  const label = labels[aiState];
  useAnswerAnnouncements(aiState);

  // Keeps the line in view when it appears, as the typing indicator does.
  useEffect(() => {
    if (label && isMessageListScrolledToBottom) scrollToBottom?.();
  }, [isMessageListScrolledToBottom, label, scrollToBottom]);

  if (!label) return <TypingIndicator {...props} />;

  return (
    <div className='cookbook-assistant-status' data-ai-state={aiState}>
      {aiState !== AIStates.Error && (
        <span aria-hidden='true' className='cookbook-assistant-status__dots'>
          <span />
          <span />
          <span />
        </span>
      )}
      {label}
    </div>
  );
};

/**
 * Fills the `TypingIndicator` slot. The assistant answers in the channel, so a thread keeps the
 * default typing indicator.
 */
export const AssistantStatus = (props: TypingIndicatorProps) => {
  const thread = useThreadContext();
  return thread ? <TypingIndicator {...props} /> : <ChannelAssistantStatus {...props} />;
};
