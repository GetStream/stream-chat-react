import { useEffect } from 'react';
import type { ChannelConfig, ChannelStateData, ScheduledMessagesView } from 'stream-chat';

import { useChatContext } from '../../../context';
import { useStateStore } from '../../../store';
import { useScheduledMessages } from './useScheduledMessages';

const selectLoadConditions = ({
  initialized,
  ownCapabilities,
}: Pick<ChannelStateData, 'initialized' | 'ownCapabilities'>) => ({
  initialized,
  ownCapabilities,
});

const selectIsEnabledByConfig = ({ scheduledMessages }: ChannelConfig) => ({
  isEnabledByConfig: scheduledMessages.enabled,
});

/**
 * The messages of a channel's scheduled-message view: `channel.scheduledMessages` or
 * `thread.scheduledMessages`. The channel query fills the channel's list; this loads it only for a
 * channel queried without it (`queryChannels` leaves it out when the page's channels hold over 100)
 * where the user can schedule messages.
 */
export const useChannelScheduledMessages = (view: ScheduledMessagesView) => {
  const { client } = useChatContext();
  const { cid } = view.paginator;
  const channel = cid ? client.channelManager.get(cid) : undefined;
  const { initialized, ownCapabilities } =
    useStateStore(channel?.state, selectLoadConditions) ?? {};
  const { isEnabledByConfig } =
    useStateStore(channel?.configState, selectIsEnabledByConfig) ?? {};

  useEffect(() => {
    if (!channel || !initialized) return;
    const paginator = channel.scheduledMessagesPaginator;
    if (paginator.hasLoadedPage || !channel.scheduledMessagesEnabled) return;
    paginator.reload().catch(() => undefined);
  }, [channel, initialized, isEnabledByConfig, ownCapabilities]);

  return useScheduledMessages(view);
};
