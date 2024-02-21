import React from 'react';
import { ChannelFilters, ChannelOptions, ChannelSort, StreamChat } from 'stream-chat';
import {
  Chat,
  Channel,
  ChannelHeader,
  ChannelList,
  VirtualizedMessageList as MessageList,
  MessageInput,
  Thread,
  Window,
} from 'stream-chat-react';

import './App.css';

const apiKey = process.env.REACT_APP_STREAM_KEY as string;
let userId = process.env.REACT_APP_USER_ID as string;
let userToken = process.env.REACT_APP_USER_TOKEN as string;

const userOverride = new URLSearchParams(window.location.search).get('user');
if (userOverride) {
  [userId, userToken] = userOverride.split(':');
}

const filters: ChannelFilters = { type: 'messaging', members: { $in: [userId] } };
const options: ChannelOptions = { state: true, presence: true, limit: 10 };
const sort: ChannelSort = { last_message_at: -1, updated_at: -1 };

type LocalAttachmentType = Record<string, unknown>;
type LocalChannelType = Record<string, unknown>;
type LocalCommandType = string;
type LocalEventType = Record<string, unknown>;
type LocalMessageType = Record<string, unknown>;
type LocalReactionType = Record<string, unknown>;
type LocalUserType = Record<string, unknown>;

type StreamChatGenerics = {
  attachmentType: LocalAttachmentType;
  channelType: LocalChannelType;
  commandType: LocalCommandType;
  eventType: LocalEventType;
  messageType: LocalMessageType;
  reactionType: LocalReactionType;
  userType: LocalUserType;
};

const chatClient = StreamChat.getInstance<StreamChatGenerics>(apiKey);

if (process.env.REACT_APP_CHAT_SERVER_ENDPOINT) {
  chatClient.setBaseURL(process.env.REACT_APP_CHAT_SERVER_ENDPOINT);
}

chatClient.connectUser({ id: userId }, userToken);

const App = () => (
  <Chat client={chatClient}>
    <ChannelList filters={filters} sort={sort} options={options} showChannelSearch />
    <Channel>
      <Window>
        <ChannelHeader />
        <MessageList
          sortReactions={(a, b) => {
            console.log([a, b]);
            return 0;
          }}
        />
        <MessageInput focus />
      </Window>
      <Thread />
    </Channel>
  </Chat>
);

export default App;
