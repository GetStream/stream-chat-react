'use client';

import type { AIState, MessagePaginatorAggregateState } from 'stream-chat';
import { AIStates } from 'stream-chat';
import { useAIState, useChannel, useStateStore } from 'stream-chat-react';
import { AIStateIndicator as StateIndicator } from 'stream-chat-react/ai-components';
import './AIStateIndicator.scss';

// `AIStates` is a literal-typed `as const` in stream-chat v10, so the list is widened to `AIState`
// to accept the value `useAIState` returns.
const VISIBLE_STATES: readonly AIState[] = [AIStates.Generating, AIStates.Thinking];

const latestMessageIdSelector = ({ latestMessage }: MessagePaginatorAggregateState) => ({
  latestMessageId: latestMessage?.id,
});

export const AIStateIndicator = () => {
  const channel = useChannel();
  const { aiState } = useAIState(channel);
  const { latestMessageId } = useStateStore(
    channel.messagePaginator.aggregateState,
    latestMessageIdSelector,
  );

  if (!VISIBLE_STATES.includes(aiState)) return null;

  // Remount (restarting the animation) whenever a new message lands in the conversation.
  return <StateIndicator key={latestMessageId} />;
};
