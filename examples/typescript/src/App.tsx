import React, { useEffect } from 'react';
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

// const apiKey = 'yjrt5yxw77ev';
// const userId = 'neil' as string;
// const userToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoibmVpbCJ9.ty2YhwFaVEYkq1iUfY8s1G0Um3MpiVYpWK-b5kMky0w';

// const apiKey = 'enmswkzcsmn2';
// const userId = 'vishal' as string;
// const userToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoidmlzaGFsIn0.ODSJWLgn5nTKNRsp4RDrRz7qSCwkVbbFudz3xoR0-e8';

const queryParameters = new URLSearchParams(window.location.search)
console.log(queryParameters.get("userId"), queryParameters.get("userToken"))

const apiKey = queryParameters.get("apiKey") || '892s22ypvt6m';
const userId = queryParameters.get("userId") || 'vishal' as string;
const userToken = queryParameters.get("userToken") || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoidmlzaGFsIn0.l-EMrm3ji2Gd9YiISOeSfS6QIvt2r4Cm3oiFFpPRYsk';
const baseUrl = 'http://127.0.0.1:3030';
// const apiKey = process.env.REACT_APP_STREAM_KEY as string;
// const userId = process.env.REACT_APP_USER_ID as string;
// const userToken = process.env.REACT_APP_USER_TOKEN as string;

const filters: ChannelFilters = { type: 'messaging', members: { $in: [userId] } };
const options: ChannelOptions = { state: true, presence: true, limit: 1 };
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

// chatClient.setBaseURL(baseUrl);


const App = () => {
  const [ isReady, setIsReady ] = React.useState(false);
  React.useEffect(() => {
    const init = async () => {
      await chatClient.connectUser({ id: userId }, userToken);
      setIsReady(true);
    };
    init();
  }, []);

  // useEffect(() => {
  //   const init = async () => {
  //     if (isReady) {
  //       try {

  //         const result = await chatClient.getPoll('927734c8-2102-4e52-adfc-18575b16976c')
  //         console.log(result)
  //       } catch (e) {
  //         console.log(e)
  //       }
  //     }
  //   }

  //   init();
  // }, [isReady])

  if (!isReady) return <div>Loading...</div>;

  return (
  <Chat client={chatClient}>
    <ChannelList filters={filters} options={options} sort={sort} />
    <Channel>
      <Window>
        <ChannelHeader />
        <MessageList />
        <MessageInput focus />
      </Window>
      <Thread />
    </Channel>
  </Chat>
)};

export default App;
