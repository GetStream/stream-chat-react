import { useEffect, useState } from 'react';
import Immutable from 'seamless-immutable';
import { isPromise } from '../../../utils';
import { MAX_QUERY_CHANNELS_LIMIT } from '../utils';

export const usePaginatedChannels = (
  client,
  filters,
  sort,
  options,
  activeChannelHandler,
) => {
  const [channels, setChannels] = useState(Immutable([]));
  const [loadingChannels, setLoadingChannels] = useState(true);
  const [refreshing, setRefreshing] = useState(true);
  const [error, setError] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(true);

  const queryChannels = async (queryType) => {
    if (queryType === 'reload') {
      setLoadingChannels(true);
    }

    setRefreshing(true);

    const newOptions = {
      ...options,
    };

    if (!options.limit) newOptions.limit = MAX_QUERY_CHANNELS_LIMIT;
    const channelPromise = client.queryChannels(filters, sort, {
      ...newOptions,
      offset,
    });

    try {
      let channelQueryResponse = channelPromise;
      if (isPromise(channelQueryResponse)) {
        channelQueryResponse = await channelPromise;
      }
      const newChannels = [...channels, ...channelQueryResponse];

      setChannels(newChannels);
      setOffset(newChannels.length);
      setRefreshing(false);
      setHasNextPage(channelQueryResponse.length >= newOptions.limit);
      setLoadingChannels(false);

      // Set active channel only after first page.
      if (channels.length <= (options.limit || MAX_QUERY_CHANNELS_LIMIT)) {
        activeChannelHandler(newChannels);
      }
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
