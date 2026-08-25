import type { AIIndicatorState, AIState, Channel } from 'stream-chat';
import { AIStates } from 'stream-chat';

import { useStateStore } from '../../../store';

const aiStateSelector = (nextValue: AIIndicatorState) => ({
  aiState: nextValue.aiState,
});

/**
 * A hook that returns the current state of the AI.
 *
 * Reads the channel's reactive `aiState` slice, which the client drives from the
 * `ai_indicator.update` / `.clear` / `.stop` events
 * @param {Channel} channel - The channel for which we want to know the AI state.
 * @returns {{ aiState: AIState }} The current AI state for the given channel.
 */
export const useAIState = (channel?: Channel): { aiState: AIState } => {
  const { aiState } = useStateStore(channel?.state, aiStateSelector) ?? {};

  return { aiState: aiState ?? AIStates.Idle };
};
