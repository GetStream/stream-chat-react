import type { Channel, ChannelWatchState, UserResponse } from 'stream-chat';

import { useStateStore } from '../../../store';
import { isUserOnline } from './onlineMembers';

const watchersSelector = ({ watchers }: ChannelWatchState) => ({ watchers });

/** Whether `user` is online in `channel` (see `isUserOnline`), following its watchers. */
export const useIsUserOnline = (
  channel: Channel,
  user: UserResponse | null | undefined,
) => {
  const { watchers } = useStateStore(channel.state, watchersSelector);
  return isUserOnline(user, watchers);
};
