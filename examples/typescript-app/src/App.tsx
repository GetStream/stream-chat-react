import React from 'react';
import { ChannelSort, StreamChat } from 'stream-chat';
import {
  Chat,
  Channel,
  ChannelHeader,
  ChannelList,
  ChannelListMessenger,
  ChannelListMessengerProps,
  ChannelPreviewMessenger,
  MessageList,
  MessageInput,
  Thread,
  Window,
} from 'stream-chat-react';
import 'stream-chat-react/dist/css/index.css';
import './App.css';

const apiKey = process.env.REACT_APP_STREAM_KEY as string;
const userId = process.env.REACT_APP_USER_ID as string;
const userToken = process.env.REACT_APP_USER_TOKEN as string;
const theme = 'light';

const filters = { type: 'messaging' };
const teamFilters = { type: 'team '};
const options = { state: true, presence: true, limit: 10 };
const sort: ChannelSort = { last_message_at: -1, updated_at: -1 };

const chatClient = StreamChat.getInstance(apiKey);

if (process.env.REACT_APP_CHAT_SERVER_ENDPOINT) {
  chatClient.setBaseURL(process.env.REACT_APP_CHAT_SERVER_ENDPOINT);
}

chatClient.connectUser({ id: userId }, userToken);

const ChannelInner = () => {
  return (
    <>
      <Window>
        <ChannelHeader />
        <MessageList />
        <MessageInput />
      </Window>
      <Thread />
    </>
  )
}

const CustomChannelListTeam: React.FC<ChannelListMessengerProps> = (props) => {
  const { children } = props;

  console.log('in the team Children:', children);

  chatClient.on((event) => {
    if (event.type === "message.new" && event.channel_type !== "team") {
      // @ts-expect-error
      children?.props?.children?.pop()
    }
  })

  return (
    <div>{children}</div>
  )
}

const CustomChannelListMessaging: React.FC<ChannelListMessengerProps> = (props) => {
  const { children } = props;


  chatClient.on((event) => {
    if (event.type === "message.new" && event.channel_type !== "messaging") {
      console.log('in the messaging');
      // @ts-expect-error
      children?.props?.children?.pop()
    }
  })

  return (
    <div>{children}</div>
  )
}

// {type: "message.new", cid: "messaging:!members-QfY0OcDPuumgLX3pb9mMjUI8NBu0eeItAZOMzooxojc", channel_id: "!members-QfY0OcDPuumgLX3pb9mMjUI8NBu0eeItAZOMzooxojc", channel_type: "messaging", message: {…}, …}
// channel_id: "!members-QfY0OcDPuumgLX3pb9mMjUI8NBu0eeItAZOMzooxojc"
// channel_type: "messaging"
// cid: "messaging:!members-QfY0OcDPuumgLX3pb9mMjUI8NBu0eeItAZOMzooxojc"
// created_at: "2021-07-01T19:29:50.452989911Z"
// message: {id: "daddy-dan-4473daa7-ffd6-400c-adc4-15f58e18c12c", text: "hola dawg", html: "<p>hola dawg</p>\n", type: "regular", user: {…}, …}
// received_at: Thu Jul 01 2021 13:29:50 GMT-0600 (Mountain Daylight Time) {}
// total_unread_count: 2408
// type: "message.new"
// unread_channels: 11
// unread_count: 2408
// user: {id: "daddy-dan", role: "user", created_at: "2021-04-13T19:08:02.660422Z", updated_at: "2021-04-27T19:58:33.9493Z", last_active: "2021-07-01T19:29:43.195701098Z", …}
// watcher_count: 3
// __proto__: Object


const App = () => (
  <Chat client={chatClient} theme={`messaging ${theme}`}>
    <ChannelList
      List={CustomChannelListMessaging}
      Preview={ChannelPreviewMessenger}
      filters={filters}
      sort={sort}
      options={options}
      showChannelSearch
    />
    <ChannelList
      List={CustomChannelListTeam}
      Preview={ChannelPreviewMessenger}
      filters={teamFilters}
      sort={sort}
      options={options}
      showChannelSearch
    />
    <Channel>
      <ChannelInner />
    </Channel>
  </Chat>
);

export default App;
