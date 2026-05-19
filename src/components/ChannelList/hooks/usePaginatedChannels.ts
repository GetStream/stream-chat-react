import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import uniqBy from 'lodash.uniqby';

import type {
  APIErrorResponse,
  Channel,
  ChannelFilters,
  ChannelOptions,
  ChannelSort,
  ErrorFromResponse,
  ParsedPredefinedFilterResponse,
  StreamChat,
} from 'stream-chat';

import { useChatContext } from '../../../context/ChatContext';
import { useTranslationContext } from '../../../context/TranslationContext';
import { useNotificationApi } from '../../Notifications';

import type { ChannelsQueryState } from '../../Chat/hooks/useChannelsQueryState';

const RECOVER_LOADED_CHANNELS_THROTTLE_INTERVAL_IN_MS = 5000;
const MIN_RECOVER_LOADED_CHANNELS_THROTTLE_INTERVAL_IN_MS = 2000;

type AllowedQueryType = Extract<
  ChannelsQueryState['queryInProgress'],
  'reload' | 'load-more'
>;

export type CustomQueryChannelParams = {
  currentChannels: Array<Channel>;
  queryType: AllowedQueryType;
  setChannels: React.Dispatch<React.SetStateAction<Array<Channel>>>;
  setHasNextPage: React.Dispatch<React.SetStateAction<boolean>>;
};

export type CustomQueryChannelsFn = (params: CustomQueryChannelParams) => Promise<void>;

/**
 * Filters and sort effectively used by the channel list. When `options.predefined_filter`
 * is set, these reflect the backend-resolved values from `predefined_filter` response
 * metadata; otherwise they fall back to the caller-supplied `filters`/`sort`.
 */
export type EffectiveQueryParams = {
  filters: ChannelFilters;
  sort: ChannelSort;
};

/**
 * The `predefined_filter` response carries sort as
 * `[{ field, direction }]`. `ChannelSort` expects `[{ field: direction }]`.
 */
const mapPredefinedFilterSortToChannelSort = (
  sort: NonNullable<ParsedPredefinedFilterResponse['sort']>,
): ChannelSort =>
  sort.map(({ direction = 1, field }) => ({
    [field]: direction,
  })) as ChannelSort;

export const usePaginatedChannels = (
  client: StreamChat,
  filters: ChannelFilters,
  sort: ChannelSort,
  options: ChannelOptions,
  activeChannelHandler: (
    channels: Array<Channel>,
    setChannels: React.Dispatch<React.SetStateAction<Array<Channel>>>,
    effectiveQueryParams: EffectiveQueryParams,
  ) => void,
  recoveryThrottleIntervalMs: number = RECOVER_LOADED_CHANNELS_THROTTLE_INTERVAL_IN_MS,
  customQueryChannels?: CustomQueryChannelsFn,
) => {
  const { addNotification } = useNotificationApi();
  const {
    channelsQueryState: { error, setError, setQueryInProgress },
  } = useChatContext('usePaginatedChannels');
  const { t } = useTranslationContext();
  const [channels, setChannels] = useState<Array<Channel>>([]);
  const [hasNextPage, setHasNextPage] = useState(true);
  // Backend-resolved filter/sort from `predefined_filter` response metadata.
  // Used to override the caller `filters`/`sort` for local WS-driven list
  // mutation decisions (archiving, pinning) when a predefined filter is in
  // use. Stays `undefined` for non-predefined queries.
  const [responseFilters, setResponseFilters] = useState<ChannelFilters | undefined>(
    undefined,
  );
  const [responseSort, setResponseSort] = useState<ChannelSort | undefined>(undefined);
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
    const offset = queryType === 'reload' ? 0 : channels.length;
    const isFirstPage = offset === 0;

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
        // `customQueryChannels` bypasses the SDK response so any previously
        // resolved predefined-filter metadata is no longer trustworthy.
        setResponseFilters(undefined);
        setResponseSort(undefined);
      } else {
        const newOptions = {
          offset,
          ...options,
        };

        const channelQueryResponse = await client.queryChannels(
          filters,
          sort || {},
          newOptions,
          { withResponse: true },
        );

        const newChannels =
          queryType === 'reload'
            ? channelQueryResponse.channels
            : uniqBy([...channels, ...channelQueryResponse.channels], 'cid');

        setChannels(newChannels);
        setHasNextPage(channelQueryResponse.channels.length >= (newOptions.limit ?? 1));

        // Pull backend-resolved filter/sort from `predefined_filter` metadata so
        // WS-driven list mutations use the effective semantics. Always reset
        // first; non-predefined queries do not return this metadata and keeping
        // stale values would silently change list behavior.
        const predefinedFilter = channelQueryResponse.predefined_filter;
        const nextResponseFilters = predefinedFilter
          ? (predefinedFilter.filter as ChannelFilters)
          : undefined;
        const nextResponseSort = predefinedFilter?.sort
          ? mapPredefinedFilterSortToChannelSort(predefinedFilter.sort)
          : undefined;

        setResponseFilters(nextResponseFilters);
        setResponseSort(nextResponseSort);

        // Set active channel only on load of first page
        if (!offset && activeChannelHandler) {
          activeChannelHandler(newChannels, setChannels, {
            filters: nextResponseFilters ?? filters,
            sort: nextResponseSort ?? sort,
          });
        }
      }
    } catch (error) {
      console.warn(error);
      addNotification({
        emitter: 'ChannelList',
        error: error instanceof Error ? error : undefined,
        message: isFirstPage
          ? t('Failed to load channels')
          : t('Failed to load more channels'),
        severity: 'error',
        targetPanels: ['channel-list'],
        type: isFirstPage
          ? 'api:channel-list:load:failed'
          : 'api:channel-list:load-more:failed',
      });

      if (isFirstPage) {
        setError(error as ErrorFromResponse<APIErrorResponse>);
      }
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

  const loadNextPage = () => queryChannels();

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

  // Effective filters/sort: response-derived values take precedence over
  // caller-supplied props when a predefined filter is in use. Falls back to
  // the caller props for non-predefined queries and during the initial load
  // before the first response.
  const effectiveFilters = responseFilters ?? filters;
  const effectiveSort = responseSort ?? sort;

  return {
    channels,
    effectiveFilters,
    effectiveSort,
    hasNextPage,
    loadNextPage,
    setChannels,
  };
};
