import React, { useEffect } from 'react';

import { MessageInput, MessageList, useChatContext, Window } from 'stream-chat-react';

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
        console.log('in the no channel');
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

  return (
    <>
      <Window>
        <SocialChannelHeader />
        {isNewChat ? <NewChat /> : <MessageList />}
        <MessageInput mentionAllAppUsers />
      </Window>
      {/* <Thread /> */}
    </>
  );
};
