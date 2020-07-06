import { useEffect, useState } from 'react';
import { MAX_QUERY_CHANNELS_LIMIT } from '../utils';

export const usePaginatedChannels = (
  client,
  filters,
  sort,
  options,
  activeChannelHandler,
) => {
  const [channels, setChannels] = useState([]);
  const [loadingChannels, setLoadingChannels] = useState(true);
  const [refreshing, setRefreshing] = useState(true);
  const [error, setError] = useState(false);
  const [hasNextPage, setHasNextPage] = useState(true);
  let currentOffset = 0;

  const queryChannels = async (queryType) => {
    if (queryType === 'reload') {
      currentOffset = 0;
      setChannels([]);
      setLoadingChannels(true);
    }

    setRefreshing(true);

    const newOptions = {
      limit: MAX_QUERY_CHANNELS_LIMIT,
      ...options,
    };

    try {
      const channelQueryResponse = await client.queryChannels(filters, sort, {
        ...newOptions,
        offset: currentOffset,
      });

      let newChannels;
      if (queryType === 'reload') {
        newChannels = channelQueryResponse;
      } else {
        newChannels = [...channels, ...channelQueryResponse];
      }

      setChannels(newChannels);
      setRefreshing(false);
      setHasNextPage(channelQueryResponse.length >= newOptions.limit);
      setLoadingChannels(false);

      // Set active channel only after first page.
      if (currentOffset === 0) {
        activeChannelHandler(newChannels);
      }

      currentOffset = newChannels.length;
    } catch (e) {
      console.warn(e);
      setError(true);
      setRefreshing(false);
    }
  };

  const loadNextPage = () => {
    queryChannels();
  };

  useEffect(() => {
    queryChannels('reload');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  return {
    channels,
    loadNextPage,
    hasNextPage,
    status: {
      loadingChannels,
      refreshing,
      error,
    },
    setChannels,
  };
};
