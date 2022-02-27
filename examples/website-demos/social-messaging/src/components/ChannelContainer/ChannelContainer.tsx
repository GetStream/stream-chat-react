import React, { useEffect } from 'react';

import { MessageInput, MessageList, useChatContext, Window } from 'stream-chat-react';

import { ChatInfo } from '../ChatInfo/ChatInfo';
import { NewChat } from '../NewChat/NewChat';
import { SocialChannelHeader } from '../ChannelHeader/SocialChannelHeader';
import { StreamChatGenerics } from '../../types';
import { SocialThread } from '../Thread/SocialThread';

import { useUnreadContext } from '../../contexts/UnreadContext';
import { useViewContext } from '../../contexts/ViewContext';

import type { EventHandler } from 'stream-chat';

import './ChannelContainer.scss';
import { ChatInfoItem } from '../ChatInfo/ChatInfoItem';

export const ChannelContainer: React.FC = () => {
  const { channel, client } = useChatContext<StreamChatGenerics>();

  const {
    chatsUnreadCount,
    mentionsUnreadCount,
    setChatsUnreadCount,
    setMentionsUnreadCount,
  } = useUnreadContext();

  const { isChatInfoOpen, chatInfoItem, isNewChat } = useViewContext();

  useEffect(() => {
    const handlerNewMessageEvent: EventHandler<StreamChatGenerics> = (event) => {
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
    if (chatInfoItem) return <ChatInfoItem />;

    return <MessageList />;
  };

  return (
    <>
      <Window>
        <SocialChannelHeader />
        {channelRenderer()}
        {!isChatInfoOpen && !chatInfoItem && <MessageInput mentionAllAppUsers />}
      </Window>
      <SocialThread />
    </>
  );
};
