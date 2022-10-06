import React, { useCallback, useEffect, useRef, useState } from 'react';
import clsx from 'clsx';

import { ChannelListMessenger, ChannelListMessengerProps } from './ChannelListMessenger';
import { useChannelDeletedListener } from './hooks/useChannelDeletedListener';
import { useChannelHiddenListener } from './hooks/useChannelHiddenListener';
import { useChannelTruncatedListener } from './hooks/useChannelTruncatedListener';
import { useChannelUpdatedListener } from './hooks/useChannelUpdatedListener';
import { useChannelVisibleListener } from './hooks/useChannelVisibleListener';
import { useConnectionRecoveredListener } from './hooks/useConnectionRecoveredListener';
import { useMessageNewListener } from './hooks/useMessageNewListener';
import { useMobileNavigation } from './hooks/useMobileNavigation';
import { useNotificationAddedToChannelListener } from './hooks/useNotificationAddedToChannelListener';
import { useNotificationMessageNewListener } from './hooks/useNotificationMessageNewListener';
import { useNotificationRemovedFromChannelListener } from './hooks/useNotificationRemovedFromChannelListener';
import { usePaginatedChannels } from './hooks/usePaginatedChannels';
import { useUserPresenceChangedListener } from './hooks/useUserPresenceChangedListener';
import { MAX_QUERY_CHANNELS_LIMIT, moveChannelUp } from './utils';

import { AvatarProps, Avatar as DefaultAvatar } from '../Avatar/Avatar';
import { ChannelPreview, ChannelPreviewUIComponentProps } from '../ChannelPreview/ChannelPreview';
import {
  ChannelSearchProps,
  ChannelSearch as DefaultChannelSearch,
} from '../ChannelSearch/ChannelSearch';
import { ChatDown, ChatDownProps } from '../ChatDown/ChatDown';
import {
  EmptyStateIndicator as DefaultEmptyStateIndicator,
  EmptyStateIndicatorProps,
} from '../EmptyStateIndicator';
import { LoadingChannels } from '../Loading/LoadingChannels';
import { LoadMorePaginator, LoadMorePaginatorProps } from '../LoadMore/LoadMorePaginator';

import { useChatContext } from '../../context/ChatContext';

import type { Channel, ChannelFilters, ChannelOptions, ChannelSort, Event } from 'stream-chat';

import type { DefaultStreamChatGenerics, PaginatorProps } from '../../types/types';

const DEFAULT_FILTERS = {};
const DEFAULT_OPTIONS = {};
const DEFAULT_SORT = {};

export type ChannelListProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
> = {
  /** Additional props for underlying ChannelSearch component and channel search controller, [available props](https://getstream.io/chat/docs/sdk/react/utility-components/channel_search/#props) */
  additionalChannelSearchProps?: Omit<ChannelSearchProps<StreamChatGenerics>, 'setChannels'>;
  /**
   * When the client receives `message.new`, `notification.message_new`, and `notification.added_to_channel` events, we automatically
   * push that channel to the top of the list. If the channel doesn't currently exist in the list, we grab the channel from
   * `client.activeChannels` and push it to the top of the list. You can disable this behavior by setting this prop
   * to false, which will prevent channels not in the list from incrementing the list. The default is true.
   */
  allowNewMessagesFromUnfilteredChannels?: boolean;
  /** Custom UI component to display user avatar, defaults to and accepts same props as: [Avatar](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Avatar/Avatar.tsx) */
  Avatar?: React.ComponentType<AvatarProps>;
  /** Optional function to filter channels prior to loading in the DOM. Do not use any complex or async logic that would delay the loading of the ChannelList. We recommend using a pure function with array methods like filter/sort/reduce. */
  channelRenderFilterFn?: (
    channels: Array<Channel<StreamChatGenerics>>,
  ) => Array<Channel<StreamChatGenerics>>;
  /** Custom UI component to display search results, defaults to and accepts same props as: [ChannelSearch](https://github.com/GetStream/stream-chat-react/blob/master/src/components/ChannelSearch/ChannelSearch.tsx) */
  ChannelSearch?: React.ComponentType<ChannelSearchProps<StreamChatGenerics>>;
  /** Set a channel (with this ID) to active and manually move it to the top of the list */
  customActiveChannel?: string;
  /** Custom UI component for rendering an empty list, defaults to and accepts same props as: [EmptyStateIndicator](https://github.com/GetStream/stream-chat-react/blob/master/src/components/EmptyStateIndicator/EmptyStateIndicator.tsx) */
  EmptyStateIndicator?: React.ComponentType<EmptyStateIndicatorProps>;
  /** An object containing channel query filters */
  filters?: ChannelFilters<StreamChatGenerics>;
  /** Custom UI component to display the container for the queried channels, defaults to and accepts same props as: [ChannelListMessenger](https://github.com/GetStream/stream-chat-react/blob/master/src/components/ChannelList/ChannelListMessenger.tsx) */
  List?: React.ComponentType<ChannelListMessengerProps<StreamChatGenerics>>;
  /** Custom UI component to display the loading error indicator, defaults to and accepts same props as: [ChatDown](https://github.com/GetStream/stream-chat-react/blob/master/src/components/ChatDown/ChatDown.tsx) */
  LoadingErrorIndicator?: React.ComponentType<ChatDownProps>;
  /** Custom UI component to display the loading state, defaults to and accepts same props as: [LoadingChannels](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Loading/LoadingChannels.tsx) */
  LoadingIndicator?: React.ComponentType;
  /** When true, channels won't dynamically sort by most recent message */
  lockChannelOrder?: boolean;
  /** Function to override the default behavior when a user is added to a channel, corresponds to [notification.added\_to\_channel](https://getstream.io/chat/docs/javascript/event_object/?language=javascript) event */
  onAddedToChannel?: (
    setChannels: React.Dispatch<React.SetStateAction<Array<Channel<StreamChatGenerics>>>>,
    event: Event<StreamChatGenerics>,
  ) => void;
  /** Function to override the default behavior when a channel is deleted, corresponds to [channel.deleted](https://getstream.io/chat/docs/javascript/event_object/?language=javascript) event */
  onChannelDeleted?: (
    setChannels: React.Dispatch<React.SetStateAction<Array<Channel<StreamChatGenerics>>>>,
    event: Event<StreamChatGenerics>,
  ) => void;
  /** Function to override the default behavior when a channel is hidden, corresponds to [channel.hidden](https://getstream.io/chat/docs/javascript/event_object/?language=javascript) event */
  onChannelHidden?: (
    setChannels: React.Dispatch<React.SetStateAction<Array<Channel<StreamChatGenerics>>>>,
    event: Event<StreamChatGenerics>,
  ) => void;
  /** Function to override the default behavior when a channel is truncated, corresponds to [channel.truncated](https://getstream.io/chat/docs/javascript/event_object/?language=javascript) event */
  onChannelTruncated?: (
    setChannels: React.Dispatch<React.SetStateAction<Array<Channel<StreamChatGenerics>>>>,
    event: Event<StreamChatGenerics>,
  ) => void;
  /** Function to override the default behavior when a channel is updated, corresponds to [channel.updated](https://getstream.io/chat/docs/javascript/event_object/?language=javascript) event */
  onChannelUpdated?: (
    setChannels: React.Dispatch<React.SetStateAction<Array<Channel<StreamChatGenerics>>>>,
    event: Event<StreamChatGenerics>,
  ) => void;
  /** Function to override the default channel visible behavior, corresponds to [channel.visible](https://getstream.io/chat/docs/javascript/event_object/?language=javascript) event */
  onChannelVisible?: (
    setChannels: React.Dispatch<React.SetStateAction<Array<Channel<StreamChatGenerics>>>>,
    event: Event<StreamChatGenerics>,
  ) => void;
  /** Function to override the default behavior when a message is received on a channel not being watched, corresponds to [notification.message\_new](https://getstream.io/chat/docs/javascript/event_object/?language=javascript) event */
  onMessageNew?: (
    setChannels: React.Dispatch<React.SetStateAction<Array<Channel<StreamChatGenerics>>>>,
    event: Event<StreamChatGenerics>,
  ) => void;
  /** Function to override the default behavior when a user gets removed from a channel, corresponds to [notification.removed\_from\_channel](https://getstream.io/chat/docs/javascript/event_object/?language=javascript) event */
  onRemovedFromChannel?: (
    setChannels: React.Dispatch<React.SetStateAction<Array<Channel<StreamChatGenerics>>>>,
    event: Event<StreamChatGenerics>,
  ) => void;
  /** An object containing channel query options */
  options?: ChannelOptions;
  /** Custom UI component to handle channel pagination logic, defaults to and accepts same props as: [LoadMorePaginator](https://github.com/GetStream/stream-chat-react/blob/master/src/components/LoadMore/LoadMorePaginator.tsx) */
  Paginator?: React.ComponentType<PaginatorProps | LoadMorePaginatorProps>;
  /** Custom UI component to display the channel preview in the list, defaults to and accepts same props as: [ChannelPreviewMessenger](https://github.com/GetStream/stream-chat-react/blob/master/src/components/ChannelPreview/ChannelPreviewMessenger.tsx) */
  Preview?: React.ComponentType<ChannelPreviewUIComponentProps<StreamChatGenerics>>;
  /** Function to override the default behavior when rendering channels, so this function is called instead of rendering the Preview directly */
  renderChannels?: (
    channels: Channel<StreamChatGenerics>[],
    channelPreview: (item: Channel<StreamChatGenerics>) => React.ReactNode,
  ) => React.ReactNode;
  /** If true, sends the list's currently loaded channels to the `List` component as the `loadedChannels` prop */
  sendChannelsToList?: boolean;
  /** Last channel will be set as active channel if true, defaults to true */
  setActiveChannelOnMount?: boolean;
  /** Whether or not to load the list with a search component, defaults to false */
  showChannelSearch?: boolean;
  /** An object containing channel query sort parameters */
  sort?: ChannelSort<StreamChatGenerics>;
  /** An object containing query parameters for fetching channel watchers */
  watchers?: { limit?: number; offset?: number };
};

const UnMemoizedChannelList = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>(
  props: ChannelListProps<StreamChatGenerics>,
) => {
  const {
    additionalChannelSearchProps,
    Avatar = DefaultAvatar,
    allowNewMessagesFromUnfilteredChannels,
    channelRenderFilterFn,
    ChannelSearch = DefaultChannelSearch,
    customActiveChannel,
    EmptyStateIndicator = DefaultEmptyStateIndicator,
    filters,
    LoadingErrorIndicator = ChatDown,
    LoadingIndicator = LoadingChannels,
    List = ChannelListMessenger,
    lockChannelOrder,
    onAddedToChannel,
    onChannelDeleted,
    onChannelHidden,
    onChannelTruncated,
    onChannelUpdated,
    onChannelVisible,
    onMessageNew,
    onRemovedFromChannel,
    options,
    Paginator = LoadMorePaginator,
    Preview,
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
    setActiveChannel,
    theme,
    useImageFlagEmojisOnWindows,
  } = useChatContext<StreamChatGenerics>('ChannelList');

  const channelListRef = useRef<HTMLDivElement>(null);
  const [channelUpdateCount, setChannelUpdateCount] = useState(0);
  const [searchActive, setSearchActive] = useState(false);
  /**
   * Set a channel with id {customActiveChannel} as active and move it to the top of the list.
   * If customActiveChannel prop is absent, then set the first channel in list as active channel.
   */
  const activeChannelHandler = async (
    channels: Array<Channel<StreamChatGenerics>>,
    setChannels: React.Dispatch<React.SetStateAction<Array<Channel<StreamChatGenerics>>>>,
  ) => {
    if (!channels.length || channels.length > (options?.limit || MAX_QUERY_CHANNELS_LIMIT)) {
      return;
    }

    if (customActiveChannel) {
      let customActiveChannelObject = channels.find((chan) => chan.id === customActiveChannel);

      if (!customActiveChannelObject) {
        //@ts-expect-error
        [customActiveChannelObject] = await client.queryChannels({ id: customActiveChannel });
      }

      if (customActiveChannelObject) {
        setActiveChannel(customActiveChannelObject, watchers);

        const newChannels = moveChannelUp({
          activeChannel: customActiveChannelObject,
          channels,
          cid: customActiveChannelObject.cid,
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
  const forceUpdate = () => setChannelUpdateCount((count) => count + 1);

  const onSearch = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.value) {
      setSearchActive(false);
    } else {
      setSearchActive(true);
    }
    additionalChannelSearchProps?.onSearch?.(event);
  }, []);

  const onSearchExit = useCallback(() => {
    setSearchActive(false);
    additionalChannelSearchProps?.onSearchExit?.();
  }, []);

  const { channels, hasNextPage, loadNextPage, setChannels } = usePaginatedChannels(
    client,
    filters || DEFAULT_FILTERS,
    sort || DEFAULT_SORT,
    options || DEFAULT_OPTIONS,
    activeChannelHandler,
  );

  const loadedChannels = channelRenderFilterFn ? channelRenderFilterFn(channels) : channels;

  useMobileNavigation(channelListRef, navOpen, closeMobileNav);

  useMessageNewListener(setChannels, lockChannelOrder, allowNewMessagesFromUnfilteredChannels);
  useNotificationMessageNewListener(
    setChannels,
    onMessageNew,
    allowNewMessagesFromUnfilteredChannels,
  );
  useNotificationAddedToChannelListener(
    setChannels,
    onAddedToChannel,
    allowNewMessagesFromUnfilteredChannels,
  );
  useNotificationRemovedFromChannelListener(setChannels, onRemovedFromChannel);
  useChannelDeletedListener(setChannels, onChannelDeleted);
  useChannelHiddenListener(setChannels, onChannelHidden);
  useChannelVisibleListener(setChannels, onChannelVisible);
  useChannelTruncatedListener(setChannels, onChannelTruncated, forceUpdate);
  useChannelUpdatedListener(setChannels, onChannelUpdated, forceUpdate);
  useConnectionRecoveredListener(forceUpdate);
  useUserPresenceChangedListener(setChannels);

  useEffect(() => {
    const handleEvent = (event: Event<StreamChatGenerics>) => {
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
  }, [channel?.cid]);

  const renderChannel = (item: Channel<StreamChatGenerics>) => {
    const previewProps = {
      activeChannel: channel,
      Avatar,
      channel: item,
      // forces the update of preview component on channel update
      channelUpdateCount,
      key: item.id,
      Preview,
      setActiveChannel,
      watchers,
    };

    return <ChannelPreview {...previewProps} />;
  };

  const className = clsx(
    customClasses?.chat ?? 'str-chat',
    theme,
    customClasses?.channelList ??
      'str-chat-channel-list str-chat__channel-list str-chat__channel-list-react',
    {
      'str-chat--windows-flags': useImageFlagEmojisOnWindows && navigator.userAgent.match(/Win/),
      'str-chat-channel-list--open': navOpen,
    },
  );

  const showChannelList = !searchActive || additionalChannelSearchProps?.popupResults;
  return (
    <>
      <div className={className} ref={channelListRef}>
        {showChannelSearch && (
          <ChannelSearch
            onSearch={onSearch}
            onSearchExit={onSearchExit}
            setChannels={setChannels}
            {...additionalChannelSearchProps}
          />
        )}
        {showChannelList && (
          <List
            error={channelsQueryState.error}
            loadedChannels={sendChannelsToList ? loadedChannels : undefined}
            loading={channelsQueryState.queryInProgress === 'reload'}
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
    </>
  );
};

/**
 * Renders a preview list of Channels, allowing you to select the Channel you want to open
 */
export const ChannelList = React.memo(UnMemoizedChannelList) as typeof UnMemoizedChannelList;
