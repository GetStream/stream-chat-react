import { useEffect, useState } from 'react';

import { Channel, Event } from 'stream-chat';

import type { DefaultStreamChatGenerics } from '../../../types/types';

export type AIStateType =
  | 'AI_STATE_ERROR'
  | 'AI_STATE_EXTERNAL_SOURCES'
  | 'AI_STATE_GENERATING'
  | 'AI_STATE_IDLE'
  | 'AI_STATE_THINKING'
  | string;

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
  const [aiState, setAiState] = useState<AIStateType>(AIStates.Idle);

  useEffect(() => {
    if (!channel) {
      return;
    }

    const indicatorChangedListener = channel.on(
      // @ts-ignore
      'ai_indicator_changed',
      (event: Event<StreamChatGenerics>) => {
        const { cid } = event;
        const state = event.state as AIStateType;
        if (channel.cid === cid) {
          setAiState(state);
        }
      },
    );

    // @ts-ignore
    const indicatorClearedListener = channel.on('ai_indicator_clear', (event) => {
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
