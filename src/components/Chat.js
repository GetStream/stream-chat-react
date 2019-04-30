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
      limit: 0,
    };
  }

  async componentDidMount() {
    await this.setState({
      options: this.props.options,
      filters: this.props.filter,
      sort: this.props.sort,
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

  queryChannels = async (channels) => {
    const channelPromise =
      channels ||
      this.props.client.queryChannels(this.state.filters, this.state.sort, {
        ...this.props.options,
        offset: this.state.offset,
      });
    try {
      let channelQueryResponse = channelPromise;
      if (isPromise(channelQueryResponse)) {
        channelQueryResponse = await channelPromise;
        if (!channels && channelQueryResponse.length >= 1) {
          this.setActiveChannel(channelQueryResponse[0]);
        }
      }
      this.setState((prevState) => ({
        // channels: uniq([...prevState.channels, ...channelQueryResponse]), // unique
        channels: [...prevState.channels, ...channelQueryResponse], // not unique somehow
        loadingChannels: false,
        offset: prevState.offset + this.props.options.limit,
      }));
      console.log(channelQueryResponse.length, this.state.channels.length);
    } catch (e) {
      console.warn(e);
      this.setState({ error: true });
    }
  };

  // event

  listenToChanges() {
    // The more complex sync logic is done in chat.js
    // listen to client.connection.recovered and all channel events
    this.props.client.on(this.handleEvent);
  }

  handleEvent = () => {
    // handle updated channel events
    // console.log('');
  };

  //
  loadNextPage = () => {
    const channels = this.props.client.queryChannels(
      this.state.filters,
      this.state.sort,
      {
        ...this.props.options,
        offset: this.state.offset,
      },
    );
    this.queryChannels(channels);
    // this.setState({ channels }, () => console.log(this.state.channels));
    console.log('bhoi');
  };

  getContext = () => ({
    client: this.props.client,
    channels: this.state.channels,
    loadingChannels: this.state.loadingChannels,
    channel: this.state.channel,
    setActiveChannel: this.setActiveChannel,
    theme: this.props.theme,
    loadNextPage: this.loadNextPage,
  });

  render() {
    return (
      <ChatContext.Provider value={this.getContext()}>
        {this.props.children}
      </ChatContext.Provider>
    );
  }
}
