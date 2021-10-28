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

  const channelRenderer = () => {
    if (isNewChat) return <NewChat />;
    if (isChatInfoOpen) return <ChatInfo />;

    return <MessageList />;
  };

  return (
    <>
      <Window>
        <SocialChannelHeader />
        {channelRenderer()}
        {!isChatInfoOpen && <MessageInput mentionAllAppUsers />}
      </Window>
      <SocialThread />
    </>
  );
};
