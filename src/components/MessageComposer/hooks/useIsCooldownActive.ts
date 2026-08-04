import { useChannel } from '../../../context';
import { useStateStore } from '../../../store';
import type { CooldownTimerState } from 'stream-chat';

const cooldownTimerStateSelector = (state: CooldownTimerState) => ({
  isCooldownActive: !!state.cooldownRemaining,
});

export const useIsCooldownActive = () => {
  const channel = useChannel();
  return useStateStore(channel.cooldownTimer.state, cooldownTimerStateSelector)
    .isCooldownActive;
};
