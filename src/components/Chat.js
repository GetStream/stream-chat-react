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

      offset: 0,
    };
  }

  async componentDidMount() {
    const { options, filters, sort } = this.props;
    await this.setState({
      options,
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
      this.setState((prevState) => ({
        channels: [...prevState.channels, ...channelQueryResponse], // not unique somehow needs more checking
        loadingChannels: false,
        offset: prevState.offset + options.limit,
        hasNextPage:
          channelQueryResponse.length >= options.limit ? true : false,
      }));
    } catch (e) {
      console.warn(e);
      this.setState({ error: true });
    }
  };

  listenToChanges() {
    this.props.client.on(this.handleEvent);
  }

  handleEvent = (e) => {
    if (e.type === 'notification.message_new') {
      // if new message, put move channel up
      console.log(e.type, 'notification.message_new');
    }

    if (e.type === 'notification.added_to_channel') {
      console.log(e.type, 'notification.added_to_channel');
    }

    if (e.type === 'notification.removed_from_channel') {
      console.log(e.type, 'notification.removed_from_channel');
    }

    return null;
  };

  loadNextPage = () => {
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
    hasNextPage: this.state.hasNextPage,
  });

  render() {
    return (
      <ChatContext.Provider value={this.getContext()}>
        {this.props.children}
      </ChatContext.Provider>
    );
  }
}
