import { useEffect, useState } from 'react';

import type { Channel } from 'stream-chat';
import { ChannelSort, StreamChat } from 'stream-chat';
import { Channel as ChannelComponent, ChannelList, Chat } from 'stream-chat-react';

import { ChannelContainer } from '../ChannelContainer/ChannelContainer';
import { Snackbar } from '../MessageActions/SnackBar';
import { SocialMessageListNotifications } from '../MessageListNotifications/SocialMessageListNotifications';
import { SocialMessageInput } from '../MessageInput/SocialMessageInput';
import { SocialChannelPreview } from '../ChannelPreview/SocialChannelPreview';
import { SocialEmptyStateIndicator } from '../EmptyStateIndicator/SocialEmptyStateIndicator';
import { SocialMessage } from '../Message/SocialMessageUI';
import { SideDrawer } from '../SideDrawer/SideDrawer';
import { SocialChannelList } from '../ChannelList/SocialChannelList';
import { SocialSuggestionList } from '../SuggestionList/SocialSuggestionList';
import { SocialSuggestionListHeader } from '../SuggestionList/SocialSuggestionListHeader';
import { SocialThreadHeader } from '../Thread/SocialThreadHeader';

import { useActionsContext } from '../../contexts/ActionsContext';
import { GiphyContextProvider } from '../../contexts/GiphyContext';
import { useUnreadContext } from '../../contexts/UnreadContext';
import { useViewContext } from '../../contexts/ViewContext';
import { StreamChatGenerics } from '../../types';

import './ChatContainer.scss';

const urlParams = new URLSearchParams(window.location.search);

const apiKey = urlParams.get('apikey') || process.env.REACT_APP_STREAM_KEY;
const user = urlParams.get('user') || process.env.REACT_APP_USER_ID;
const userImage = process.env.REACT_APP_USER_IMAGE;
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
};

export const ChatContainer: React.FC = () => {
  const [chatClient, setChatClient] = useState<StreamChat<StreamChatGenerics>>();

  const { snackbar } = useActionsContext();
  const { setChatsUnreadCount, setMentionsUnreadCount } = useUnreadContext();
  const { isListMentions, isSideDrawerOpen } = useViewContext();

  // useChecklist(chatClient, targetOrigin);

  useEffect(() => {
    const initChat = async () => {
      const client = StreamChat.getInstance<StreamChatGenerics>(apiKey!);
      await client.connectUser(userToConnect, userToken);
      setChatClient(client);
    };

    initChat();

    return () => {
      chatClient?.disconnectUser();
    };
  }, []); // eslint-disable-line

  const customRenderFilter = (channels: Channel<StreamChatGenerics>[]) => {
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
        {snackbar && <Snackbar />}
        <ChannelComponent
          AutocompleteSuggestionHeader={SocialSuggestionListHeader}
          AutocompleteSuggestionItem={SocialSuggestionList}
          Message={SocialMessage}
          Input={SocialMessageInput}
          MessageListNotifications={SocialMessageListNotifications}
          ThreadHeader={SocialThreadHeader}
        >
          <ChannelContainer />
        </ChannelComponent>
      </GiphyContextProvider>
    </Chat>
  );
};
