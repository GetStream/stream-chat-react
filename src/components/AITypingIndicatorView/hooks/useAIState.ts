import { useEffect, useState } from 'react';

import { AIState, Channel, Event } from 'stream-chat';

import type { DefaultStreamChatGenerics } from '../../../types/types';

export const AIStates = {
  Error: 'AI_STATE_ERROR',
  ExternalSources: 'AI_STATE_EXTERNAL_SOURCES',
  Generating: 'AI_STATE_GENERATING',
  Idle: 'AI_STATE_IDLE',
  Thinking: 'AI_STATE_THINKING',
};

export const useAIState = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>(
  channel?: Channel<StreamChatGenerics>,
) => {
  const [aiState, setAiState] = useState<AIState>(AIStates.Idle);

  useEffect(() => {
    if (!channel) {
      return;
    }

    const indicatorChangedListener = channel.on(
      'ai_indicator.update',
      (event: Event<StreamChatGenerics>) => {
        const { cid } = event;
        const state = event.ai_state as AIState;
        if (channel.cid === cid) {
          setAiState(state);
        }
      },
    );

    const indicatorClearedListener = channel.on('ai_indicator.clear', (event) => {
      const { cid } = event;
      if (channel.cid === cid) {
        setAiState(AIStates.Idle);
      }
    });

    return () => {
      indicatorChangedListener.unsubscribe();
      indicatorClearedListener.unsubscribe();
    };
  }, [channel]);

  return { aiState };
};
