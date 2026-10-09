'use client';

import { AIStates, useAIState, useChannelStateContext } from 'stream-chat-react';
import { AIStateIndicator as StateIndicator } from 'stream-chat-react/ai-components';
import './AIStateIndicator.scss';

export const AIStateIndicator = () => {
  const { channel } = useChannelStateContext();
  const { aiState } = useAIState(channel);

  if (![AIStates.Generating, AIStates.Thinking].includes(aiState)) return null;

  return <StateIndicator key={channel.state.last_message_at?.toString()} />;
};
