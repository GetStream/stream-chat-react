import { type CooldownTimerState } from 'stream-chat';

import { useChannelStateContext } from '../../../context';
import { useStateStore } from '../../../store';

const cooldownTimerStateSelector = (state: CooldownTimerState) => ({
  cooldownRemaining: state.cooldownRemaining,
});

/**
 * Provides and initial value of cooldown, from which the countdown should start, e.g.:
 *
 * The value of channel.data.cooldown is 100s but 30s has already elapsed, user reloads the page,
 * the initial value is now 70s from which the countdown will continue using useTimer() hook.
 */
export const useCooldownRemaining = (): number => {
  const { channel } = useChannelStateContext();
  return (
    useStateStore(channel.cooldownTimer.state, cooldownTimerStateSelector)
      .cooldownRemaining ?? 0
  );
};
