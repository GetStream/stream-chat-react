import { useEffect, useState } from 'react';

import { ChannelSort, LiteralStringForUnion, StreamChat } from 'stream-chat';
import { Channel, ChannelList, Chat } from 'stream-chat-react';

import { ChannelContainer } from '../ChannelContainer/ChannelContainer';
import { SideDrawer } from '../SideDrawer/SideDrawer';
import { SocialChannelList } from '../SocialChannelList/SocialChannelList';
import { SocialChannelListHeader } from '../SocialChannelList/SocialChannelListHeader';
import { SocialChannelPreview } from '../ChannelPreview/SocialChannelPreview';
import { SocialMessageInput } from '../MessageInput/SocialMessageInput';

import { useViewContext } from '../../contexts/ViewContext';

import './ChatContainer.scss';

const apiKey = process.env.REACT_APP_STREAM_KEY;
const user = process.env.REACT_APP_USER_ID;
const userImage = process.env.USER_IMAGE;
const userToken = process.env.REACT_APP_USER_TOKEN;

const userToConnect: { id: string; name?: string; image?: string } = {
  id: user!,
  name: user!,
  image: userImage,
};

const filters = { type: 'messaging', members: { $in: [user!] } };
const options = { message_limit: 20 };

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

export const ChatContainer: React.FC = () => {
    const [chatClient, setChatClient] = useState<StreamChat | null>(null);

    const { isSideDrawerOpen } = useViewContext();

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

    if (!chatClient) return null;

    return (
        <Chat client={chatClient}>
            <div className={`channel-list-container ${isSideDrawerOpen ? 'sideDrawerOpen' : ''}`}>
                <SocialChannelListHeader />
                <ChannelList
                    filters={filters}
                    List={SocialChannelList}
                    options={options}
                    Preview={SocialChannelPreview}
                    sendChannelsToList
                    sort={sort}
                />
            </div>
            {isSideDrawerOpen && <SideDrawer />}
            <Channel Input={SocialMessageInput} >
                <ChannelContainer />
            </Channel>
        </Chat>
    );
}