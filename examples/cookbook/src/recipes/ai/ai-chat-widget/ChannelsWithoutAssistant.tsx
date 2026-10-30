import { useEffect } from 'react';
import { ChannelPaginator } from 'stream-chat';
import type { SortParamRequest } from 'stream-chat';
import { useChatContext } from 'stream-chat-react';
import { channelFilters, visibleChannelIds } from '../../../base/client';

const sort: SortParamRequest[] = [{ direction: -1, field: 'last_message_at' }];

/**
 * Not part of the recipe: the base app's channel list without `channelId`, the assistant's channel,
 * which only the widget opens. Registered in place of the base app's paginator.
 */
export const ChannelsWithoutAssistant = ({ channelId }: { channelId: string }) => {
  const { client } = useChatContext();

  useEffect(() => {
    const paginator = new ChannelPaginator({
      client,
      filters: {
        ...channelFilters,
        id: { $in: visibleChannelIds.filter((id) => id !== channelId) },
      },
      id: 'cookbook',
      requestOptions: { presence: true, state: true },
      sort,
    });
    client.channelManager.insertPaginator({ paginator });
    return () => {
      client.channelManager.removePaginator(paginator);
    };
  }, [channelId, client]);

  return null;
};
