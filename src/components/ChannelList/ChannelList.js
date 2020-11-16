// @ts-check

import React, { useState, useEffect, useRef, useContext } from 'react';
import PropTypes from 'prop-types';

import { ChatContext } from '../../context';
import { smartRender } from '../../utils';

import ChannelListTeam from './ChannelListTeam';
import { Avatar as DefaultAvatar } from '../Avatar';
import { LoadMorePaginator } from '../LoadMore';
import { LoadingChannels } from '../Loading';
import { EmptyStateIndicator as DefaultEmptyStateIndicator } from '../EmptyStateIndicator';
import { ChannelPreview, ChannelPreviewLastMessage } from '../ChannelPreview';
import { ChatDown } from '../ChatDown';

import { useMessageNewListener } from './hooks/useMessageNewListener';
import { useNotificationMessageNewListener } from './hooks/useNotificationMessageNewListener';
import { useNotificationAddedToChannelListener } from './hooks/useNotificationAddedToChannelListener';
import { useNotificationRemovedFromChannelListener } from './hooks/useNotificationRemovedFromChannelListener';
import { useChannelDeletedListener } from './hooks/useChannelDeletedListener';
import { useChannelTruncatedListener } from './hooks/useChannelTruncatedListener';
import { useChannelUpdatedListener } from './hooks/useChannelUpdatedListener';
import { useChannelHiddenListener } from './hooks/useChannelHiddenListener';
import { useChannelVisibleListener } from './hooks/useChannelVisibleListener';
import { useConnectionRecoveredListener } from './hooks/useConnectionRecoveredListener';
import { useUserPresenceChangedListener } from './hooks/useUserPresenceChangedListener';
import { usePaginatedChannels } from './hooks/usePaginatedChannels';
import { useMobileNavigation } from './hooks/useMobileNavigation';

import { MAX_QUERY_CHANNELS_LIMIT, moveChannelUp } from './utils';

const DEFAULT_FILTERS = {};
const DEFAULT_OPTIONS = {};
const DEFAULT_SORT = {};
/**
 * ChannelList - A preview list of channels, allowing you to select the channel you want to open
 * @example ../../docs/ChannelList.md
 * @type {React.FC<import('types').ChannelListProps>}
 */
const ChannelList = (props) => {
  const {
    client,
    setActiveChannel,
    navOpen = false,
    closeMobileNav,
    channel,
    theme,
  } = useContext(ChatContext);
  const channelListRef = useRef(/** @type {HTMLDivElement | null} */ (null));
  const [channelUpdateCount, setChannelUpdateCount] = useState(0);

  /**
   * Set a channel with id {customActiveChannel} as active and move it to the top of the list.
   * If customActiveChannel prop is absent, then set the first channel in list as active channel.
   * @param {import('stream-chat').Channel[]} channels
   * @param {React.Dispatch<React.SetStateAction<import('stream-chat').Channel[]>>} setChannels
   */
  const activeChannelHandler = (channels, setChannels) => {
    const {
      setActiveChannelOnMount = true,
      customActiveChannel,
      watchers,
      options = {},
    } = props;

    if (
      !channels ||
      channels.length === 0 ||
      channels.length > (options.limit || MAX_QUERY_CHANNELS_LIMIT)
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
  const forceUpdate = () => {
    setChannelUpdateCount((count) => count + 1);
  };

  const {
    channels,
    loadNextPage,
    hasNextPage,
    status,
    setChannels,
  } = usePaginatedChannels(
    client,
    props.filters || DEFAULT_FILTERS,
    props.sort || DEFAULT_SORT,
    props.options || DEFAULT_OPTIONS,
    activeChannelHandler,
  );

  useMobileNavigation(channelListRef, navOpen, closeMobileNav);

  // All the event listeners
  useMessageNewListener(setChannels, props.lockChannelOrder);
  useNotificationMessageNewListener(setChannels, props.onMessageNew);
  useNotificationAddedToChannelListener(setChannels, props.onAddedToChannel);
  useNotificationRemovedFromChannelListener(
    setChannels,
    props.onRemovedFromChannel,
  );
  useChannelDeletedListener(setChannels, props.onChannelDeleted);
  useChannelHiddenListener(setChannels, props.onChannelHidden);
  useChannelVisibleListener(setChannels, props.onChannelVisible);
  useChannelTruncatedListener(
    setChannels,
    props.onChannelTruncated,
    forceUpdate,
  );
  useChannelUpdatedListener(setChannels, props.onChannelUpdated, forceUpdate);
  useConnectionRecoveredListener(forceUpdate);
  useUserPresenceChangedListener(setChannels);

  // If the active channel is deleted, then unset the active channel.
  useEffect(() => {
    /** @param {import('stream-chat').Event} e */
    const handleEvent = (e) => {
      if (setActiveChannel && e?.cid === channel?.cid) {
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
  }, [channel]);

  // renders the channel preview or item
  /** @param {import('stream-chat').Channel} item */
  const renderChannel = (item) => {
    if (!item) return null;

    const {
      Avatar = DefaultAvatar,
      Preview = ChannelPreviewLastMessage,
      watchers = {},
    } = props;

    const previewProps = {
      Avatar,
      channel: item,
      Preview,
      activeChannel: channel,
      setActiveChannel,
      watchers,
      key: item.id,
      // To force the update of preview component upon channel update.
      channelUpdateCount,
    };

    return smartRender(ChannelPreview, { ...previewProps });
  };

  // renders the empty state indicator (when there are no channels)
  const renderEmptyStateIndicator = () => {
    const { EmptyStateIndicator = DefaultEmptyStateIndicator } = props;

    return <EmptyStateIndicator listType="channel" />;
  };

  // renders the list.
  const renderList = () => {
    const {
      Avatar = DefaultAvatar,
      List = ChannelListTeam,
      Paginator = LoadMorePaginator,
      showSidebar,
      LoadingIndicator = LoadingChannels,
      LoadingErrorIndicator = ChatDown,
    } = props;

    return (
      <List
        loading={status.loadingChannels}
        error={status.error}
        showSidebar={showSidebar}
        Avatar={Avatar}
        LoadingIndicator={LoadingIndicator}
        LoadingErrorIndicator={LoadingErrorIndicator}
      >
        {!channels || channels.length === 0
          ? renderEmptyStateIndicator()
          : smartRender(Paginator, {
              loadNextPage,
              hasNextPage,
              refreshing: status.refreshing,
              children: channels.map((item) => renderChannel(item)),
            })}
      </List>
    );
  };

  return (
    <React.Fragment>
      <div
        className={`str-chat str-chat-channel-list ${theme} ${
          navOpen ? 'str-chat-channel-list--open' : ''
        }`}
        ref={channelListRef}
      >
        {renderList()}
      </div>
    </React.Fragment>
  );
};

ChannelList.propTypes = {
  /**
   * Custom UI component to display user avatar
   *
   * Defaults to and accepts same props as: [Avatar](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Avatar/Avatar.js)
   * */
  Avatar: /** @type {PropTypes.Validator<React.ElementType<import('types').AvatarProps>>} */ (PropTypes.elementType),
  /** Indicator for Empty State */
  EmptyStateIndicator: /** @type {PropTypes.Validator<React.ElementType<import('types').EmptyStateIndicatorProps>>} */ (PropTypes.elementType),
  /**
   * Available built-in options (also accepts the same props as):
   *
   * 1. [ChannelPreviewCompact](https://getstream.github.io/stream-chat-react/#ChannelPreviewCompact) (default)
   * 2. [ChannelPreviewLastMessage](https://getstream.github.io/stream-chat-react/#ChannelPreviewLastMessage)
   * 3. [ChannelPreviewMessanger](https://getstream.github.io/stream-chat-react/#ChannelPreviewMessanger)
   *
   * The Preview to use, defaults to ChannelPreviewLastMessage
   * */
  Preview: /** @type {PropTypes.Validator<React.ElementType<import('types').ChannelPreviewUIComponentProps>>} */ (PropTypes.elementType),

  /**
   * Loading indicator UI Component. It will be displayed until the channels are
   * being queried from API. Once the channels are loaded/queried, loading indicator is removed
   * and replaced with children of the Channel component.
   *
   * Defaults to and accepts same props as:
   * [LoadingChannels](https://github.com/GetStream/stream-chat-react/blob/master/src/components/LoadingChannels.js)
   *
   */
  LoadingIndicator: /** @type {PropTypes.Validator<React.ElementType<import('types').LoadingIndicatorProps>>} */ (PropTypes.elementType),
  /**
   * Error indicator UI Component. It will be displayed if there is any error if loading the channels.
   * This error could be related to network or failing API.
   *
   * Defaults to and accepts same props as:
   * [ChatDown](https://github.com/GetStream/stream-chat-react/blob/master/src/components/ChatDown.js)
   *
   */
  LoadingErrorIndicator: /** @type {PropTypes.Validator<React.ElementType<import('types').ChatDownProps>>} */ (PropTypes.elementType),
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
  List: /** @type {PropTypes.Validator<React.ElementType<import('types').ChannelListUIComponentProps>>} */ (PropTypes.elementType),
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
  Paginator: /** @type {PropTypes.Validator<React.ElementType<import('types').PaginatorProps>>} */ (PropTypes.elementType),
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
  filters: /** @type {PropTypes.Validator<import('stream-chat').ChannelFilters>} */ (PropTypes.object),
  /**
   * Object containing query options
   * @see See [Channel query documentation](https://getstream.io/chat/docs/query_channels/?language=js) for a list of available fields for options.
   * */
  options: PropTypes.object,
  /**
   * Object containing sort parameters
   * @see See [Channel query documentation](https://getstream.io/chat/docs/query_channels/?language=js) for a list of available fields for sort.
   * */
  sort: /** @type {PropTypes.Validator<import('stream-chat').ChannelSort>} */ (PropTypes.object),
  /**
   * Object containing watcher parameters
   * @see See [Pagination documentation](https://getstream.io/chat/docs/channel_pagination/?language=js) for a list of available fields for sort.
   * */
  watchers: /** @type {PropTypes.Validator<{ limit?: number | undefined; offset?: number | undefined} | null | undefined> | undefined} */ (PropTypes.object),

  /**
   * Set a Channel (of this id) to be active and move it to the top of the list of channels by ID.
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

export default React.memo(ChannelList);
