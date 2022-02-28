import { useEffect, useMemo, useState } from 'react';

import { MAX_QUERY_CHANNELS_LIMIT } from '../utils';

import type { Channel, ChannelFilters, ChannelOptions, ChannelSort, StreamChat } from 'stream-chat';

import type { DefaultStreamChatGenerics } from '../../../types/types';

export const usePaginatedChannels = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>(
  client: StreamChat<StreamChatGenerics>,
  filters: ChannelFilters<StreamChatGenerics>,
  sort: ChannelSort<StreamChatGenerics>,
  options: ChannelOptions,
  activeChannelHandler: (
    channels: Array<Channel<StreamChatGenerics>>,
    setChannels: React.Dispatch<React.SetStateAction<Array<Channel<StreamChatGenerics>>>>,
  ) => void,
) => {
  const [channels, setChannels] = useState<Array<Channel<StreamChatGenerics>>>([]);
  const [error, setError] = useState(false);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [loadingChannels, setLoadingChannels] = useState(true);
  const [refreshing, setRefreshing] = useState(true);

  const filterString = useMemo(() => JSON.stringify(filters), [filters]);
  const sortString = useMemo(() => JSON.stringify(sort), [sort]);

  const queryChannels = async (queryType?: string) => {
    setError(false);

    if (queryType === 'reload') {
      setChannels([]);
      setLoadingChannels(true);
    }

    setRefreshing(true);

    const offset = queryType === 'reload' ? 0 : channels.length;

    const newOptions = {
      limit: options?.limit ?? MAX_QUERY_CHANNELS_LIMIT,
      offset,
      ...options,
    };

    try {
      const channelQueryResponse = await client.queryChannels(filters, sort || {}, newOptions);

      const newChannels =
        queryType === 'reload' ? channelQueryResponse : [...channels, ...channelQueryResponse];

      setChannels(newChannels);
      setHasNextPage(channelQueryResponse.length >= newOptions.limit);

      // Set active channel only on load of first page
      if (!offset && activeChannelHandler) {
        activeChannelHandler(newChannels, setChannels);
      }
    } catch (err) {
      console.warn(err);
      setError(true);
    }

    setLoadingChannels(false);
    setRefreshing(false);
  };

  const loadNextPage = () => {
    queryChannels();
  };

  useEffect(() => {
    queryChannels('reload');
  }, [filterString, sortString]);

  return {
    channels,
    hasNextPage,
    loadNextPage,
    setChannels,
    status: {
      error,
      loadingChannels,
      refreshing,
    },
  };
};
