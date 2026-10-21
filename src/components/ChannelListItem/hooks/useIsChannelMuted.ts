import type { Channel, MuteStatusState } from 'stream-chat';

import { useStateStore } from '../../../store';

const muteStatusSelector = (nextValue: MuteStatusState) => ({
  muteStatus: nextValue.muteStatus,
});

/**
 * Reactively returns the channel's mute status for the current user. Re-renders only when the
 * status changes, not on every client update of the muted channels.
 */
export const useIsChannelMuted = (channel: Channel) =>
  useStateStore(channel.state, muteStatusSelector).muteStatus;
