/* eslint-disable */
import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';

import ChannelListTeam from './ChannelListTeam';
import { LoadMorePaginator } from '../LoadMore';
import { LoadingChannels } from '../Loading';
import { EmptyStateIndicator } from '../EmptyStateIndicator';
import { ChannelPreview, ChannelPreviewLastMessage } from '../ChannelPreview';
import { ChatDown } from '../ChatDown';
import { withChatContext } from '../../context';
import { smartRender } from '../../utils';
import { useMessageNewListener } from './hooks/useMessageNewListener';
import { useNotificationMessageNewListener } from './hooks/useNotificationMessageNewListener';
import { useNotificationAddedToChannelListener } from './hooks/useNotificationAddedToChannelListener';
import { useNotificationRemovedFromChannelListener } from './hooks/useNotificationRemovedFromChannelListener';
import { useChannelDeletedListener } from './hooks/useChannelDeletedListener';
import { useChannelTruncatedListener } from './hooks/useChannelTruncatedListener';
import { useChannelUpdatedListener } from './hooks/useChannelUpdatedListener';
import { useConnectionRecoveredListener } from './hooks/useConnectionRecoveredListener';
import { useUserPresenceChangedListener } from './hooks/useUserPresenceChangedListener';
import { usePaginatedChannels } from './hooks/usePaginatedChannels';
import { MAX_QUERY_CHANNELS_LIMIT, moveChannelUp } from './utils';
import { useMobileNavigation } from './hooks/useMobileNavigation';

/**
 * ChannelList - A preview list of channels, allowing you to select the channel you want to open
 * @extends PureComponent
 * @example ../../docs/ChannelList.md
 */
const ChannelList = ({
  filters,
  sort,
  options,
  watchers,
  client,
  theme,
  navOpen,
  closeMobileNav,
  setActiveChannel,
  setActiveChannelOnMount,
  showSidebar,
  LoadingIndicator,
  EmptyStateIndicator,
  LoadingErrorIndicator,
  customActiveChannel,
  lockChannelOrder,
  List,
  Preview,
  Paginator,
  channel,
  onMessageNew,
  onAddedToChannel,
  onRemovedFromChannel,
  onChannelUpdated,
  onChannelDeleted,
  onChannelTruncated,
}) => {
  const channelListRef = useRef(null);
  const activeChannelHandler = (channels) => {
    // Set a channel as active and move it to the top of the list.
    if (channels && customActiveChannel) {
      const _customActiveChannel = channels.filter(
        (channel) => channel.id === customActiveChannel,
      )[0];
      if (_customActiveChannel) {
        setActiveChannel(_customActiveChannel, watchers);
        const newChannels = moveChannelUp(_customActiveChannel.cid, channels);
        setChannels(newChannels);
      }
    } else if (
      setActiveChannelOnMount &&
      channels &&
      channels.length > 0 &&
      channels.length <= (options.limit || MAX_QUERY_CHANNELS_LIMIT)
    ) {
      setActiveChannel(channels[0], watchers);
    }
  };

  const forceUpdate = () => {
    setChannelUpdateCount((count) => count + 1);
  };

  const [channelUpdateCount, setChannelUpdateCount] = useState(0);
  const {
    channels,
    loadNextPage,
    hasNextPage,
    status,
    setChannels,
  } = usePaginatedChannels(
    client,
    filters,
    sort,
    options,
    activeChannelHandler,
  );
  useMobileNavigation(channelListRef, navOpen, closeMobileNav);

  // All the event listeners
  !lockChannelOrder && useMessageNewListener(setChannels);
  useNotificationMessageNewListener(setChannels, onMessageNew);
  useNotificationAddedToChannelListener(setChannels, onAddedToChannel);
  useNotificationRemovedFromChannelListener(setChannels, onRemovedFromChannel);
  useChannelDeletedListener(setChannels, onChannelDeleted);
  useChannelTruncatedListener(setChannels, onChannelTruncated, forceUpdate);
  useChannelUpdatedListener(setChannels, onChannelUpdated, forceUpdate);
  useConnectionRecoveredListener(forceUpdate);
  useUserPresenceChangedListener(setChannels);

  useEffect(() => {
    client.on('channel.deleted', (e) => {
      if (e.channel.cid === channel.cid) {
        setActiveChannel({});
      }
    });

    return () => {
      client.off('channel.deleted');
    };
  }, []);

  const renderChannel = (item) => {
    if (!item) return;
    const props = {
      channel: item,
      activeChannel: channel,
      Preview,
      setActiveChannel,
      watchers,
      key: item.id,
      // To force the update of preview component upon channel update.
      channelUpdateCount,
    };
    return smartRender(ChannelPreview, { ...props });
  };

  return (
    <React.Fragment>
      <div
        className={`str-chat str-chat-channel-list ${theme} ${
          navOpen ? 'str-chat-channel-list--open' : ''
        }`}
        ref={channelListRef}
      >
        <List
          loading={status.loadingChannels}
          error={status.error}
          channels={channels}
          setActiveChannel={setActiveChannel}
          activeChannel={channel}
          showSidebar={showSidebar}
          LoadingIndicator={LoadingIndicator}
          LoadingErrorIndicator={LoadingErrorIndicator}
        >
          {!channels || channels.length === 0 ? (
            <EmptyStateIndicator listType="channel" />
          ) : (
            smartRender(Paginator, {
              loadNextPage: loadNextPage,
              hasNextPage,
              refreshing: status.refreshing,
              children: channels.map((item) => renderChannel(item)),
            })
          )}
        </List>
      </div>
    </React.Fragment>
  );
};

ChannelList.propTypes = {
  /** Indicator for Empty State */
  EmptyStateIndicator: PropTypes.elementType,
  /**
   * Available built-in options (also accepts the same props as):
   *
   * 1. [ChannelPreviewCompact](https://getstream.github.io/stream-chat-react/#ChannelPreviewCompact) (default)
   * 2. [ChannelPreviewLastMessage](https://getstream.github.io/stream-chat-react/#ChannelPreviewLastMessage)
   * 3. [ChannelPreviewMessanger](https://getstream.github.io/stream-chat-react/#ChannelPreviewMessanger)
   *
   * The Preview to use, defaults to ChannelPreviewLastMessage
   * */
  Preview: PropTypes.elementType,

  /**
   * Loading indicator UI Component. It will be displayed until the channels are
   * being queried from API. Once the channels are loaded/queried, loading indicator is removed
   * and replaced with children of the Channel component.
   *
   * Defaults to and accepts same props as:
   * [LoadingChannels](https://github.com/GetStream/stream-chat-react/blob/master/src/components/LoadingChannels.js)
   *
   */
  LoadingIndicator: PropTypes.elementType,
  /**
   * Error indicator UI Component. It will be displayed if there is any error if loading the channels.
   * This error could be related to network or failing API.
   *
   * Defaults to and accepts same props as:
   * [ChatDown](https://github.com/GetStream/stream-chat-react/blob/master/src/components/ChatDown.js)
   *
   */
  LoadingErrorIndicator: PropTypes.elementType,
  /**
   * Custom UI Component for container of list of channels. Note that, list (UI component) of channels is passed
   * to this component as children. This component is for the purpose of adding header to channel list or styling container
   * for list of channels.
   *
   * Available built-in options (also accepts the same props as):
   *
   * 1. [ChannelListTeam](https://github.com/GetStream/stream-chat-react/blob/master/src/components/ChannelListTeam.js) (default)
   * 2. [ChannelListMessenger](https://github.com/GetStream/stream-chat-react/blob/master/src/components/ChannelListMessenger.js)
   *
   * It has access to some additional props:
   *
   * - `setActiveChannel` {function} Check [chat context](https://getstream.github.io/stream-chat-react/#chat)
   * - `activeChannel` Currently active channel object
   * - `channels` {array} List of channels in channel list
   */
  List: PropTypes.elementType,
  /**
   * Paginator component for channels. It contains all the pagination logic such as
   * - fetching next page of results when needed e.g., when scroll reaches the end of list
   * - UI to display loading indicator when next page is being loaded
   * - call to action button to trigger loading of next page.
   *
   * Available built-in options (also accepts the same props as):
   *
   * 1. [LoadMorePaginator](https://github.com/GetStream/stream-chat-react/blob/master/src/components/LoadMorePaginator.js)
   * 2. [InfiniteScrollPaginator](https://github.com/GetStream/stream-chat-react/blob/master/src/components/InfiniteScrollPaginator.js)
   */
  Paginator: PropTypes.elementType,
  /**
   * Function that overrides default behaviour when new message is received on channel that is not being watched
   *
   * @param {Component} setChannels Setter for channels value in state.
   * @param {Event}     event       [Event object](https://getstream.io/chat/docs/event_object/?language=js) corresponding to `notification.message_new` event
   * */
  onMessageNew: PropTypes.func,
  /**
   * Function that overrides default behaviour when users gets added to a channel
   *
   * @param {Component} setChannels Setter for channels value in state.
   * @param {Event}     event       [Event object](https://getstream.io/chat/docs/event_object/?language=js) corresponding to `notification.added_to_channel` event
   * */
  onAddedToChannel: PropTypes.func,
  /**
   * Function that overrides default behaviour when users gets removed from a channel
   *
   * @param {Component} setChannels Setter for channels value in state.
   * @param {Event}     event       [Event object](https://getstream.io/chat/docs/event_object/?language=js) corresponding to `notification.removed_from_channel` event
   * */
  onRemovedFromChannel: PropTypes.func,
  /**
   * Function that overrides default behaviour when channel gets updated
   *
   * @param {Component} setChannels Setter for channels value in state.
   * @param {Event}     event       [Event object](https://getstream.io/chat/docs/event_object/?language=js) corresponding to `notification.channel_updated` event
   * */
  onChannelUpdated: PropTypes.func,
  /**
   * Function to customize behaviour when channel gets truncated
   *
   * @param {Component} setChannels Setter for channels value in state.
   * @param {Event}     event       [Event object](https://getstream.io/chat/docs/event_object/?language=js) corresponding to `channel.truncated` event
   * */
  onChannelTruncated: PropTypes.func,
  /**
   * Function that overrides default behaviour when channel gets deleted. In absence of this prop, channel will be removed from the list.
   *
   * @param {Component} setChannels Setter for channels value in state.
   * @param {Event}     event       [Event object](https://getstream.io/chat/docs/event_object/?language=js) corresponding to `channel.deleted` event
   * */
  onChannelDeleted: PropTypes.func,
  /**
   * Object containing query filters
   * @see See [Channel query documentation](https://getstream.io/chat/docs/query_channels/?language=js) for a list of available fields for filter.
   * */
  filters: PropTypes.object,
  /**
   * Object containing query options
   * @see See [Channel query documentation](https://getstream.io/chat/docs/query_channels/?language=js) for a list of available fields for options.
   * */
  options: PropTypes.object,
  /**
   * Object containing sort parameters
   * @see See [Channel query documentation](https://getstream.io/chat/docs/query_channels/?language=js) for a list of available fields for sort.
   * */
  sort: PropTypes.object,
  /**
   * Object containing watcher parameters
   * @see See [Pagination documentation](https://getstream.io/chat/docs/channel_pagination/?language=js) for a list of available fields for sort.
   * */
  watchers: PropTypes.object,

  /**
   * Set a Channel to be active and move it to the top of the list of channels by ID.
   * */
  customActiveChannel: PropTypes.string,
  /**
   * Last channel will be set as active channel if true, defaults to true
   */
  setActiveChannelOnMount: PropTypes.bool,
  /**
   * If true, channels won't be dynamically sorted by most recent message.
   */
  lockChannelOrder: PropTypes.bool,
};

ChannelList.defaultProps = {
  Preview: ChannelPreviewLastMessage,
  LoadingIndicator: LoadingChannels,
  LoadingErrorIndicator: ChatDown,
  List: ChannelListTeam,
  Paginator: LoadMorePaginator,
  EmptyStateIndicator,
  setActiveChannelOnMount: true,
  filters: {},
  options: {},
  sort: {},
  watchers: {},
};

export default withChatContext(ChannelList);
