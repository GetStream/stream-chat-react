import type { AIIndicatorState, AIState, Channel } from 'stream-chat';
import { AIStates } from 'stream-chat';

import { useStateStore } from '../../../store';

const aiStateSelector = (nextValue: AIIndicatorState) => ({
  aiState: nextValue.aiState,
});

/**
 * Returns the AI state of the channel, driven by its `ai_indicator.*` events. Falls back to
 * `AIStates.Idle` when there is no channel or no state yet.
 *
 * @param {Channel} channel - The channel for which we want to know the AI state.
 * @returns {{ aiState: AIState }} The current AI state for the given channel.
 */
export const useAIState = (channel?: Channel): { aiState: AIState } => {
  const { aiState } = useStateStore(channel?.state, aiStateSelector) ?? {};

  return { aiState: aiState ?? AIStates.Idle };
};
