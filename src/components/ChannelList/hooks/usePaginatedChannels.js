// @ts-check

import { useEffect, useState } from 'react';
import { MAX_QUERY_CHANNELS_LIMIT } from '../utils';
/**
 * @typedef {import('stream-chat').Channel} Channel
 * @param {import('types').StreamChatReactClient} client
 * @param {import('stream-chat').ChannelFilters} filters
 * @param {import('stream-chat').ChannelSort} [sort]
 * @param {import('stream-chat').ChannelOptions} [options]
 * @param {(channels: Channel[], setChannels: React.Dispatch<React.SetStateAction<Channel[]>>) => void} [activeChannelHandler]
 */
export const usePaginatedChannels = (
  client,
  filters,
  sort,
  options,
  activeChannelHandler,
  searchStr,
) => {
  const [channels, setChannels] = useState(/** @type {Channel[]} */ ([]));
  const [loadingChannels, setLoadingChannels] = useState(true);
  const [refreshing, setRefreshing] = useState(true);
  const [offset, setOffset] = useState(0);
  const [error, setError] = useState(false);
  const [hasNextPage, setHasNextPage] = useState(true);

  /**
   * @param {string} [queryType]
   */
  const queryChannels = async (queryType) => {
    if (queryType === 'reload') {
      setChannels([]);
      setLoadingChannels(true);
    }

    setRefreshing(true);

    const newOptions = {
      offset: queryType === 'reload' ? 0 : offset,
      ...options,
      limit: options?.limit ?? MAX_QUERY_CHANNELS_LIMIT,
    };

    try {
      const channelQueryResponse = await client.queryChannels(
        filters,
        sort || {},
        newOptions,
      );

      let newChannels;
      if (queryType === 'reload') {
        newChannels = channelQueryResponse;
      } else {
        newChannels = [...channels, ...channelQueryResponse];
      }

      // TODO: make this more abstract
      if (searchStr.length > 2) {
        newChannels = newChannels.filter(
          ({ data: { name, orderId, phone } }) =>
            name?.toLowerCase().includes(searchStr.toLowerCase()) ||
            orderId?.toLowerCase().includes(searchStr.toLowerCase()) ||
            phone?.replace(/\D/g, '').includes(searchStr.replace(/\W/g, '')),
        );
      }

      setChannels(newChannels);
      setHasNextPage(channelQueryResponse.length >= newOptions.limit);
      // Set active channel only after first page.
      if (offset === 0 && activeChannelHandler) {
        activeChannelHandler(newChannels, setChannels);
      }

      setOffset(newChannels.length);
    } catch (e) {
      console.warn(e);
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
