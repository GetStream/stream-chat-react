import React, { useEffect, useRef, useState } from 'react';

import { ChannelListTeam, ChannelListTeamProps } from './ChannelListTeam';
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
import {
  ChannelPreview,
  ChannelPreviewUIComponentProps,
} from '../ChannelPreview/ChannelPreview';
import { ChannelPreviewLastMessage } from '../ChannelPreview/ChannelPreviewLastMessage';
import { ChatDown, ChatDownProps } from '../ChatDown/ChatDown';
import {
  EmptyStateIndicator as DefaultEmptyStateIndicator,
  EmptyStateIndicatorProps,
} from '../EmptyStateIndicator';
import { LoadingChannels } from '../Loading/LoadingChannels';
import {
  LoadMorePaginator,
  LoadMorePaginatorProps,
} from '../LoadMore/LoadMorePaginator';

import { useChatContext } from '../../context/ChatContext';

import type {
  Channel,
  ChannelFilters,
  ChannelOptions,
  ChannelSort,
  Event,
} from 'stream-chat';

import type { InfiniteScrollPaginatorProps } from '../InfiniteScrollPaginator/InfiniteScrollPaginator';

import type {
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
} from '../../../types/types';

const DEFAULT_FILTERS = {};
const DEFAULT_OPTIONS = {};
const DEFAULT_SORT = {};

export type ChannelListProps<
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends DefaultChannelType = DefaultChannelType,
  Co extends DefaultCommandType = DefaultCommandType,
  Ev extends DefaultEventType = DefaultEventType,
  Me extends DefaultMessageType = DefaultMessageType,
  Re extends DefaultReactionType = DefaultReactionType,
  Us extends DefaultUserType<Us> = DefaultUserType
> = {
  /**
   * When client receives an event `message.new`, we push that channel to top of the list.
   *
   * But If the channel doesn't exist in the list, then we get the channel from client
   * (client maintains list of watched channels as `client.activeChannels`) and push
   * that channel to top of the list by default. You can disallow this behavior by setting following
   * prop to false. This is quite useful where you have multiple tab structure and you don't want
   * ChannelList in Tab1 to react to new message on some channel in Tab2.
   *
   * Default value is true.
   */
  allowNewMessagesFromUnfilteredChannels?: boolean;
  /**
   * Custom UI component to display user avatar
   *
   * Defaults to and accepts same props as: [Avatar](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Avatar/Avatar.tsx)
   */
  Avatar?: React.ComponentType<AvatarProps>;
  /**
   * Optional function to filter channels prior to loading in the DOM. Do not use any complex or async logic here that would significantly delay the loading of the ChannelList.
   * We recommend using a pure function with array methods like filter/sort/reduce.
   */
  channelRenderFilterFn?: (
    channels: Array<Channel<At, Ch, Co, Ev, Me, Re, Us>>,
  ) => Array<Channel<At, Ch, Co, Ev, Me, Re, Us>>;
  /**
   * Set a Channel (of this id) to be active and move it to the top of the list of channels by ID
   */
  customActiveChannel?: string;
  /** Indicator for Empty State */
  EmptyStateIndicator?: React.ComponentType<EmptyStateIndicatorProps>;
  /** Object containing query filters */
  filters?: ChannelFilters<Ch, Co, Us>;
  /**
   * Custom UI Component for container of list of channels. Note that, list (UI component) of channels is passed
   * to this component as children. This component is for the purpose of adding header to channel list or styling container
   * for list of channels.
   *
   * Available built-in options (also accepts the same props as):
   *
   * 1. [ChannelListTeam](https://github.com/GetStream/stream-chat-react/blob/master/src/components/ChannelList/ChannelListTeam.tsx) (default)
   * 2. [ChannelListMessenger](https://github.com/GetStream/stream-chat-react/blob/master/src/components/ChannelList/ChannelListMessenger.tsx)
   *
   * It has access to some additional props:
   *
   * - `setActiveChannel` {function} Check [ChatContext](https://getstream.github.io/stream-chat-react/#section-chatcontext)
   * - `activeChannel` Currently active channel object
   * - `channels` {array} List of channels in channel list
   */
  List?: React.ComponentType<ChannelListTeamProps>;
  /**
   * Error indicator UI Component. It will be displayed if there is any error if loading the channels.
   * This error could be related to network or failing API.
   *
   * Defaults to and accepts same props as:
   * [ChatDown](https://github.com/GetStream/stream-chat-react/blob/master/src/components/ChatDown/ChatDown.tsx)
   *
   */
  LoadingErrorIndicator?: React.ComponentType<ChatDownProps>;
  /**
   * Loading indicator UI Component. It will be displayed until the channels are
   * being queried from API. Once the channels are loaded/queried, loading indicator is removed
   * and replaced with children of the Channel component.
   *
   * Defaults to and accepts same props as:
   * [LoadingChannels](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Loading/LoadingChannels.tsx)
   *
   */
  LoadingIndicator?: React.ComponentType;
  /**
   * If true, channels won't be dynamically sorted by most recent message
   */
  lockChannelOrder?: boolean;
  /** Function that overrides default behavior when users gets added to a channel */
  onAddedToChannel?: (
    setChannels: React.Dispatch<
      React.SetStateAction<Array<Channel<At, Ch, Co, Ev, Me, Re, Us>>>
    >,
    event: Event<At, Ch, Co, Ev, Me, Re, Us>,
  ) => void;
  /** Function that overrides default behavior when channel gets deleted. In absence of this prop, channel will be removed from the list */
  onChannelDeleted?: (
    setChannels: React.Dispatch<
      React.SetStateAction<Array<Channel<At, Ch, Co, Ev, Me, Re, Us>>>
    >,
    event: Event<At, Ch, Co, Ev, Me, Re, Us>,
  ) => void;
  /** Function that overrides default behavior when channel gets hidden */
  onChannelHidden?: (
    setChannels: React.Dispatch<
      React.SetStateAction<Array<Channel<At, Ch, Co, Ev, Me, Re, Us>>>
    >,
    event: Event<At, Ch, Co, Ev, Me, Re, Us>,
  ) => void;
  /** Function to customize behavior when channel gets truncated */
  onChannelTruncated?: (
    setChannels: React.Dispatch<
      React.SetStateAction<Array<Channel<At, Ch, Co, Ev, Me, Re, Us>>>
    >,
    event: Event<At, Ch, Co, Ev, Me, Re, Us>,
  ) => void;
  /** Function that overrides default behavior when channel gets updated */
  onChannelUpdated?: (
    setChannels: React.Dispatch<
      React.SetStateAction<Array<Channel<At, Ch, Co, Ev, Me, Re, Us>>>
    >,
    event: Event<At, Ch, Co, Ev, Me, Re, Us>,
  ) => void;
  /** Function that overrides default behavior when channel becomes visible */
  onChannelVisible?: (
    setChannels: React.Dispatch<
      React.SetStateAction<Array<Channel<At, Ch, Co, Ev, Me, Re, Us>>>
    >,
    event: Event<At, Ch, Co, Ev, Me, Re, Us>,
  ) => void;
  /** Function that overrides default behavior when new message is received on channel that is not being watched */
  onMessageNew?: (
    setChannels: React.Dispatch<
      React.SetStateAction<Array<Channel<At, Ch, Co, Ev, Me, Re, Us>>>
    >,
    event: Event<At, Ch, Co, Ev, Me, Re, Us>,
  ) => void;
  /** Function that overrides default behavior when users gets removed from a channel */
  onRemovedFromChannel?: (
    setChannels: React.Dispatch<
      React.SetStateAction<Array<Channel<At, Ch, Co, Ev, Me, Re, Us>>>
    >,
    event: Event<At, Ch, Co, Ev, Me, Re, Us>,
  ) => void;
  /** Object containing query options */
  options?: ChannelOptions;
  /**
   * Paginator component for channels. It contains all the pagination logic such as
   * - fetching next page of results when needed e.g., when scroll reaches the end of list
   * - UI to display loading indicator when next page is being loaded
   * - call to action button to trigger loading of next page.
   *
   * Available built-in options (also accepts the same props as):
   *
   * 1. [LoadMorePaginator](https://github.com/GetStream/stream-chat-react/blob/master/src/components/LoadMore/LoadMorePaginator.tsx)
   * 2. [InfiniteScrollPaginator](https://github.com/GetStream/stream-chat-react/blob/master/src/components/InfiniteScrollPaginator/InfiniteScrollPaginator.tsx)
   */
  Paginator?: React.ComponentType<
    InfiniteScrollPaginatorProps | LoadMorePaginatorProps
  >;
  /**
   * Available built-in options (also accepts the same props as):
   *
   * 1. [ChannelPreviewCompact](https://getstream.github.io/stream-chat-react/#ChannelPreviewCompact) (default)
   * 2. [ChannelPreviewLastMessage](https://getstream.github.io/stream-chat-react/#ChannelPreviewLastMessage)
   * 3. [ChannelPreviewMessenger](https://getstream.github.io/stream-chat-react/#ChannelPreviewMessanger)
   *
   * The Preview to use, defaults to ChannelPreviewLastMessage
   */
  Preview?: React.ComponentType<
    ChannelPreviewUIComponentProps<At, Ch, Co, Ev, Me, Re, Us>
  >;
  /** Last channel will be set as active channel if true, defaults to true */
  setActiveChannelOnMount?: boolean;
  showSidebar?: boolean;
  /** Object containing sort parameters */
  sort?: ChannelSort<Ch>;
  /** Object containing watcher parameters */
  watchers?: { limit?: number; offset?: number };
};

const UnMemoizedChannelList = <
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends DefaultChannelType = DefaultChannelType,
  Co extends DefaultCommandType = DefaultCommandType,
  Ev extends DefaultEventType = DefaultEventType,
  Me extends DefaultMessageType = DefaultMessageType,
  Re extends DefaultReactionType = DefaultReactionType,
  Us extends DefaultUserType<Us> = DefaultUserType
>(
  props: ChannelListProps<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const {
    Avatar = DefaultAvatar,
    allowNewMessagesFromUnfilteredChannels,
    channelRenderFilterFn,
    customActiveChannel,
    EmptyStateIndicator = DefaultEmptyStateIndicator,
    filters,
    LoadingErrorIndicator = ChatDown,
    LoadingIndicator = LoadingChannels,
    List = ChannelListTeam,
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
    Preview = ChannelPreviewLastMessage,
    setActiveChannelOnMount = true,
    showSidebar,
    sort = DEFAULT_SORT,
    watchers = {},
  } = props;

  const {
    channel,
    client,
    closeMobileNav,
    navOpen = false,
    setActiveChannel,
    theme,
  } = useChatContext<At, Ch, Co, Ev, Me, Re, Us>();

  const channelListRef = useRef<HTMLDivElement>(null);
  const [channelUpdateCount, setChannelUpdateCount] = useState(0);

  /**
   * Set a channel with id {customActiveChannel} as active and move it to the top of the list.
   * If customActiveChannel prop is absent, then set the first channel in list as active channel.
   */
  const activeChannelHandler = (
    channels: Array<Channel<At, Ch, Co, Ev, Me, Re, Us>>,
    setChannels: React.Dispatch<
      React.SetStateAction<Array<Channel<At, Ch, Co, Ev, Me, Re, Us>>>
    >,
  ) => {
    if (
      !channels ||
      channels.length === 0 ||
      channels.length > (options?.limit || MAX_QUERY_CHANNELS_LIMIT)
    ) {
      return;
    }

    if (customActiveChannel) {
      const customActiveChannelObject = channels.find(
        (chan) => chan.id === customActiveChannel,
      );
      if (customActiveChannelObject) {
        if (setActiveChannel) {
          setActiveChannel(customActiveChannelObject, watchers);
        }
        const newChannels = moveChannelUp(
          customActiveChannelObject.cid,
          channels,
        );
        setChannels(newChannels);
      }

      return;
    }

    if (setActiveChannelOnMount && setActiveChannel) {
      setActiveChannel(channels[0], watchers);
    }
  };

  // When channel list (channels array) is updated without any shallow changes (or with only deep changes), then we want
  // to force the channel preview to re-render.
  // This happens in case of event channel.updated, channel.truncated etc. Inner properties of channel is updated but
  // react renderer will only make shallow comparison and choose to not to re-render the UI.
  // By updating the dummy prop - channelUpdateCount, we can force this re-render.
  const forceUpdate = () => setChannelUpdateCount((count) => count + 1);

  const {
    channels,
    hasNextPage,
    loadNextPage,
    setChannels,
    status,
  } = usePaginatedChannels(
    client,
    filters || DEFAULT_FILTERS,
    sort || DEFAULT_SORT,
    options || DEFAULT_OPTIONS,
    activeChannelHandler,
  );

  const loadedChannels = channelRenderFilterFn
    ? channelRenderFilterFn(channels)
    : channels;

  useMobileNavigation(channelListRef, navOpen, closeMobileNav);

  useMessageNewListener(
    setChannels,
    lockChannelOrder,
    allowNewMessagesFromUnfilteredChannels,
  );
  useNotificationMessageNewListener(setChannels, onMessageNew);
  useNotificationAddedToChannelListener(setChannels, onAddedToChannel);
  useNotificationRemovedFromChannelListener(setChannels, onRemovedFromChannel);
  useChannelDeletedListener(setChannels, onChannelDeleted);
  useChannelHiddenListener(setChannels, onChannelHidden);
  useChannelVisibleListener(setChannels, onChannelVisible);
  useChannelTruncatedListener(setChannels, onChannelTruncated, forceUpdate);
  useChannelUpdatedListener(setChannels, onChannelUpdated, forceUpdate);
  useConnectionRecoveredListener(forceUpdate);
  useUserPresenceChangedListener(setChannels);

  useEffect(() => {
    const handleEvent = (event: Event<At, Ch, Co, Ev, Me, Re, Us>) => {
      if (setActiveChannel && event?.cid === channel?.cid) {
        setActiveChannel();
      }
    };

    client.on('channel.deleted', handleEvent);
    client.on('channel.hidden', handleEvent);

    return () => {
      client.off('channel.deleted', handleEvent);
      client.off('channel.hidden', handleEvent);
    };
  }, [channel]);

  const renderChannel = (item: Channel<At, Ch, Co, Ev, Me, Re, Us>) => {
    if (!item) return null;

    const previewProps = {
      activeChannel: channel,
      Avatar,
      channel: item,
      channelUpdateCount, // forces the update of preview component on channel update
      key: item.id,
      Preview,
      setActiveChannel,
      watchers,
    };

    return <ChannelPreview {...previewProps} />;
  };

  const renderList = () => (
    <List
      Avatar={Avatar}
      error={status.error}
      loading={status.loadingChannels}
      LoadingErrorIndicator={LoadingErrorIndicator}
      LoadingIndicator={LoadingIndicator}
      showSidebar={showSidebar}
    >
      {!loadedChannels || loadedChannels.length === 0 ? (
        <EmptyStateIndicator listType='channel' />
      ) : (
        <Paginator
          hasNextPage={hasNextPage}
          loadNextPage={loadNextPage}
          refreshing={status.refreshing}
        >
          {loadedChannels.map(renderChannel)}
        </Paginator>
      )}
    </List>
  );

  return (
    <>
      <div
        className={`str-chat str-chat-channel-list ${theme} ${
          navOpen ? 'str-chat-channel-list--open' : ''
        }`}
        ref={channelListRef}
      >
        {renderList()}
      </div>
    </>
  );
};

/**
 * ChannelList - A preview list of Channels, allowing you to select the Channel you want to open.
 * @example ./ChannelList.md
 */
export const ChannelList = React.memo(
  UnMemoizedChannelList,
) as typeof UnMemoizedChannelList;
