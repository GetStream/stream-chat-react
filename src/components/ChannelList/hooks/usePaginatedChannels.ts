import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import uniqBy from 'lodash.uniqby';

import type {
  Channel,
  ChannelFilters,
  ChannelOptions,
  ChannelSort,
  StreamChat,
} from 'stream-chat';

import { useChatContext } from '../../../context/ChatContext';

import type { DefaultStreamChatGenerics } from '../../../types/types';
import type { ChannelsQueryState } from '../../Chat/hooks/useChannelsQueryState';

const RECOVER_LOADED_CHANNELS_THROTTLE_INTERVAL_IN_MS = 5000;
const MIN_RECOVER_LOADED_CHANNELS_THROTTLE_INTERVAL_IN_MS = 2000;

type AllowedQueryType = Extract<
  ChannelsQueryState['queryInProgress'],
  'reload' | 'load-more'
>;

export type CustomQueryChannelParams<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = {
  currentChannels: Array<Channel<StreamChatGenerics>>;
  queryType: AllowedQueryType;
  setChannels: React.Dispatch<React.SetStateAction<Array<Channel<StreamChatGenerics>>>>;
  setHasNextPage: React.Dispatch<React.SetStateAction<boolean>>;
};

export type CustomQueryChannelsFn<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = (params: CustomQueryChannelParams<StreamChatGenerics>) => Promise<void>;

export const usePaginatedChannels = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  client: StreamChat<StreamChatGenerics>,
  filters: ChannelFilters<StreamChatGenerics>,
  sort: ChannelSort<StreamChatGenerics>,
  options: ChannelOptions,
  activeChannelHandler: (
    channels: Array<Channel<StreamChatGenerics>>,
    setChannels: React.Dispatch<React.SetStateAction<Array<Channel<StreamChatGenerics>>>>,
  ) => void,
  recoveryThrottleIntervalMs: number = RECOVER_LOADED_CHANNELS_THROTTLE_INTERVAL_IN_MS,
  customQueryChannels?: CustomQueryChannelsFn<StreamChatGenerics>,
) => {
  const {
    channelsQueryState: { error, setError, setQueryInProgress },
  } = useChatContext('usePaginatedChannels');
  const [channels, setChannels] = useState<Array<Channel<StreamChatGenerics>>>([]);
  const [hasNextPage, setHasNextPage] = useState(true);
  const lastRecoveryTimestamp = useRef<number | undefined>(undefined);

  const recoveryThrottleInterval =
    recoveryThrottleIntervalMs < MIN_RECOVER_LOADED_CHANNELS_THROTTLE_INTERVAL_IN_MS
      ? MIN_RECOVER_LOADED_CHANNELS_THROTTLE_INTERVAL_IN_MS
      : (recoveryThrottleIntervalMs ?? RECOVER_LOADED_CHANNELS_THROTTLE_INTERVAL_IN_MS);
  // memoize props
  const filterString = useMemo(() => JSON.stringify(filters), [filters]);
  const sortString = useMemo(() => JSON.stringify(sort), [sort]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const queryChannels = async (queryType = 'load-more') => {
    setError(null);

    if (queryType === 'reload') {
      setChannels([]);
    }
    setQueryInProgress(queryType as AllowedQueryType);

    try {
      if (customQueryChannels) {
        await customQueryChannels({
          currentChannels: channels,
          queryType: queryType as AllowedQueryType,
          setChannels,
          setHasNextPage,
        });
      } else {
        const offset = queryType === 'reload' ? 0 : channels.length;

        const newOptions = {
          offset,
          ...options,
        };

        const channelQueryResponse = await client.queryChannels(
          filters,
          sort || {},
          newOptions,
        );

        const newChannels =
          queryType === 'reload'
            ? channelQueryResponse
            : uniqBy([...channels, ...channelQueryResponse], 'cid');

        setChannels(newChannels);
        setHasNextPage(channelQueryResponse.length >= (newOptions.limit ?? 1));

        // Set active channel only on load of first page
        if (!offset && activeChannelHandler) {
          activeChannelHandler(newChannels, setChannels);
        }
      }
    } catch (err) {
      console.warn(err);
      setError(err as Error);
    }

    setQueryInProgress(null);
  };

  const throttleRecover = useCallback(() => {
    const now = Date.now();
    const isFirstRecovery = !lastRecoveryTimestamp.current;
    const timeElapsedSinceLastRecoveryMs = lastRecoveryTimestamp.current
      ? now - lastRecoveryTimestamp.current
      : 0;

    if (
      !isFirstRecovery &&
      timeElapsedSinceLastRecoveryMs < recoveryThrottleInterval &&
      !error
    ) {
      return;
    }

    lastRecoveryTimestamp.current = now;
    queryChannels('reload');
  }, [error, queryChannels, recoveryThrottleInterval]);

  const loadNextPage = () => {
    queryChannels();
  };

  useEffect(() => {
    if (client.recoverStateOnReconnect) return;
    const { unsubscribe } = client.on('connection.recovered', throttleRecover);

    return () => {
      unsubscribe();
    };
  }, [client, throttleRecover]);

  useEffect(() => {
    queryChannels('reload');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterString, sortString]);

  return {
    channels,
    hasNextPage,
    loadNextPage,
    setChannels,
  };
};
