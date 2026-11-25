import { getScheduledMessageLimits, SCHEDULED_MESSAGE_STATUS } from 'stream-chat';
import type { Channel, PaginatorState, ScheduledMessageResponse } from 'stream-chat';

import { useStateStore } from '../../../store';
const isPending = ({ status }: ScheduledMessageResponse) =>
  status === SCHEDULED_MESSAGE_STATUS.Scheduled ||
  status === SCHEDULED_MESSAGE_STATUS.Sending;

const selectPendingCount = ({
  items = [],
}: PaginatorState<ScheduledMessageResponse>) => ({
  pendingCount: items.filter(isPending).length,
});

export const useChannelScheduledMessageLimit = (channel: Channel) => {
  const { pendingCount } = useStateStore(
    channel.scheduledMessages.paginator.state,
    selectPendingCount,
  );

  const maxPerChannel = getScheduledMessageLimits(channel)?.maxPerChannel;
  const reachedLimit =
    maxPerChannel !== undefined && pendingCount >= maxPerChannel
      ? maxPerChannel
      : undefined;

  const limit = { pendingCount, reachedLimit };
  return limit;
};
