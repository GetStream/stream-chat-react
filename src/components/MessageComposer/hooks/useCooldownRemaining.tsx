import { type CooldownTimerState } from 'stream-chat';

import { useChannel } from '../../../context';
import { useStateStore } from '../../../store';

const cooldownTimerStateSelector = (state: CooldownTimerState) => ({
  cooldownRemaining: state.cooldownRemaining,
});

/**
 * Seconds left in the channel's slow-mode cooldown.
 *
 * @returns Seconds remaining, or 0 when no cooldown is running.
 */
export const useCooldownRemaining = (): number => {
  const channel = useChannel();
  return (
    useStateStore(channel.cooldownTimer.state, cooldownTimerStateSelector)
      .cooldownRemaining ?? 0
  );
};
