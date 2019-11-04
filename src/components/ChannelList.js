import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import Immutable from 'seamless-immutable';
import { isPromise } from '../utils';

import { ChannelPreviewLastMessage } from './ChannelPreviewLastMessage';
import { ChannelPreview } from './ChannelPreview';
import { EmptyStateIndicator } from './EmptyStateIndicator';
import { LoadingIndicator } from './LoadingIndicator';
import { LoadMorePaginator } from './LoadMorePaginator';
import { withChatContext } from '../context';
import { ChannelListTeam } from './ChannelListTeam';
import { smartRender } from '../utils';
import uniqBy from 'lodash.uniqby';

/**
 * ChannelList - A preview list of channels, allowing you to select the channel you want to open
 * @extends PureComponent
 * @example ./docs/ChannelList.md
 */

class ChannelList extends PureComponent {
  static propTypes = {
    /**
     *
     *
     * Indicator for Empty State
     * */
    EmptyStateIndicator: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
    /**
     * Available built-in options (also accepts the same props as):
     *
     * 1. [ChannelPreviewCompact](https://getstream.github.io/stream-chat-react/#ChannelPreviewCompact) (default)
     * 2. [ChannelPreviewLastMessage](https://getstream.github.io/stream-chat-react/#ChannelPreviewLastMessage)
     * 3. [ChannelPreviewMessanger](https://getstream.github.io/stream-chat-react/#ChannelPreviewMessanger)
     *
     * The Preview to use, defaults to ChannelPreviewLastMessage
     * */
    Preview: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),

    /**
     * Loading indicator UI Component. It will be displayed until the channels are
     * being queried from API. Once the channels are loaded/queried, loading indicator is removed
     * and replaced with children of the Channel component.
     *
     * Defaults to and accepts same props as:
     * [LoadingIndicator](https://github.com/GetStream/stream-chat-react/blob/master/src/components/LoadingIndicator.js)
     *
     */
    LoadingIndicator: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
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
    List: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
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
    Paginator: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
    /**
     * Function that overrides default behaviour when new message is received on channel that is not being watched
     *
     * @param {Component} thisArg Reference to ChannelList component
     * @param {Event} event       [Event object](https://getstream.io/chat/docs/#event_object) corresponding to `notification.message_new` event
     * */
    onMessageNew: PropTypes.func,
    /**
     * Function that overrides default behaviour when users gets added to a channel
     *
     * @param {Component} thisArg Reference to ChannelList component
     * @param {Event} event       [Event object](https://getstream.io/chat/docs/#event_object) corresponding to `notification.added_to_channel` event
     * */
    onAddedToChannel: PropTypes.func,
    /**
     * Function that overrides default behaviour when users gets removed from a channel
     *
     * @param {Component} thisArg Reference to ChannelList component
     * @param {Event} event       [Event object](https://getstream.io/chat/docs/#event_object) corresponding to `notification.removed_from_channel` event
     * */
    onRemovedFromChannel: PropTypes.func,
    /**
     * Function that overrides default behaviour when channel gets updated
     *
     * @param {Component} thisArg Reference to ChannelList component
     * @param {Event} event       [Event object](https://getstream.io/chat/docs/#event_object) corresponding to `notification.channel_updated` event
     * */
    onChannelUpdated: PropTypes.func,
    /**
     * Object containing query filters
     * @see See [Channel query documentation](https://getstream.io/chat/docs/#query_channels) for a list of available fields for filter.
     * */
    filters: PropTypes.object,
    /**
     * Object containing query options
     * @see See [Channel query documentation](https://getstream.io/chat/docs/#query_channels) for a list of available fields for options.
     * */
    options: PropTypes.object,
    /**
     * Object containing sort parameters
     * @see See [Channel query documentation](https://getstream.io/chat/docs/#query_channels) for a list of available fields for sort.
     * */
    sort: PropTypes.object,
    /**
     * Object containing watcher parameters
     * @see See [Pagination documentation](https://getstream.io/chat/docs/#channel_pagination) for a list of available fields for sort.
     * */
    watchers: PropTypes.object,
    /**
     * Set a Channel to be active and move it to the top of the list of channels by ID.
     * */
    customAciveChannel: PropTypes.string,
  };

  static defaultProps = {
    Preview: ChannelPreviewLastMessage,
    LoadingIndicator,
    List: ChannelListTeam,
    Paginator: LoadMorePaginator,
    EmptyStateIndicator,
    filters: {},
    options: {},
    sort: {},
    watchers: {},
  };

  constructor(props) {
    super(props);
    this.state = {
      // list of channels
      channels: Immutable([]),
      // loading channels
      loadingChannels: true,
      // error loading channels
      refreshing: false,
      hasNextPage: false,
      offset: 0,
      error: false,
      connectionRecoveredCount: 0,
      channelUpdateCount: 0,
    };

    this.menuButton = React.createRef();
  }

  static getDerivedStateFromError() {
    return { error: true };
  }

  componentDidCatch(error, info) {
    console.warn(error, info);
  }

  async componentDidMount() {
    await this.queryChannels();
    this.listenToChanges();
  }

  componentWillUnmount() {
    this.props.client.off(this.handleEvent);
  }

  queryChannels = async () => {
    const { options, filters, sort } = this.props;
    const { offset } = this.state;

    this.setState({ refreshing: true });

    const newOptions = {
      ...options,
    };
    if (!options.limit) newOptions.limit = 30;

    const channelPromise = this.props.client.queryChannels(filters, sort, {
      ...newOptions,
      offset,
    });

    try {
      let channelQueryResponse = channelPromise;
      if (isPromise(channelQueryResponse)) {
        channelQueryResponse = await channelPromise;
      }
      this.setState((prevState) => {
        const channels = [...prevState.channels, ...channelQueryResponse];

        return {
          channels, // not unique somehow needs more checking
          loadingChannels: false,
          offset: channels.length,
          hasNextPage:
            channelQueryResponse.length >= newOptions.limit ? true : false,
          refreshing: false,
        };
      });

      // Set a channel as active and move it to the top of the list.
      if (this.props.customActiveChannel) {
        const customActiveChannel = channelQueryResponse.filter(
          (channel) => channel.id === this.props.customActiveChannel,
        )[0];
        if (customActiveChannel) {
          this.props.setActiveChannel(customActiveChannel, this.props.watchers);
          this.moveChannelUp(customActiveChannel.cid);
        }
      } else if (offset === 0 && this.state.channels.length >= 1) {
        this.props.setActiveChannel(
          this.state.channels[0],
          this.props.watchers,
        );
      }
    } catch (e) {
      console.warn(e);
      this.setState({ error: true, refreshing: false });
    }
  };

  listenToChanges() {
    this.props.client.on(this.handleEvent);
  }

  handleEvent = async (e) => {
    if (e.type === 'user.presence.changed') {
      let newChannels = this.state.channels;

      newChannels = newChannels.map((channel) => {
        if (!channel.state.members[e.user.id]) return channel;

        channel.state.members.setIn([e.user.id, 'user'], e.user);

        return channel;
      });

      this.setState({ channels: [...newChannels] });
    }

    if (e.type === 'message.new') {
      this.moveChannelUp(e.cid);
    }

    // make sure to re-render the channel list after connection is recovered
    if (e.type === 'connection.recovered') {
      this.setState((prevState) => ({
        connectionRecoveredCount: prevState.connectionRecoveredCount + 1,
      }));
    }

    // move channel to start
    if (e.type === 'notification.message_new') {
      // if new message, put move channel up
      // get channel if not in state currently
      if (
        this.props.onMessageNew &&
        typeof this.props.onMessageNew === 'function'
      ) {
        this.props.onMessageNew(this, e);
      } else {
        const channel = await this.getChannel(e.channel.type, e.channel.id);
        // move channel to starting position
        this.setState((prevState) => ({
          channels: uniqBy([channel, ...prevState.channels], 'cid'),
        }));
      }
    }

    // add to channel
    if (e.type === 'notification.added_to_channel') {
      if (
        this.props.onAddedToChannel &&
        typeof this.props.onAddedToChannel === 'function'
      ) {
        this.props.onAddedToChannel(this, e);
      } else {
        const channel = await this.getChannel(e.channel.type, e.channel.id);
        this.setState((prevState) => ({
          channels: uniqBy([channel, ...prevState.channels], 'cid'),
        }));
      }
    }

    // remove from channel
    if (e.type === 'notification.removed_from_channel') {
      if (
        this.props.onRemovedFromChannel &&
        typeof this.props.onRemovedFromChannel === 'function'
      ) {
        this.props.onRemovedFromChannel(this, e);
      } else {
        this.setState((prevState) => {
          const channels = prevState.channels.filter(
            (channel) => channel.cid !== e.channel.cid,
          );
          return {
            channels,
          };
        });
      }
    }

    // Update the channel with data
    if (e.type === 'channel.updated') {
      const channels = this.state.channels;
      const channelIndex = channels.findIndex(
        (channel) => channel.cid === e.channel.cid,
      );
      channels[channelIndex].data = Immutable(e.channel);

      this.setState({
        channels: [...channels],
        channelUpdateCount: this.state.channelUpdateCount + 1,
      });

      if (
        this.props.onChannelUpdated &&
        typeof this.props.onChannelUpdated === 'function'
      ) {
        this.props.onChannelUpdated(this, e);
      }
    }

    return null;
  };

  getChannel = async (type, id) => {
    const channel = this.props.client.channel(type, id);
    await channel.watch();
    return channel;
  };

  moveChannelUp = (cid) => {
    const channels = this.state.channels;
    // get channel index
    const channelIndex = this.state.channels.findIndex(
      (channel) => channel.cid === cid,
    );
    if (channelIndex <= 0) return;

    // get channel from channels
    const channel = channels[channelIndex];

    //remove channel from current position
    channels.splice(channelIndex, 1);
    //add channel at the start
    channels.unshift(channel);

    // set new channel state
    this.setState({
      channels: [...channels],
    });
  };

  loadNextPage = () => {
    this.queryChannels();
  };

  closeMenu = () => {
    this.menuButton.current.checked = false;
  };

  // new channel list // *********************************

  _renderChannel = (item) => {
    const { Preview, setActiveChannel, channel, watchers } = this.props;
    if (!item) return;
    const props = {
      channel: item,
      activeChannel: channel,
      closeMenu: this.closeMenu,
      Preview,
      setActiveChannel,
      watchers,
      key: item.id,
      // To force the update of preview component upon channel update.
      channelUpdateCount: this.state.channelUpdateCount,
      connectionRecoveredCount: this.state.connectionRecoveredCount,
    };
    return smartRender(ChannelPreview, { ...props });
  };

  render() {
    const { List, Paginator } = this.props;
    const { channels, loadingChannels, refreshing, hasNextPage } = this.state;
    return (
      <React.Fragment>
        <input
          type="checkbox"
          id="str-chat-channel-checkbox"
          ref={this.menuButton}
          className="str-chat-channel-checkbox"
        />
        <label
          htmlFor="str-chat-channel-checkbox"
          className="str-chat-channel-list-burger"
        >
          <div />
        </label>
        <div
          className={`str-chat str-chat-channel-list ${this.props.theme} ${
            this.props.open ? 'str-chat-channel-list--open' : ''
          }`}
          ref={this.channelList}
        >
          <List
            loading={loadingChannels}
            error={this.state.error}
            channels={channels}
            setActiveChannel={this.props.setActiveChannel}
            activeChannel={this.props.channel}
            showSidebar={this.props.showSidebar}
          >
            {!channels.length ? (
              <EmptyStateIndicator listType="channel" />
            ) : (
              smartRender(Paginator, {
                loadNextPage: this.loadNextPage,
                hasNextPage,
                refreshing,
                children: channels.map((item) => this._renderChannel(item)),
              })
            )}
          </List>
        </div>
      </React.Fragment>
    );
  }
}

ChannelList = withChatContext(ChannelList);
export { ChannelList };
