// @ts-check

import { useEffect, useState } from 'react';
import { MAX_QUERY_CHANNELS_LIMIT } from '../utils';
/**
 * @typedef {import('stream-chat').Channel} Channel
 * @param {import('stream-chat').StreamChat} client
 * @param {import('types').ChannelFilters} filters
 * @param {import('types').ChannelSort} [sort]
 * @param {import('types').ChannelOptions} [options]
 * @param {(channels: Channel[]) => void} [activeChannelHandler]
 */
export const usePaginatedChannels = (
  client,
  filters,
  sort,
  options,
  activeChannelHandler,
) => {
  const [channels, setChannels] = useState(/** @type {Channel[]} */ ([]));
  const [loadingChannels, setLoadingChannels] = useState(true);
  const [refreshing, setRefreshing] = useState(true);
  const [error, setError] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(true);

  /**
   * @param {string} [queryType]
   */
  const queryChannels = async (queryType) => {
    if (queryType === 'reload') {
      setLoadingChannels(true);
    }

    setRefreshing(true);

    const newOptions = {
      ...options,
      limit: options?.limit ?? MAX_QUERY_CHANNELS_LIMIT,
    };

    try {
      const channelQueryResponse = await client.queryChannels(filters, sort, {
        ...newOptions,
        offset,
      });
      const newChannels = [...channels, ...channelQueryResponse];

      setChannels(newChannels);
      setOffset(newChannels.length);
      setRefreshing(false);
      setHasNextPage(channelQueryResponse.length >= newOptions.limit);
      setLoadingChannels(false);

      // Set active channel only after first page.
      if (channels.length <= (options?.limit || MAX_QUERY_CHANNELS_LIMIT)) {
        activeChannelHandler?.(newChannels);
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
