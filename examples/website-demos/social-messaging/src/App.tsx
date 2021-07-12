import { useEffect, useState } from 'react';

import { LiteralStringForUnion, StreamChat } from 'stream-chat';
import { Chat } from 'stream-chat-react';

import './styles/App.scss';

import { ChannelListContainer } from './components/ChannelList/ChannelListContainer';
import { ChannelContainer } from './components/ChannelContainer/ChannelContainer';

import { useTheme } from './hooks/useTheme';

const apiKey = process.env.REACT_APP_STREAM_KEY;
const user = process.env.REACT_APP_USER_ID;
const userToken = process.env.REACT_APP_USER_TOKEN;

const userToConnect: { id: string; name?: string; image?: string } = {
  id: user!,
  name: user!,
  image: 'https://ca.slack-edge.com/T02RM6X6B-U01J8HMLA4F-d7bab110afb4-512',
};

export type AttachmentType = {};
export type ChannelType = {};
export type CommandType = LiteralStringForUnion;
export type EventType = {};
export type MessageType = {};
export type ReactionType = {};
export type UserType = { image?: string };

function App() {
  const [chatClient, setChatClient] = useState<StreamChat | null>(null);


  useEffect(() => {
    const initChat = async () => {
      const client = StreamChat.getInstance<
        AttachmentType,
        ChannelType,
        CommandType,
        EventType,
        MessageType,
        ReactionType,
        UserType
      >(apiKey!);
      await client.connectUser(userToConnect, userToken);
      setChatClient(client);
    };

    initChat();

    return () => {
      chatClient?.disconnectUser();
    };
  }, []); // eslint-disable-line

  const { setMode } = useTheme(); // eslint-disable-line

  if (!chatClient) return null;

  return (
    <Chat client={chatClient}>
      <div className='app-container'>
        <ChannelListContainer />
        <ChannelContainer />
      </div>
    </Chat>
  );
}

export default App;
