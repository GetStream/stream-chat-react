import { useMemo } from 'react';
import { ScheduledMessagesView } from 'stream-chat';
import type { Channel } from 'stream-chat';

export const useChannelWideScheduledMessagesView = (channel: Channel) => {
  const view = useMemo(
    () => new ScheduledMessagesView({ paginator: channel.scheduledMessagesPaginator }),
    [channel],
  );
  return view;
};
