/* globals process */
import React, { Component } from 'react';
import { StreamChat } from 'stream-chat';
import {
  Chat,
  Channel,
  MessageList,
  MessageInput,
  ChannelHeader,
  ChannelListTeam,
  InfiniteScrollPaginator,
  ChannelList,
  MessageTeam,
  Window,
  Thread,
} from 'stream-chat-react';
import 'stream-chat-react/dist/css/index.css';
import './App.css';

const urlParams = new URLSearchParams(window.location.search);
const user =
  urlParams.get('user') || process.env.REACT_APP_CHAT_API_DEFAULT_USER;
const theme = urlParams.get('theme') || 'light';
const userToken =
  urlParams.get('user_token') ||
  process.env.REACT_APP_CHAT_API_DEFAULT_USER_TOKEN;
const channelName = urlParams.get('channel') || 'demo';

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
    this.channel = this.chatClient.channel('team', channelName, {
      image:
        'https://images.unsplash.com/photo-1512138664757-360e0aad5132?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=2851&q=80',
      name: 'The water cooler',
      example: 1,
    });
    const exampleVersion = 1;
    this.chatClient
      .channel('team', 'aww', {
        image:
          'https://images.unsplash.com/photo-1425082661705-1834bfd09dca?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=2855&q=80',
        name: 'Aww',
        example: exampleVersion,
      })
      .watch();
    this.channel.update({
      image:
        'https://images.unsplash.com/photo-1512138664757-360e0aad5132?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=2851&q=80',
      name: 'The water cooler',
      example: exampleVersion,
    });

    this.channel.watch();

    const filters = { type: 'team', example: 1 };
    const sort = { last_message_at: -1 };
    this.channels = this.chatClient.queryChannels(filters, sort, {
      watch: true,
      state: true,
    });
  }

  render() {
    const filters = { type: 'team', example: 1 };
    const sort = {
      last_message_at: -1,
      cid: 1,
    };
    const options = {
      member: true,
      watch: true,
      limit: 30,
    };
    return (
      <Chat
        client={this.chatClient}
        // channels={this.state.channels}
        filters={filters}
        sort={sort}
        options={options}
        theme={`team ${theme}`}
      >
        <ChannelList
          List={ChannelListTeam}
          Paginator={(props) => (
            <InfiniteScrollPaginator threshold={300} {...props} />
          )}
        />
        <Channel
          onMentionsHover={(e, user) => console.log(e, user)}
          onMentionsClick={(e, user) => console.log(e, user)}
        >
          <Window>
            <ChannelHeader />
            <MessageList Message={MessageTeam} />
            <MessageInput
              multipleUploads={false}
              acceptedFiles={['image/*']}
              maxNumberOfFiles={3}
              focus
            />
          </Window>
          <Thread Message={MessageTeam} />
        </Channel>
      </Chat>
    );
  }
}

export default App;
