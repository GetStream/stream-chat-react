import { useEffect, useMemo, useState } from 'react';

import { MAX_QUERY_CHANNELS_LIMIT } from '../utils';

import type { Channel, ChannelFilters, ChannelOptions, ChannelSort, StreamChat } from 'stream-chat';

import type {
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
} from '../../../types/types';

export const usePaginatedChannels = <
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends DefaultChannelType = DefaultChannelType,
  Co extends DefaultCommandType = DefaultCommandType,
  Ev extends DefaultEventType = DefaultEventType,
  Me extends DefaultMessageType = DefaultMessageType,
  Re extends DefaultReactionType = DefaultReactionType,
  Us extends DefaultUserType<Us> = DefaultUserType
>(
  client: StreamChat<At, Ch, Co, Ev, Me, Re, Us>,
  filters: ChannelFilters<Ch, Co, Us>,
  sort: ChannelSort<Ch>,
  options: ChannelOptions,
  activeChannelHandler: (
    channels: Array<Channel<At, Ch, Co, Ev, Me, Re, Us>>,
    setChannels: React.Dispatch<React.SetStateAction<Array<Channel<At, Ch, Co, Ev, Me, Re, Us>>>>,
  ) => void,
) => {
  const [channels, setChannels] = useState<Array<Channel<At, Ch, Co, Ev, Me, Re, Us>>>([]);
  const [error, setError] = useState(false);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [loadingChannels, setLoadingChannels] = useState(true);
  const [refreshing, setRefreshing] = useState(true);

  const filterString = useMemo(() => JSON.stringify(filters), [filters]);
  const sortString = useMemo(() => JSON.stringify(sort), [sort]);

  const queryChannels = async (queryType?: string) => {
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
