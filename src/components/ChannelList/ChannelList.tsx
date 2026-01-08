import React, { useCallback, useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import type { ReactNode } from 'react';
import type {
  Channel,
  ChannelFilters,
  ChannelOptions,
  ChannelSort,
  Event,
  SearchControllerState,
} from 'stream-chat';

import { useConnectionRecoveredListener } from './hooks/useConnectionRecoveredListener';
import { useMobileNavigation } from './hooks/useMobileNavigation';
import { usePaginatedChannels } from './hooks/usePaginatedChannels';
import {
  useChannelListShape,
  usePrepareShapeHandlers,
} from './hooks/useChannelListShape';
import { useStateStore } from '../../store';
import { ChannelListMessenger } from './ChannelListMessenger';
import { Avatar as DefaultAvatar } from '../Avatar';
import { ChannelPreview } from '../ChannelPreview/ChannelPreview';
import { ChannelSearch as DefaultChannelSearch } from '../ChannelSearch/ChannelSearch';
import { EmptyStateIndicator as DefaultEmptyStateIndicator } from '../EmptyStateIndicator';
import { LoadingChannels } from '../Loading/LoadingChannels';
import { LoadMorePaginator } from '../LoadMore/LoadMorePaginator';
import {
  ChannelListContextProvider,
  useChatContext,
  useComponentContext,
} from '../../context';
import { NullComponent } from '../UtilityComponents';
import { MAX_QUERY_CHANNELS_LIMIT, moveChannelUpwards } from './utils';
import type { CustomQueryChannelsFn } from './hooks/usePaginatedChannels';
import type { ChannelListMessengerProps } from './ChannelListMessenger';
import type { ChannelPreviewUIComponentProps } from '../ChannelPreview/ChannelPreview';
import type { ChannelSearchProps } from '../ChannelSearch/ChannelSearch';
import type { EmptyStateIndicatorProps } from '../EmptyStateIndicator';
import type { LoadMorePaginatorProps } from '../LoadMore/LoadMorePaginator';
import type { ChatContextValue } from '../../context';
import type { ChannelAvatarProps } from '../Avatar';
import type { TranslationContextValue } from '../../context/TranslationContext';
import type { PaginatorProps } from '../../types/types';
import type { LoadingErrorIndicatorProps } from '../Loading';

const DEFAULT_FILTERS = {};
const DEFAULT_OPTIONS = {};
const DEFAULT_SORT = {};

const searchControllerStateSelector = (nextValue: SearchControllerState) => ({
  searchIsActive: nextValue.isActive,
});

export type ChannelListProps = {
  /** Additional props for underlying ChannelSearch component and channel search controller, [available props](https://getstream.io/chat/docs/sdk/react/utility-components/channel_search/#props) */
  additionalChannelSearchProps?: Omit<ChannelSearchProps, 'setChannels'>;
  /**
   * When the client receives `message.new`, `notification.message_new`, and `notification.added_to_channel` events, we automatically
   * push that channel to the top of the list. If the channel doesn't currently exist in the list, we grab the channel from
   * `client.activeChannels` and push it to the top of the list. You can disable this behavior by setting this prop
   * to false, which will prevent channels not in the list from incrementing the list. The default is true.
   */
  allowNewMessagesFromUnfilteredChannels?: boolean;
  /** UI component to display an avatar, defaults to [Avatar](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Avatar/Avatar.tsx) component and accepts the same props as: [ChannelAvatar](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Avatar/ChannelAvatar.tsx) */
  Avatar?: React.ComponentType<ChannelAvatarProps>;
  /** Optional function to filter channels prior to loading in the DOM. Do not use any complex or async logic that would delay the loading of the ChannelList. We recommend using a pure function with array methods like filter/sort/reduce. */
  channelRenderFilterFn?: (channels: Array<Channel>) => Array<Channel>;
  /** Custom UI component to display search results, defaults to and accepts same props as: [ChannelSearch](https://github.com/GetStream/stream-chat-react/blob/master/src/components/ChannelSearch/ChannelSearch.tsx) */
  ChannelSearch?: React.ComponentType<ChannelSearchProps>;
  // FIXME: how is this even legal (WHY IS IT STRING?!)
  /** Set a channel (with this ID) to active and manually move it to the top of the list */
  customActiveChannel?: string;
  /** Custom function that handles the channel pagination. Has to build query filters, sort and options and query and append channels to the current channels state and update the hasNext pagination flag after each query. */
  customQueryChannels?: CustomQueryChannelsFn;
  /** Custom UI component for rendering an empty list, defaults to and accepts same props as: [EmptyStateIndicator](https://github.com/GetStream/stream-chat-react/blob/master/src/components/EmptyStateIndicator/EmptyStateIndicator.tsx) */
  EmptyStateIndicator?: React.ComponentType<EmptyStateIndicatorProps>;
  /** An object containing channel query filters */
  filters?: ChannelFilters;
  /** Custom function that generates the message preview in ChannelPreview component */
  getLatestMessagePreview?: (
    channel: Channel,
    t: TranslationContextValue['t'],
    userLanguage: TranslationContextValue['userLanguage'],
    isMessageAIGenerated?: ChatContextValue['isMessageAIGenerated'],
  ) => ReactNode;
  /** Custom UI component to display the container for the queried channels, defaults to and accepts same props as: [ChannelListMessenger](https://github.com/GetStream/stream-chat-react/blob/master/src/components/ChannelList/ChannelListMessenger.tsx) */
  List?: React.ComponentType<ChannelListMessengerProps>;
  /** Custom UI component to display the loading error indicator, defaults to component that renders null */
  LoadingErrorIndicator?: React.ComponentType<LoadingErrorIndicatorProps>;
  /** Custom UI component to display the loading state, defaults to and accepts same props as: [LoadingChannels](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Loading/LoadingChannels.tsx) */
  LoadingIndicator?: React.ComponentType;
  /** When true, channels won't dynamically sort by most recent message */
  lockChannelOrder?: boolean;
  /** Function to override the default behavior when a user is added to a channel, corresponds to [notification.added\_to\_channel](https://getstream.io/chat/docs/javascript/event_object/?language=javascript) event */
  onAddedToChannel?: (
    setChannels: React.Dispatch<React.SetStateAction<Array<Channel>>>,
    event: Event,
  ) => void;
  /** Function to override the default behavior when a channel is deleted, corresponds to [channel.deleted](https://getstream.io/chat/docs/javascript/event_object/?language=javascript) event */
  onChannelDeleted?: (
    setChannels: React.Dispatch<React.SetStateAction<Array<Channel>>>,
    event: Event,
  ) => void;
  /** Function to override the default behavior when a channel is hidden, corresponds to [channel.hidden](https://getstream.io/chat/docs/javascript/event_object/?language=javascript) event */
  onChannelHidden?: (
    setChannels: React.Dispatch<React.SetStateAction<Array<Channel>>>,
    event: Event,
  ) => void;
  /** Function to override the default behavior when a channel is truncated, corresponds to [channel.truncated](https://getstream.io/chat/docs/javascript/event_object/?language=javascript) event */
  onChannelTruncated?: (
    setChannels: React.Dispatch<React.SetStateAction<Array<Channel>>>,
    event: Event,
  ) => void;
  /** Function to override the default behavior when a channel is updated, corresponds to [channel.updated](https://getstream.io/chat/docs/javascript/event_object/?language=javascript) event */
  onChannelUpdated?: (
    setChannels: React.Dispatch<React.SetStateAction<Array<Channel>>>,
    event: Event,
  ) => void;
  /** Function to override the default channel visible behavior, corresponds to [channel.visible](https://getstream.io/chat/docs/javascript/event_object/?language=javascript) event */
  onChannelVisible?: (
    setChannels: React.Dispatch<React.SetStateAction<Array<Channel>>>,
    event: Event,
  ) => void;
  /** Function to override the default behavior when a message is received on a channel not being watched, corresponds to [notification.message\_new](https://getstream.io/chat/docs/javascript/event_object/?language=javascript) event */
  onMessageNew?: (
    setChannels: React.Dispatch<React.SetStateAction<Array<Channel>>>,
    event: Event,
  ) => void;
  /** Function to override the default behavior when a message is received on a channel being watched, handles [message.new](https://getstream.io/chat/docs/javascript/event_object/?language=javascript) event */
  onMessageNewHandler?: (
    setChannels: React.Dispatch<React.SetStateAction<Array<Channel>>>,
    event: Event,
  ) => void;
  /** Function to override the default behavior when a user gets removed from a channel, corresponds to [notification.removed\_from\_channel](https://getstream.io/chat/docs/javascript/event_object/?language=javascript) event */
  onRemovedFromChannel?: (
    setChannels: React.Dispatch<React.SetStateAction<Array<Channel>>>,
    event: Event,
  ) => void;
  /** An object containing channel query options */
  options?: ChannelOptions;
  /** Custom UI component to handle channel pagination logic, defaults to and accepts same props as: [LoadMorePaginator](https://github.com/GetStream/stream-chat-react/blob/master/src/components/LoadMore/LoadMorePaginator.tsx) */
  Paginator?: React.ComponentType<PaginatorProps | LoadMorePaginatorProps>;
  /** Custom UI component to display the channel preview in the list, defaults to and accepts same props as: [ChannelPreviewMessenger](https://github.com/GetStream/stream-chat-react/blob/master/src/components/ChannelPreview/ChannelPreviewMessenger.tsx) */
  Preview?: React.ComponentType<ChannelPreviewUIComponentProps>;
  /**
   * Custom interval during which the recovery channel list queries will be prevented.
   * This is to avoid firing unnecessary queries during internet connection fluctuation.
   * Recovery channel query is triggered upon `connection.recovered` and leads to complete channel list reload with pagination offset 0.
   * The minimum throttle interval is 2000ms. The default throttle interval is 5000ms.
   */
  recoveryThrottleIntervalMs?: number;
  /** Function to override the default behavior when rendering channels, so this function is called instead of rendering the Preview directly */
  renderChannels?: (
    channels: Channel[],
    channelPreview: (item: Channel) => React.ReactNode,
  ) => React.ReactNode;
  /** If true, sends the list's currently loaded channels to the `List` component as the `loadedChannels` prop */
  sendChannelsToList?: boolean;
  /** Last channel will be set as active channel if true, defaults to true */
  setActiveChannelOnMount?: boolean;
  /** Whether or not to load the list with a search component, defaults to false */
  showChannelSearch?: boolean;
  /** An object containing channel query sort parameters */
  sort?: ChannelSort;
  /** An object containing query parameters for fetching channel watchers */
  watchers?: { limit?: number; offset?: number };
};

const UnMemoizedChannelList = (props: ChannelListProps) => {
  const {
    additionalChannelSearchProps,
    allowNewMessagesFromUnfilteredChannels = true,
    Avatar = DefaultAvatar,
    channelRenderFilterFn,
    ChannelSearch = DefaultChannelSearch,
    customActiveChannel,
    customQueryChannels,
    EmptyStateIndicator = DefaultEmptyStateIndicator,
    filters = {},
    getLatestMessagePreview,
    List = ChannelListMessenger,
    LoadingErrorIndicator = NullComponent,
    LoadingIndicator = LoadingChannels,
    lockChannelOrder = false,
    onAddedToChannel,
    onChannelDeleted,
    onChannelHidden,
    onChannelTruncated,
    onChannelUpdated,
    onChannelVisible,
    onMessageNew,
    onMessageNewHandler,
    onRemovedFromChannel,
    options,
    Paginator = LoadMorePaginator,
    Preview,
    recoveryThrottleIntervalMs,
    renderChannels,
    sendChannelsToList = false,
    setActiveChannelOnMount = true,
    showChannelSearch = false,
    sort = DEFAULT_SORT,
    watchers = {},
  } = props;

  const {
    channel,
    channelsQueryState,
    client,
    closeMobileNav,
    customClasses,
    navOpen = false,
    searchController,
    setActiveChannel,
    theme,
    useImageFlagEmojisOnWindows,
  } = useChatContext('ChannelList');
  const { Search } = useComponentContext(); // FIXME: us component context to retrieve ChannelPreview UI components too
  const channelListRef = useRef<HTMLDivElement | null>(null);
  const [channelUpdateCount, setChannelUpdateCount] = useState(0);
  const [searchActive, setSearchActive] = useState(false);

  // Indicator relevant when Search component that relies on SearchController is used
  const { searchIsActive } = useStateStore(
    searchController.state,
    searchControllerStateSelector,
  );
  /**
   * Set a channel with id {customActiveChannel} as active and move it to the top of the list.
   * If customActiveChannel prop is absent, then set the first channel in list as active channel.
   */
  const activeChannelHandler = async (
    channels: Array<Channel>,
    setChannels: React.Dispatch<React.SetStateAction<Array<Channel>>>,
  ) => {
    if (
      !channels.length ||
      channels.length > (options?.limit || MAX_QUERY_CHANNELS_LIMIT)
    ) {
      return;
    }

    if (customActiveChannel) {
      // FIXME: this is wrong...
      let customActiveChannelObject = channels.find(
        (chan) => chan.id === customActiveChannel,
      );

      if (!customActiveChannelObject) {
        [customActiveChannelObject] = await client.queryChannels({
          id: customActiveChannel,
        });
      }

      if (customActiveChannelObject) {
        setActiveChannel(customActiveChannelObject, watchers);

        const newChannels = moveChannelUpwards({
          channels,
          channelToMove: customActiveChannelObject,
          sort,
        });

        setChannels(newChannels);
      }

      return;
    }

    if (setActiveChannelOnMount) {
      setActiveChannel(channels[0], watchers);
    }
  };

  /**
   * For some events, inner properties on the channel will update but the shallow comparison will not
   * force a re-render. Incrementing this dummy variable ensures the channel previews update.
   */
  const forceUpdate = useCallback(() => setChannelUpdateCount((count) => count + 1), []);

  const onSearch = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setSearchActive(!!event.target.value);

      additionalChannelSearchProps?.onSearch?.(event);
    },
    [additionalChannelSearchProps],
  );

  const onSearchExit = useCallback(() => {
    setSearchActive(false);
    additionalChannelSearchProps?.onSearchExit?.();
  }, [additionalChannelSearchProps]);

  const { channels, hasNextPage, loadNextPage, setChannels } = usePaginatedChannels(
    client,
    filters || DEFAULT_FILTERS,
    sort || DEFAULT_SORT,
    options || DEFAULT_OPTIONS,
    activeChannelHandler,
    recoveryThrottleIntervalMs,
    customQueryChannels,
  );

  const loadedChannels = channelRenderFilterFn
    ? channelRenderFilterFn(channels)
    : channels;

  useMobileNavigation(channelListRef, navOpen, closeMobileNav);

  const { customHandler, defaultHandler } = usePrepareShapeHandlers({
    allowNewMessagesFromUnfilteredChannels,
    filters,
    lockChannelOrder,
    onAddedToChannel,
    onChannelDeleted,
    onChannelHidden,
    onChannelTruncated,
    onChannelUpdated,
    onChannelVisible,
    onMessageNew,
    onMessageNewHandler,
    onRemovedFromChannel,
    setChannels,
    sort,
    // TODO: implement
    // customHandleChannelListShape
  });

  useChannelListShape(customHandler ?? defaultHandler);

  // TODO: maybe move this too
  useConnectionRecoveredListener(forceUpdate);

  useEffect(() => {
    const handleEvent = (event: Event) => {
      if (event.cid === channel?.cid) {
        setActiveChannel();
      }
    };

    client.on('channel.deleted', handleEvent);
    client.on('channel.hidden', handleEvent);

    return () => {
      client.off('channel.deleted', handleEvent);
      client.off('channel.hidden', handleEvent);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channel?.cid]);

  const renderChannel = (item: Channel) => {
    const previewProps = {
      activeChannel: channel,
      Avatar,
      channel: item,
      // forces the update of preview component on channel update
      channelUpdateCount,
      getLatestMessagePreview,
      Preview,
      setActiveChannel,
      watchers,
    };

    return <ChannelPreview key={item.cid} {...previewProps} />;
  };

  const baseClass = 'str-chat__channel-list';
  const className = clsx(
    customClasses?.chat ?? 'str-chat',
    theme,
    customClasses?.channelList ?? `${baseClass} ${baseClass}-react`,
    {
      'str-chat--windows-flags':
        useImageFlagEmojisOnWindows && navigator.userAgent.match(/Win/),
      [`${baseClass}--open`]: navOpen,
    },
  );

  const showChannelList =
    (!searchActive && !searchIsActive) || additionalChannelSearchProps?.popupResults;
  return (
    <ChannelListContextProvider
      value={{ channels, hasNextPage, loadNextPage, setChannels }}
    >
      <div className={className} ref={channelListRef}>
        {showChannelSearch &&
          (Search ? (
            <Search
              directMessagingChannelType={additionalChannelSearchProps?.channelType}
              disabled={additionalChannelSearchProps?.disabled}
              exitSearchOnInputBlur={
                additionalChannelSearchProps?.clearSearchOnClickOutside
              }
              placeholder={additionalChannelSearchProps?.placeholder}
            />
          ) : (
            <ChannelSearch
              onSearch={onSearch}
              onSearchExit={onSearchExit}
              setChannels={setChannels}
              {...additionalChannelSearchProps}
            />
          ))}
        {showChannelList && (
          <List
            error={channelsQueryState.error}
            loadedChannels={sendChannelsToList ? loadedChannels : undefined}
            loading={
              !!channelsQueryState.queryInProgress &&
              ['reload', 'uninitialized'].includes(channelsQueryState.queryInProgress)
            }
            LoadingErrorIndicator={LoadingErrorIndicator}
            LoadingIndicator={LoadingIndicator}
            setChannels={setChannels}
          >
            {!loadedChannels?.length ? (
              <EmptyStateIndicator listType='channel' />
            ) : (
              <Paginator
                hasNextPage={hasNextPage}
                isLoading={channelsQueryState.queryInProgress === 'load-more'}
                loadNextPage={loadNextPage}
              >
                {renderChannels
                  ? renderChannels(loadedChannels, renderChannel)
                  : loadedChannels.map((channel) => renderChannel(channel))}
              </Paginator>
            )}
          </List>
        )}
      </div>
    </ChannelListContextProvider>
  );
};

/**
 * Renders a preview list of Channels, allowing you to select the Channel you want to open
 */
export const ChannelList = React.memo(
  UnMemoizedChannelList,
) as typeof UnMemoizedChannelList;
