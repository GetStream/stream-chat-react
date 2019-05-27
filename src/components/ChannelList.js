import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import Immutable from 'seamless-immutable';
import { isPromise } from '../utils';

import { ChannelPreviewLastMessage } from './ChannelPreviewLastMessage';
import { ChannelPreview } from './ChannelPreview';
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
    /** The Preview to use, defaults to ChannelPreviewLastMessage */
    Preview: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),

    /** The loading indicator to use */
    LoadingIndicator: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
    List: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
    Paginator: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),

    /** Function that overrides default behaviour when users gets added to a channel */
    onAddedToChannel: PropTypes.func,
    /** Function that overrides default behaviour when users gets removed from a channel */
    onRemovedFromChannel: PropTypes.func,

    /** Object containing query filters */
    filters: PropTypes.object,
    /** Object containing query options */
    options: PropTypes.object,
    /** Object containing sort parameters */
    sort: PropTypes.object,
  };

  static defaultProps = {
    Preview: ChannelPreviewLastMessage,
    LoadingIndicator,
    List: ChannelListTeam,
    Paginator: LoadMorePaginator,

    filters: {},
    options: {},
    sort: {},
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
        if (offset === 0 && channelQueryResponse.length >= 1) {
          this.props.setActiveChannel(channelQueryResponse[0]);
        }
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
    } catch (e) {
      console.warn(e);
      this.setState({ error: true, refreshing: false });
    }
  };

  listenToChanges() {
    this.props.client.on(this.handleEvent);
  }

  handleEvent = async (e) => {
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
      const channel = await this.getChannel(e.channel.type, e.channel.id);
      // move channel to starting position
      this.setState((prevState) => ({
        channels: uniqBy([channel, ...prevState.channels], 'cid'),
      }));
    }

    // add to channel
    if (e.type === 'notification.added_to_channel') {
      if (
        this.props.onAddedToChannel &&
        typeof this.props.onAddedToChannel === 'function'
      ) {
        this.props.onAddedToChannel(e);
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
        this.props.onRemovedFromChannel(e);
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
    if (channelIndex === 0) return;

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
    const { Preview, setActiveChannel, channel } = this.props;

    const props = {
      channel: item,
      activeChannel: channel,
      closeMenu: this.closeMenu,
      Preview,
      setActiveChannel,
      key: item.id,
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
          {/* <List {...this.props} {...this.state} {...context} /> */}
          <List loading={loadingChannels} error={this.state.error}>
            {smartRender(Paginator, {
              loadNextPage: this.loadNextPage,
              hasNextPage,
              refreshing,
              children: channels.map((item) => this._renderChannel(item)),
            })}
          </List>
        </div>
      </React.Fragment>
    );
  }
}

ChannelList = withChatContext(ChannelList);
export { ChannelList };
