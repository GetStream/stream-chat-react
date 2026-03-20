import { useChannelStateContext } from '../../../context';
import { useStateStore } from '../../../store';
import type { CooldownTimerState } from 'stream-chat';

const cooldownTimerStateSelector = (state: CooldownTimerState) => ({
  isCooldownActive: !!state.cooldownRemaining,
});

export const useIsCooldownActive = () => {
  const { channel } = useChannelStateContext();
  return useStateStore(channel.cooldownTimer.state, cooldownTimerStateSelector)
    .isCooldownActive;
};
