import React, { useEffect } from 'react';

import { MessageInput, MessageList, useChatContext, Window } from 'stream-chat-react';

import { ChatInfo } from '../ChatInfo/ChatInfo';
import { NewChat } from '../NewChat/NewChat';
import { SocialChannelHeader } from '../ChannelHeader/SocialChannelHeader';
import {
  SocialAttachmentType,
  SocialChannelType,
  SocialCommandType,
  SocialEventType,
  SocialMessageType,
  SocialReactionType,
  SocialUserType,
} from '../ChatContainer/ChatContainer';
import { SocialThread } from '../Thread/SocialThread';

import { useViewContext } from '../../contexts/ViewContext';

import type { EventHandler } from 'stream-chat';

import './ChannelContainer.scss';

export const ChannelContainer: React.FC = () => {
  const { channel, client } = useChatContext<
    SocialAttachmentType,
    SocialChannelType,
    SocialCommandType,
    SocialEventType,
    SocialMessageType,
    SocialReactionType,
    SocialUserType
  >();

  const {
    chatsUnreadCount,
    isChatInfoOpen,
    isNewChat,
    mentionsUnreadCount,
    setChatsUnreadCount,
    setMentionsUnreadCount,
  } = useViewContext();

  useEffect(() => {
    const handlerNewMessageEvent: EventHandler<
      SocialAttachmentType,
      SocialChannelType,
      SocialCommandType,
      SocialEventType,
      SocialMessageType,
      SocialReactionType,
      SocialUserType
    > = (event) => {
      const { message, user } = event;

      if (user?.id !== client?.userID && channel?.cid !== message?.cid) {
        setChatsUnreadCount(chatsUnreadCount + 1);

        const mentions = message?.mentioned_users?.filter((user) => user.id === client?.userID);

        if (mentions?.length) {
          setMentionsUnreadCount(mentionsUnreadCount + 1);
        }
      }
    };

    client?.on('message.new', handlerNewMessageEvent);
    return () => client?.off('message.new', handlerNewMessageEvent);
  }, [
    channel,
    client,
    chatsUnreadCount,
    mentionsUnreadCount,
    setChatsUnreadCount,
    setMentionsUnreadCount,
  ]);

  // const getCommandIcon = (name?: string) => {
  //   let description;
  //   let Icon;
  
  //   switch (name) {
  //     case 'ban':
  //       description = '/ban [@username] [text]';
  //       Icon = Ban;
  //       break;
  //     case 'flag':
  //       description = '/flag [@username]';
  //       Icon = Flag;
  //       break;
  //     case 'giphy':
  //       description = '/giphy [query]';
  //       Icon = Giphy;
  //       break;
  //     case 'mute':
  //       description = '[@username]';
  //       Icon = Mute;
  //       break;
  //     case 'unban':
  //       description = '[@username]';
  //       Icon = Unban;
  //       break;
  //     case 'unmute':
  //       description = '[@username]';
  //       Icon = Unmute;
  //       break;
  //     default:
  //       break;
  //   }
  
  //   return { description, Icon };
  // };

  return (
    <>
      <Window>
        <SocialChannelHeader />
        {isNewChat ? <NewChat /> : <MessageList />}
        {isChatInfoOpen && !isNewChat ? <ChatInfo /> : <MessageList />}
        {!isChatInfoOpen && <MessageInput mentionAllAppUsers />}
      </Window>
      <SocialThread />
    </>
  );
};
