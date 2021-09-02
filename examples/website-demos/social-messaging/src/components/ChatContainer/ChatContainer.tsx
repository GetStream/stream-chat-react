import { useEffect, useState } from 'react';

import type { Channel as StreamChannel } from 'stream-chat';
import { ChannelSort, Event, LiteralStringForUnion, StreamChat } from 'stream-chat';
import { Channel, ChannelList, Chat } from 'stream-chat-react';

import { ChannelContainer } from '../ChannelContainer/ChannelContainer';
import { MessageInputUI } from '../MessageInputUI/MessageInputUI';
import { SocialChannelPreview } from '../ChannelPreview/SocialChannelPreview';
import { SocialEmptyStateIndicator } from '../EmptyStateIndicator/SocialEmptyStateIndicator';
import { SocialMessage } from '../Message/SocialMessageUI';
import { SideDrawer } from '../SideDrawer/SideDrawer';
import { SocialChannelList } from '../SocialChannelList/SocialChannelList';
import { ThreadHeader } from '../ThreadUI/ThreadHeader';
import { GiphyContextProvider } from '../../contexts/GiphyContext';

import { useViewContext } from '../../contexts/ViewContext';

import './ChatContainer.scss';

const urlParams = new URLSearchParams(window.location.search);

const apiKey = urlParams.get('apikey') || process.env.REACT_APP_STREAM_KEY;
const user = urlParams.get('user') || process.env.REACT_APP_USER_ID;
const userImage = process.env.REACT_APP_USER_IMAGE;
// USER_IMAGE|| getRandomImage(), => import { getRandomImage, getRandomTitle } from '../components/Chat/utils';
const userToken = urlParams.get('user_token') || process.env.REACT_APP_USER_TOKEN;
// const targetOrigin = urlParams.get('target_origin') || process.env.REACT_APP_TARGET_ORIGIN;

// const noChannelNameFilter = urlParams.get('no_channel_name_filter') || false;
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

const filters = { type: 'messaging', members: { $in: [user!] } };
//   : { type: 'messaging', name: 'Social Demo', demo: 'social' };

const options = { message_limit: 30 };

const sort: ChannelSort = {
  last_message_at: -1,
  updated_at: -1,
  cid: 1,
};

export type SocialAttachmentType = {};
export type SocialChannelType = {};
export type SocialCommandType = LiteralStringForUnion;
export type SocialEventType = {};
export type SocialMessageType = {};
export type SocialReactionType = {};
export type SocialUserType = { image?: string };

export const ChatContainer: React.FC = () => {
  const [chatClient, setChatClient] = useState<StreamChat>();

  const {
    chatsUnreadCount,
    isListMentions,
    isSideDrawerOpen,
    mentionsUnreadCount,
    setChatsUnreadCount,
    setMentionsUnreadCount,
  } = useViewContext();

  // useChecklist(chatClient, targetOrigin);

  useEffect(() => {
    const initChat = async () => {
      const client = StreamChat.getInstance<
        SocialAttachmentType,
        SocialChannelType,
        SocialCommandType,
        SocialEventType,
        SocialMessageType,
        SocialReactionType,
        SocialUserType
      >(apiKey!);
      await client.connectUser(userToConnect, userToken);
      setChatClient(client);
    };

    initChat();

    return () => {
      chatClient?.disconnectUser();
    };
  }, []); // eslint-disable-line

  useEffect(() => {
    const handlerNewMessageEvent = (event: Event) => {
      if (event.user?.id !== chatClient?.userID) {
        setChatsUnreadCount(chatsUnreadCount + 1);

        const mentions = event.message?.mentioned_users?.filter(
          (user) => user.id === chatClient?.userID,
        );

        if (mentions?.length) {
          setMentionsUnreadCount(mentionsUnreadCount + 1);
        }
      }
    };

    chatClient?.on('message.new', handlerNewMessageEvent);
    return () => chatClient?.off('message.new', handlerNewMessageEvent);
  }, [
    chatClient,
    chatsUnreadCount,
    mentionsUnreadCount,
    setChatsUnreadCount,
    setMentionsUnreadCount,
  ]);

  const customRenderFilter = (channels: StreamChannel[]) => {
    const getTotalChatUnreadCount = channels
      .map((channel) => channel.countUnread())
      .reduce((total, count) => total + count, 0);

    const getTotalMentionsUnreadCount = channels
      .map((channel) => channel.countUnreadMentions())
      .reduce((total, count) => total + count, 0);

    setChatsUnreadCount(getTotalChatUnreadCount);
    setMentionsUnreadCount(getTotalMentionsUnreadCount);

    if (isListMentions) {
      return channels.filter((channel) => {
        return channel.countUnreadMentions() > 0 ? channel : null;
      });
    }
    return channels;
  };

  if (!chatClient) return null;

  return (
    <Chat client={chatClient}>
          <GiphyContextProvider>

      <div className={`channel-list-container ${isSideDrawerOpen ? 'sideDrawerOpen' : ''}`}>
        <ChannelList
          channelRenderFilterFn={customRenderFilter}
          EmptyStateIndicator={SocialEmptyStateIndicator}
          filters={filters}
          List={SocialChannelList}
          options={options}
          Preview={SocialChannelPreview}
          sort={sort}
        />
      </div>
      {isSideDrawerOpen && <SideDrawer />}
      <Channel
        Message={SocialMessage}
        Input={MessageInputUI}
        ThreadHeader={ThreadHeader}>
        <ChannelContainer />
      </Channel>
          </GiphyContextProvider>

    </Chat>
  );
};
