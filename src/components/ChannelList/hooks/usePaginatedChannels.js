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
  const [offset, setOffset] = useState(0);
  const [error, setError] = useState(false);
  const [hasNextPage, setHasNextPage] = useState(true);
  const queryChannels = async (queryType) => {
    if (queryType === 'reload') {
      setChannels([]);
      setLoadingChannels(true);
    }

    setRefreshing(true);

    const newOptions = {
      limit: MAX_QUERY_CHANNELS_LIMIT,
      offset: queryType === 'reload' ? 0 : offset,
      ...options,
    };

    try {
      const channelQueryResponse = await client.queryChannels(
        filters,
        sort,
        newOptions,
      );

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
      if (offset === 0) {
        activeChannelHandler(newChannels);
      }

      setOffset(newChannels.length);
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
