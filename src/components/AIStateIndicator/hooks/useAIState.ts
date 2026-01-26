import { useEffect, useState } from 'react';
import type { AIState, Channel, Event } from 'stream-chat';

export const AIStates = {
  Error: 'AI_STATE_ERROR',
  ExternalSources: 'AI_STATE_EXTERNAL_SOURCES',
  Generating: 'AI_STATE_GENERATING',
  Idle: 'AI_STATE_IDLE',
  Stop: 'AI_STATE_STOP',
  Thinking: 'AI_STATE_THINKING',
};

/**
 * A hook that returns the current state of the AI.
 * @param {Channel} channel - The channel for which we want to know the AI state.
 * @returns {{ aiState: AIState }} The current AI state for the given channel.
 */
export const useAIState = (channel?: Channel): { aiState: AIState } => {
  const [aiState, setAiState] = useState<AIState>(AIStates.Idle);

  useEffect(() => {
    if (!channel) {
      return;
    }

    const indicatorChangedListener = channel.on('ai_indicator.update', (event: Event) => {
      const { cid } = event;
      const state = event.ai_state as AIState;
      if (channel.cid === cid) {
        setAiState(state);
      }
    });

    const indicatorClearedListener = channel.on('ai_indicator.clear', (event) => {
      const { cid } = event;
      if (channel.cid === cid) {
        setAiState(AIStates.Idle);
      }
    });

    const indicatorStoppedListener = channel.on('ai_indicator.stop', (event) => {
      const { cid } = event;
      if (channel.cid === cid) {
        setAiState(AIStates.Stop);
      }
    });

    return () => {
      indicatorChangedListener.unsubscribe();
      indicatorClearedListener.unsubscribe();
      indicatorStoppedListener.unsubscribe();
    };
  }, [channel]);

  return { aiState };
};
