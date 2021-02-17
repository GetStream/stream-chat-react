import { useEffect, useState } from 'react';

import { MAX_QUERY_CHANNELS_LIMIT } from '../utils';

import type {
  Channel,
  ChannelFilters,
  ChannelOptions,
  ChannelSort,
  StreamChat,
} from 'stream-chat';

import type {
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
  UnknownType,
} from '../../../../types/types';

export const usePaginatedChannels = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>(
  client: StreamChat<At, Ch, Co, Ev, Me, Re, Us>,
  filters: ChannelFilters<Ch, Co, Us>,
  sort: ChannelSort<Ch>,
  options: ChannelOptions,
  activeChannelHandler: (
    channels: Array<Channel<At, Ch, Co, Ev, Me, Re, Us>>,
    setChannels: React.Dispatch<
      React.SetStateAction<Array<Channel<At, Ch, Co, Ev, Me, Re, Us>>>
    >,
  ) => void,
) => {
  const [channels, setChannels] = useState<
    Array<Channel<At, Ch, Co, Ev, Me, Re, Us>>
  >([]);
  const [error, setError] = useState(false);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [loadingChannels, setLoadingChannels] = useState(true);
  const [offset, setOffset] = useState(0);
  const [refreshing, setRefreshing] = useState(true);

  const queryChannels = async (queryType?: string) => {
    if (queryType === 'reload') {
      setChannels([]);
      setLoadingChannels(true);
    }

    setRefreshing(true);

    const newOptions = {
      limit: options?.limit ?? MAX_QUERY_CHANNELS_LIMIT,
      offset: queryType === 'reload' ? 0 : offset,
      ...options,
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

      setChannels(newChannels);
      setHasNextPage(channelQueryResponse.length >= newOptions.limit);
      // Set active channel only after first page.
      if (offset === 0 && activeChannelHandler) {
        activeChannelHandler(newChannels, setChannels);
      }

      setOffset(newChannels.length);
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
  }, [filters]);

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
