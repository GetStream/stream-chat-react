import React from 'react';
import { ChannelSort, StreamChat } from 'stream-chat';
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
  useTypingContext,
  Window,
  TypingIndicator,
  ChannelHeaderProps,
  useChannelStateContext,
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

const CustomChannelHeader = (props: ChannelHeaderProps) => {
  const { channel } = useChannelStateContext();
  const { name } = channel.data || {};

  return (
    <div className='str-chat__header-livestream'>
      <div>
        <div>Typing Indicator</div>
        <div>{name}</div>
      </div>
      {/* <TypingIndicator /> */}
    </div>
  )
}

const ChannelInner = () => {
  return (
    <>
      <Window>
        <CustomChannelHeader />
        <MessageList />
        <MessageInput />
      </Window>
      <Thread />
    </>
  )
}

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
    <Channel TypingIndicator={() => { return null } }>
      <ChannelInner />
    </Channel>
  </Chat>
);

export default App;
