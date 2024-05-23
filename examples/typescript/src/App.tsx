import React, { useEffect } from 'react';
import { ChannelFilters, ChannelOptions, ChannelSort, StreamChat, UR } from 'stream-chat';
import {
  Chat,
  Channel,
  ChannelHeader,
  ChannelList,
  VirtualizedMessageList as MessageList,
  MessageInput,
  Thread,
  Window,
  useCreateChatClient,
} from 'stream-chat-react';

import './App.css';

declare module 'stream-chat' {
  interface UserEx {
    customUserField: string;
  }

  interface ReactionEx {
    customReactionField: string;
  }
}

const apiKey = process.env.REACT_APP_STREAM_KEY as string;
const userId = process.env.REACT_APP_USER_ID as string;
const userToken = process.env.REACT_APP_USER_TOKEN as string;

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

const App = () => {
  const chatClient = useCreateChatClient({
    apiKey,
    tokenOrProvider: userToken,
    userData: { id: userId, customUserField: 'field' },
  });

  useEffect(() => {
    (async () => {
      if (chatClient) {
        const { reactions } = await chatClient.queryReactions('dummy', {});
        console.log(reactions[0].customReactionField);
      }
    })();
  }, [chatClient]);

  if (!chatClient) {
    return null;
  }

  return (
    <Chat client={chatClient}>
      <ChannelList filters={filters} sort={sort} options={options} showChannelSearch />
      <Channel>
        <Window>
          <ChannelHeader />
          <MessageList />
          <MessageInput focus />
        </Window>
        <Thread />
      </Channel>
    </Chat>
  );
};

export default App;
