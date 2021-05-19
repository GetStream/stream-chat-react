import React, { useEffect, useRef, useState } from 'react';

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

import type { InfiniteScrollPaginatorProps } from '../InfiniteScrollPaginator/InfiniteScrollPaginator';

import type {
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
} from '../../types/types';

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
  /** Additional props for underlying ChannelSearch component, [Available props](https://getstream.github.io/stream-chat-react/#channelsearch) */
  additionalChannelSearchProps?: ChannelSearchProps<Us>;
  /**
   * When the client receives a `message.new` event, we automatically push that channel to the top of the list.
   * If the channel doesn't currently exist in the list, we grab the channel from `client.activeChannels`
   * and push it to the top of the list by default. You can disable this behavior by setting this props
   * to false, which will prevent channels not in the list from incrementing the list. The default is true.
   */
  allowNewMessagesFromUnfilteredChannels?: boolean;
  /** Custom UI component to display user avatar, defaults to and accepts same props as: [Avatar](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Avatar/Avatar.tsx) */
  Avatar?: React.ComponentType<AvatarProps>;
  /**
   * Optional function to filter channels prior to loading in the DOM. Do not use any complex or async logic that would delay the loading of the ChannelList.
   * We recommend using a pure function with array methods like filter/sort/reduce.
   */
  channelRenderFilterFn?: (
    channels: Array<Channel<At, Ch, Co, Ev, Me, Re, Us>>,
  ) => Array<Channel<At, Ch, Co, Ev, Me, Re, Us>>;
  /** Custom UI component to display search results, defaults to and accepts same props as: [ChannelSearch](https://github.com/GetStream/stream-chat-react/blob/master/src/components/ChannelSearch/ChannelSearch.tsx) */
  ChannelSearch?: React.ComponentType<ChannelSearchProps<Us>>;
  /** Set a Channel (of this id) to be active and move it to the top of the list of Channels by ID */
  customActiveChannel?: string;
  /** Indicator for Empty State */
  EmptyStateIndicator?: React.ComponentType<EmptyStateIndicatorProps>;
  /** Object containing query filters */
  filters?: ChannelFilters<Ch, Co, Us>;
  /** Custom UI component to display the container for the channels, defaults to and accepts same props as: [ChannelListTeam](https://github.com/GetStream/stream-chat-react/blob/master/src/components/ChannelList/ChannelListTeam.tsx) */
  List?: React.ComponentType<ChannelListMessengerProps>;
  /** Custom UI component to display the loading error indicator, defaults to and accepts same props as: [ChatDown](https://github.com/GetStream/stream-chat-react/blob/master/src/components/ChatDown/ChatDown.tsx) */
  LoadingErrorIndicator?: React.ComponentType<ChatDownProps>;
  /** Custom UI component to display the loading state, defaults to and accepts same props as: [LoadingChannels](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Loading/LoadingChannels.tsx) */
  LoadingIndicator?: React.ComponentType;
  /** When set to true, channels won't dynamically sort by most recent message */
  lockChannelOrder?: boolean;
  /** Function to override default behavior when a user is added to a channel, corresponds to [notification.added\_to\_channel](https://getstream.io/chat/docs/javascript/event_object/?language=javascript) event */
  onAddedToChannel?: (
    setChannels: React.Dispatch<React.SetStateAction<Array<Channel<At, Ch, Co, Ev, Me, Re, Us>>>>,
    event: Event<At, Ch, Co, Ev, Me, Re, Us>,
  ) => void;
  /** Function to override default behavior when a channel is deleted, corresponds to [channel.deleted](https://getstream.io/chat/docs/javascript/event_object/?language=javascript) event */
  onChannelDeleted?: (
    setChannels: React.Dispatch<React.SetStateAction<Array<Channel<At, Ch, Co, Ev, Me, Re, Us>>>>,
    event: Event<At, Ch, Co, Ev, Me, Re, Us>,
  ) => void;
  /** Function to override default behavior when a channel is hidden, corresponds to [channel.hidden](https://getstream.io/chat/docs/javascript/event_object/?language=javascript) event */
  onChannelHidden?: (
    setChannels: React.Dispatch<React.SetStateAction<Array<Channel<At, Ch, Co, Ev, Me, Re, Us>>>>,
    event: Event<At, Ch, Co, Ev, Me, Re, Us>,
  ) => void;
  /** Function to override default channel truncated behavior, corresponds to [channel.truncated](https://getstream.io/chat/docs/javascript/event_object/?language=javascript) event */
  onChannelTruncated?: (
    setChannels: React.Dispatch<React.SetStateAction<Array<Channel<At, Ch, Co, Ev, Me, Re, Us>>>>,
    event: Event<At, Ch, Co, Ev, Me, Re, Us>,
  ) => void;
  /** Function to override default channel updated behavior, corresponds to [channel.updated](https://getstream.io/chat/docs/javascript/event_object/?language=javascript) event */
  onChannelUpdated?: (
    setChannels: React.Dispatch<React.SetStateAction<Array<Channel<At, Ch, Co, Ev, Me, Re, Us>>>>,
    event: Event<At, Ch, Co, Ev, Me, Re, Us>,
  ) => void;
  /** Function to override default channel visible behavior, corresponds to [channel.visible](https://getstream.io/chat/docs/javascript/event_object/?language=javascript) event */
  onChannelVisible?: (
    setChannels: React.Dispatch<React.SetStateAction<Array<Channel<At, Ch, Co, Ev, Me, Re, Us>>>>,
    event: Event<At, Ch, Co, Ev, Me, Re, Us>,
  ) => void;
  /** Function to override default behavior when a message is received on a channel not being watched, corresponds to [notification.message\_new](https://getstream.io/chat/docs/javascript/event_object/?language=javascript) event */
  onMessageNew?: (
    setChannels: React.Dispatch<React.SetStateAction<Array<Channel<At, Ch, Co, Ev, Me, Re, Us>>>>,
    event: Event<At, Ch, Co, Ev, Me, Re, Us>,
  ) => void;
  /** Function to override default behavior when a user gets removed from a channel, corresponds to [notification.removed\_from\_channel](https://getstream.io/chat/docs/javascript/event_object/?language=javascript) event */
  onRemovedFromChannel?: (
    setChannels: React.Dispatch<React.SetStateAction<Array<Channel<At, Ch, Co, Ev, Me, Re, Us>>>>,
    event: Event<At, Ch, Co, Ev, Me, Re, Us>,
  ) => void;
  /** Object containing query options */
  options?: ChannelOptions;
  /** Custom UI component to handle channel pagination logic, defaults to and accepts same props as: [LoadMorePaginator](https://github.com/GetStream/stream-chat-react/blob/master/src/components/LoadMore/LoadMorePaginator.tsx) */
  Paginator?: React.ComponentType<InfiniteScrollPaginatorProps | LoadMorePaginatorProps>;
  /** Custom UI component to display the channel preview in the ChannelList, defaults to and accepts same props as: [ChannelPreviewMessenger](https://github.com/GetStream/stream-chat-react/blob/master/src/components/ChannelPreview/ChannelPreviewMessenger.tsx) */
  Preview?: React.ComponentType<ChannelPreviewUIComponentProps<At, Ch, Co, Ev, Me, Re, Us>>;
  /** Last channel will be set as active channel if true, defaults to true */
  setActiveChannelOnMount?: boolean;
  /** Whether or not to load the list with a search component, defaults to false */
  showChannelSearch?: boolean;
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
    setActiveChannelOnMount = true,
    showChannelSearch = false,
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
    useImageFlagEmojisOnWindows,
  } = useChatContext<At, Ch, Co, Ev, Me, Re, Us>();

  const channelListRef = useRef<HTMLDivElement>(null);
  const [channelUpdateCount, setChannelUpdateCount] = useState(0);

  /**
   * Set a channel with id {customActiveChannel} as active and move it to the top of the list.
   * If customActiveChannel prop is absent, then set the first channel in list as active channel.
   */
  const activeChannelHandler = (
    channels: Array<Channel<At, Ch, Co, Ev, Me, Re, Us>>,
    setChannels: React.Dispatch<React.SetStateAction<Array<Channel<At, Ch, Co, Ev, Me, Re, Us>>>>,
  ) => {
    if (
      !channels ||
      channels.length === 0 ||
      channels.length > (options?.limit || MAX_QUERY_CHANNELS_LIMIT)
    ) {
      return;
    }

    if (customActiveChannel) {
      const customActiveChannelObject = channels.find((chan) => chan.id === customActiveChannel);
      if (customActiveChannelObject) {
        if (setActiveChannel) {
          setActiveChannel(customActiveChannelObject, watchers);
        }
        const newChannels = moveChannelUp(customActiveChannelObject.cid, channels);
        setChannels(newChannels);
      }

      return;
    }

    if (setActiveChannelOnMount && setActiveChannel) {
      setActiveChannel(channels[0], watchers);
    }
  };

  /**
   * For some events, inner properties on the channel will update but the shallow comparison will not
   * force a re-render. Incrementing this dummy variable ensures the channel previews update.
   */
  const forceUpdate = () => setChannelUpdateCount((count) => count + 1);

  const { channels, hasNextPage, loadNextPage, setChannels, status } = usePaginatedChannels(
    client,
    filters || DEFAULT_FILTERS,
    sort || DEFAULT_SORT,
    options || DEFAULT_OPTIONS,
    activeChannelHandler,
  );

  const loadedChannels = channelRenderFilterFn ? channelRenderFilterFn(channels) : channels;

  useMobileNavigation(channelListRef, navOpen, closeMobileNav);

  useMessageNewListener(setChannels, lockChannelOrder, allowNewMessagesFromUnfilteredChannels);
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
      error={status.error}
      loading={status.loadingChannels}
      LoadingErrorIndicator={LoadingErrorIndicator}
      LoadingIndicator={LoadingIndicator}
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
        } ${
          useImageFlagEmojisOnWindows && navigator.platform.match(/Win/)
            ? 'str-chat--windows-flags'
            : ''
        }`}
        ref={channelListRef}
      >
        {showChannelSearch && <ChannelSearch {...additionalChannelSearchProps} />}
        {renderList()}
      </div>
    </>
  );
};

/**
 * ChannelList renders a preview list of Channels, allowing you to select the Channel you want to open.
 * @example ./ChannelList.md
 */
export const ChannelList = React.memo(UnMemoizedChannelList) as typeof UnMemoizedChannelList;
