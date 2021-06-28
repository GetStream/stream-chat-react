import React from 'react';
import { ChannelSort, StreamChat, UserResponse } from 'stream-chat';
import {
  Chat,
  Channel,
  ChannelHeader,
  ChannelList,
  ChannelListMessenger,
  ChannelPreviewMessenger,
  MessageList,
  MessageInput,
  MessageInputFlat,
  Thread,
  Window,
  Tooltip,
} from 'stream-chat-react';
import 'stream-chat-react/dist/css/index.css';
import './App.css';

const apiKey = process.env.REACT_APP_STREAM_KEY as string;
const userId = process.env.REACT_APP_USER_ID as string;
const userToken = process.env.REACT_APP_USER_TOKEN as string;
const theme = 'light';

const filters = { type: 'messaging' };
const options = { state: true, presence: true, limit: 10 };
const sort: ChannelSort = { last_message_at: -1, updated_at: -1 };

const chatClient = StreamChat.getInstance(apiKey);

if (process.env.REACT_APP_CHAT_SERVER_ENDPOINT) {
  chatClient.setBaseURL(process.env.REACT_APP_CHAT_SERVER_ENDPOINT);
}

chatClient.connectUser({ id: userId }, userToken);

const Hover = (e: React.BaseSyntheticEvent, userHovered: UserResponse<{}> | undefined) => {
  return <div>{userHovered?.name}</div>;
};

const Click = (e: React.BaseSyntheticEvent, userHovered: UserResponse<{}> | undefined) => {
  return (
    <div style={{ height: '200px', width: '200px' }}>
      <Tooltip>{userHovered?.name}</Tooltip>
    </div>
  );
};

const App = () => (
  <Chat client={chatClient} theme={`messaging ${theme}`}>
    <ChannelList
      List={ChannelListMessenger}
      Preview={ChannelPreviewMessenger}
      filters={filters}
      sort={sort}
      options={options}
      showChannelSearch
    />
    <Channel onMentionsClick={Click} onMentionsHover={Hover}>
      <Window>
        <ChannelHeader />
        <MessageList />
        <MessageInput Input={MessageInputFlat} focus />
      </Window>
      <Thread />
    </Channel>
  </Chat>
);

export default App;
