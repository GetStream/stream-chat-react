'use client';

import { useMemo } from 'react';
import {
  AIStates,
  useAIState,
  useChannelStateContext,
} from 'stream-chat-react';
import './AIStateIndicator.scss';

const MESSAGES = [
  'Thinking really hard',
  'Putting on my thinking cap',
  'Consulting the AI gods',
  'Brewing up an answer',
  'Crunching the numbers',
  'Reading the digital tea leaves',
  'Firing up the neurons',
  'Summoning my inner genius',
  'Connecting the dots',
  'Working my magic',
  'Channeling my inner Einstein',
  'Cooking up something good',
];

export const AIStateIndicator = () => {
  const { channel } = useChannelStateContext();
  const { aiState } = useAIState(channel);
  const messageIndex = useMemo(
    () => Math.floor(Math.random() * MESSAGES.length),
    // reset the thinking message everytime a new chat message arrives
    // eslint-disable-next-line
    [channel.state.last_message_at],
  );

  if (![AIStates.Generating, AIStates.Thinking].includes(aiState)) return null;

  return (
    <div className="ai-demo-state-indicator">
      <div className="ai-demo-state-indicator__content">
        <div className="ai-demo-state-indicator__dots">
          <span className="ai-demo-state-indicator__dot"></span>
          <span className="ai-demo-state-indicator__dot"></span>
          <span className="ai-demo-state-indicator__dot"></span>
        </div>
        <span className="ai-demo-state-indicator__text">
          {MESSAGES[messageIndex]}
        </span>
      </div>
    </div>
  );
};
