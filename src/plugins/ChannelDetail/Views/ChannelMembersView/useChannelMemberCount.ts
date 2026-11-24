import type { Channel, MembersState } from 'stream-chat';

import { useStateStore } from '../../../../store';

const memberCountSelector = ({ memberCount }: MembersState) => ({ memberCount });

/** Reactive channel member count, from `channel.state`. */
export const useChannelMemberCount = (channel: Channel) =>
  useStateStore(channel.state, memberCountSelector).memberCount;
