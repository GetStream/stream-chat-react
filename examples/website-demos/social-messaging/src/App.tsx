import { useEffect, useState } from 'react';

import { ChannelSort, LiteralStringForUnion, StreamChat } from 'stream-chat';
import { Channel, ChannelList, Chat } from 'stream-chat-react';

import 'stream-chat-react/dist/css/index.css';
import './styles/App.scss';

import { ChannelContainer } from './components/ChannelContainer/ChannelContainer';
import { SocialChannelList } from './components/SocialChannelList/SocialChannelList';
import { SocialChannelListFooter } from './components/SocialChannelList/SocialChannelListFooter';
import { SocialChannelListHeader } from './components/SocialChannelList/SocialChannelListHeader';
import { SocialChannelPreview } from './components/ChannelPreview/SocialChannelPreview';

import { useTheme } from './hooks/useTheme';
import { SideDrawer } from './components/SideDrawer/SideDrawer';
import { SocialMessageInput } from './components/MessageInput/SocialMessageInput';

const apiKey = process.env.REACT_APP_STREAM_KEY;
const user = process.env.REACT_APP_USER_ID;
const userToken = process.env.REACT_APP_USER_TOKEN;

const userToConnect: { id: string; name?: string; image?: string } = {
  id: user!,
  name: user!,
  image: 'https://ca.slack-edge.com/T02RM6X6B-U01J8HMLA4F-d7bab110afb4-512',
};

const filters = { type: 'messaging', members: { $in: [user!] } };

const options = { state: true, watch: true, presence: true, limit: 8 };

const sort: ChannelSort  = {
  last_message_at: -1,
  updated_at: -1,
  cid: 1,
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
  const [isSideDrawerOpen, setSideDrawerOpen] = useState(false);
  const [isNewChat, setNewChat] = useState(false);

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
  // const mode = 'light';

  if (!chatClient) return null;

  return (
    <div className='chat-container'>
      <Chat client={chatClient}>
        <div className={`channel-list-container ${isSideDrawerOpen ? 'sideDrawerOpen' : ''}`}>
          <SocialChannelListHeader  { ...{ isNewChat, isSideDrawerOpen, setNewChat, setSideDrawerOpen}} />
          <ChannelList
            filters={filters}
            List={(props) => (
              <SocialChannelList {...props} />
            )}
            options={options}
            Preview={SocialChannelPreview}
            sort={sort}
          />
          <SocialChannelListFooter />
        </div>
        {isSideDrawerOpen && <SideDrawer onClose={() => setSideDrawerOpen(false)} isSideDrawerOpen={isSideDrawerOpen} />}
        <Channel
          Input={SocialMessageInput}
        >
          <ChannelContainer { ...{ isNewChat, setNewChat }} />
        </Channel>
      </Chat>
    </div>
  );
}

export default App;
