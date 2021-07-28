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

const urlParams = new URLSearchParams(window.location.search);

const apiKey = urlParams.get('apikey') || process.env.REACT_APP_STREAM_KEY;
const user = urlParams.get('user') || process.env.REACT_APP_USER_ID;
const userImage = process.env.USER_IMAGE;
const userToken = urlParams.get('user_token') || process.env.REACT_APP_USER_TOKEN;
// const targetOrigin = urlParams.get('target_origin') || process.env.REACT_APP_TARGET_ORIGIN;

const noChannelNameFilter = urlParams.get('no_channel_name_filter') || false;
const skipNameImageSet = urlParams.get('skip_name_image_set') || false;

const userToConnect: { id: string; name?: string; image?: string } = {
  id: user!,
  name: user!,
  image: userImage,
};

if (skipNameImageSet) {
    delete userToConnect.name;
    delete userToConnect.image;
  }

const filters = noChannelNameFilter
  ? { type: 'messaging', members: { $in: [user!] } }
  : { type: 'messaging', name: 'Social Demo', demo: 'social' };

const options = { message_limit: 30 };

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

    // useChecklist(chatClient, targetOrigin);

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