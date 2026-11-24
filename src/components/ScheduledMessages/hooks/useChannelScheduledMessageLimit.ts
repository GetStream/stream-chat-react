import { getScheduledMessageLimits } from 'stream-chat';
import type { Channel, PaginatorState, ScheduledMessageResponse } from 'stream-chat';

import { useStateStore } from '../../../store';
import { countPendingScheduledMessages, isScheduledMessageLimitReached } from '../utils';

const selectPendingCount = ({ items }: PaginatorState<ScheduledMessageResponse>) => ({
  pendingCount: countPendingScheduledMessages(items),
});

export const useChannelScheduledMessageLimit = (channel: Channel) => {
  const { pendingCount } = useStateStore(
    channel.scheduledMessages.paginator.state,
    selectPendingCount,
  );

  const maxPerChannel = getScheduledMessageLimits(channel)?.maxPerChannel;
  const reachedLimit = isScheduledMessageLimitReached(pendingCount, maxPerChannel)
    ? maxPerChannel
    : undefined;

  const limit = { pendingCount, reachedLimit };
  return limit;
};
