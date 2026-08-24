import type { Channel, MuteStatusState } from 'stream-chat';

import { useStateStore } from '../../../store';

const muteStatusSelector = (nextValue: MuteStatusState) => ({
  muteStatus: nextValue.muteStatus,
});

/**
 * Reactively reports whether the channel is muted for the current user.
 *
 * Reads the channel's `muteStatus` state slice, which the client keeps in sync with its own
 * `mutedChannels` (on `notification.channel_mutes_updated` and `health.check`) and republishes only
 * when the status actually changes.
 */
export const useIsChannelMuted = (channel: Channel) =>
  useStateStore(channel.state, muteStatusSelector).muteStatus;
