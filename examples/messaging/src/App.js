/* globals process */
import React, { Component } from 'react';
import { StreamChat } from 'stream-chat';
import {
  Avatar,
  Chat,
  Channel,
  MessageList,
  MessageInput,
  MessageInputFlat,
  MessageSimple,
  ChannelHeader,
  ChannelPreviewMessenger,
  ChannelListMessenger,
  ChannelList,
  Window,
  Thread,
  TypingIndicator,
} from 'stream-chat-react';
import 'stream-chat-react/dist/css/index.css';
import './App.css';

import { PureComponent } from 'react';

import truncate from 'lodash/truncate';

const urlParams = new URLSearchParams(window.location.search);
const user =
  urlParams.get('user') || process.env.REACT_APP_CHAT_API_DEFAULT_USER;

const userToken =
  urlParams.get('user_token') ||
  process.env.REACT_APP_CHAT_API_DEFAULT_USER_TOKEN;

export class HiChannelPreviewMessenger extends PureComponent {
  channelPreviewButton = React.createRef();

  onSelectChannel = () => {
    this.props.setActiveChannel(this.props.channel);
    this.channelPreviewButton.current.blur();
    this.props.closeMenu();
  };
  render() {
    const unreadClass =
      this.props.unread >= 1
        ? 'str-chat__channel-preview-messenger--unread'
        : '';
    const activeClass = this.props.active
      ? 'str-chat__channel-preview-messenger--active'
      : '';
    const members = this.props.channel.data.members
      .map((v) => v.user)
      .filter((v) => this.props.client.user.id !== v.id);
    const name = members
      .map((v) => v.name)
      .slice(0, 5)
      .join(', ');
    const avatar = <Avatar source={members[0].image} size={40} />;
    return (
      <button
        onClick={this.onSelectChannel}
        ref={this.channelPreviewButton}
        className={`str-chat__channel-preview-messenger ${unreadClass} ${activeClass}`}
      >
        <div className="str-chat__channel-preview-messenger--left">
          {avatar}
        </div>
        <div className="str-chat__channel-preview-messenger--right">
          <div className="str-chat__channel-preview-messenger--name">
            {name}
          </div>
          <div className="str-chat__channel-preview-messenger--last-message">
            {!this.props.channel.state.messages[0]
              ? 'Nothing yet...'
              : truncate(
                  this.props.channel.state.messages[
                    this.props.channel.state.messages.length - 1
                  ].text,
                  14,
                )}
          </div>
        </div>
      </button>
    );
  }
}

class App extends Component {
  constructor(props) {
    super(props);
    this.chatClient = new StreamChat(process.env.REACT_APP_CHAT_API_KEY);
    this.chatClient.setBaseURL(process.env.REACT_APP_CHAT_SERVER_ENDPOINT);
    this.chatClient.setUser(
      {
        id: user,
      },
      userToken,
    );
    const filters = { type: 'messaging',members:{$in:[user]}};
    const sort = { last_message_at: -1 };
    this.channels = this.chatClient.queryChannels(filters, sort, {
      subscribe: true,
    });
  }

  render() {
    return (
      <Chat client={this.chatClient} theme="messaging dark">
        <ChannelList
          channels={this.channels}
          List={ChannelListMessenger}
          Preview={ChannelPreviewMessenger}
        />
        <Channel>
          <Window>
            <ChannelHeader />
            <MessageList
              typingIndicator={TypingIndicator}
              Preview={HiChannelPreviewMessenger}
            />
            <MessageInput Input={MessageInputFlat} focus />
          </Window>
          <Thread Message={MessageSimple} />
        </Channel>
      </Chat>
    );
  }
}

export default App;
