import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { StreamChat } from '../../node_modules/stream-chat';
import {
  Channel,
  Chat,
  MessageList,
  useChannelActionContext,
  VirtualizedMessageList,
} from '../../src';
import '@stream-io/stream-chat-css/dist/css/index.css';

void MessageList;
void VirtualizedMessageList;

const apiKey = process.env.APP_KEY;
const userId = process.env.TEST_USER_1;
const userToken = process.env.TEST_USER_1_TOKEN;
const channelId = process.env.JUMP_TO_MESSAGE_CHANNEL;

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

const JumpToMessage = () => {
  const { jumpToMessage } = useChannelActionContext();

  return (
    <button
      onClick={async () => {
        const results = await chatClient.search(
          {
            id: { $eq: channelId },
          },
          'Message',
          { limit: 1, offset: 120 },
        );

        jumpToMessage(results.results[0].message.id);
      }}
    >
      Jump to message 29
    </button>
  );
};

const App = () => {
  const [channel, setChannel] = useState(null);
  useEffect(() => {
    (async () => {
      const channels = await chatClient.queryChannels({ id: { $eq: channelId } });
      setChannel(channels[0]);
    })();
  }, []);

  if (!channel) {
    return null;
  }
  return (
    <div>
      <Chat client={chatClient}>
        <Channel channel={channel}>
          <JumpToMessage />
          <MessageList />
          {/* <VirtualizedMessageList /> */}
        </Channel>
      </Chat>
    </div>
  );
};

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root'),
);
