import React from 'react';
// import { LoadingIndicatorProps } from 'react-file-utils/dist/types/components/LoadingIndicator';
import { ChannelSort, StreamChat } from 'stream-chat';
import {
  Chat,
  Channel,
  ChannelHeader,
  ChannelList,
  // ChannelListMessenger,
  // ChannelPreviewMessenger,
  MessageList,
  MessageInput,
  MessageInputFlat,
  Thread,
  Window,
  ChatDownProps,
  // ChatDownProps,
} from 'stream-chat-react';
import 'stream-chat-react/dist/css/index.css';
import './App.css';
import { CustomList } from './components/CustomList';

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

const App = () => {
  const CustomErrorIndicator = (props: ChatDownProps) => {
    const {
      text
    } = props
  
    console.log('props HERE:', props);
  
    return <div>{text}</div>
  };

  return (
    <Chat client={chatClient} theme={`messaging ${theme}`}>
      <ChannelList
        List={CustomList}
        filters={filters}
        sort={sort}
        options={options}
        showChannelSearch
        LoadingErrorIndicator={() => (
          <CustomErrorIndicator text={'Loading Error - check your connection.'} type={'connection'} />
        )}
      />
      <Channel>
        <Window>
          <ChannelHeader />
          <MessageList />
          <MessageInput Input={MessageInputFlat} focus />
        </Window>
        <Thread />
      </Channel>
    </Chat>
  )
};

export default App;
