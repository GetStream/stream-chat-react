import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { ChatContext } from '../context';
import { isPromise } from '../utils';

import Immutable from 'seamless-immutable';

/**
 * Chat - Wrapper component for Chat. The needs to be placed around any other chat components.
 * This Chat component provides the ChatContext to all other components.
 *
 * The ChatContext provides the following props:
 *
 * - client (the client connection)
 * - channels (the list of channels)
 * - setActiveChannel (a function to set the currently active channel)
 * - channel (the currently active channel)
 *
 * It also exposes the withChatContext HOC which you can use to consume the ChatContext
 *
 * @example ./docs/Chat.md
 * @extends PureComponent
 */

const colors = ['light', 'dark'];
const baseUseCases = ['messaging', 'team', 'commerce', 'gaming', 'livestream'];
const themes = [];

for (const color of colors) {
  for (const useCase of baseUseCases) {
    themes.push(`${useCase} ${color}`);
  }
}

export class Chat extends PureComponent {
  static propTypes = {
    /** The StreamChat client object */
    client: PropTypes.object.isRequired,
    /** The theme 'messaging', 'team', 'commerce', 'gaming', 'livestream' plus either 'light' or 'dark' */
    theme: PropTypes.oneOf(themes),
    /** Function that runs when user gets added to a channel */
    onAddedToChannel: PropTypes.func,
    /** Function that runs when user gets removed to a channel */
    onRemovedFromChannel: PropTypes.func,
  };

  static defaultProps = {
    theme: 'messaging light',
  };

  constructor(props) {
    super(props);

    this.state = {
      // currently active channel
      channel: {},
      // list of channels
      channels: Immutable([]),
      // loading channels
      loadingChannels: true,
      // error loading channels
      error: false,
      refreshing: false,
      offset: 0,
    };
  }

  async componentDidMount() {
    const { options, filters, sort } = this.props;
    await this.setState({
      options: {
        limit: 30,
        ...options,
      },
      filters,
      sort,
    });
    await this.queryChannels();
    this.listenToChanges();
  }

  setActiveChannel = (channel, e) => {
    if (e !== undefined && e.preventDefault) {
      e.preventDefault();
    }

    this.setState(() => ({
      channel,
    }));
  };

  queryChannels = async () => {
    const { options, filters, sort, offset } = this.state;

    this.setState({ refreshing: true });

    const channelPromise = this.props.client.queryChannels(filters, sort, {
      ...options,
      offset,
    });

    try {
      let channelQueryResponse = channelPromise;
      if (isPromise(channelQueryResponse)) {
        channelQueryResponse = await channelPromise;
        if (offset === 0 && channelQueryResponse.length >= 1) {
          this.setActiveChannel(channelQueryResponse[0]);
        }
      }
      this.setState((prevState) => {
        const channels = [...prevState.channels, ...channelQueryResponse];
        return {
          channels, // not unique somehow needs more checking
          loadingChannels: false,
          offset: channels.length,
          hasNextPage:
            channelQueryResponse.length >= options.limit ? true : false,
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

    // move channel to start
    if (e.type === 'notification.message_new') {
      // if new message, put move channel up
      // get channel if not in state currently
      const channel = await this.getChannel(e.cid);
      // move channel to starting position
      this.setState((prevState) => ({
        channels: [...channel, ...prevState.channels],
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
        const channel = await this.getChannel(e.channel.cid);
        this.setState((prevState) => ({
          channels: [...channel, ...prevState.channels],
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

  getChannel = async (cid) => {
    const channelPromise = this.props.client.queryChannels({ cid });

    try {
      let channelQueryResponse = channelPromise;
      if (isPromise(channelQueryResponse)) {
        channelQueryResponse = await channelPromise;
      }
      return channelQueryResponse;
    } catch (e) {
      console.warn(e);
    }
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
    console.log('loadNextPage');
    this.queryChannels();
  };

  getContext = () => ({
    client: this.props.client,
    channels: this.state.channels,
    loadingChannels: this.state.loadingChannels,
    channel: this.state.channel,
    setActiveChannel: this.setActiveChannel,
    theme: this.props.theme,
    loadNextPage: this.loadNextPage,
    refreshing: this.state.refreshing,
    hasNextPage: this.state.hasNextPage,
    moveChannelUp: this.moveChannelUp,
  });

  render() {
    return (
      <ChatContext.Provider value={this.getContext()}>
        {this.props.children}
      </ChatContext.Provider>
    );
  }
}
