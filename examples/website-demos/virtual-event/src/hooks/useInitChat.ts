import { useEffect, useState } from 'react';
import { Channel as StreamChannel, Event, StreamChat } from 'stream-chat';

import { getRandomImage, getRandomTitle } from '../components/Chat/utils';
import { ChatType, useEventContext } from '../contexts/EventContext';

import { StreamChatGenerics } from '../types';

const urlParams = new URLSearchParams(window.location.search);

const apiKey = urlParams.get('apikey') || (process.env.REACT_APP_STREAM_KEY as string);
const userId = urlParams.get('user') || (process.env.REACT_APP_USER_ID as string);
const userToken = urlParams.get('user_token') || (process.env.REACT_APP_USER_TOKEN as string);

export const useInitChat = () => {
  const [chatClient, setChatClient] = useState<StreamChat>();
  const [currentChannel, setCurrentChannel] = useState<StreamChannel>();
  const [dmUnread, setDmUnread] = useState(false);
  const [eventUnread, setEventUnread] = useState(false);
  const [globalUnread, setGlobalUnread] = useState(false);
  const [qaUnread, setQaUnread] = useState(false);

  const { chatType, eventName } = useEventContext();

  useEffect(() => {
    if (globalUnread && chatType === 'global') setGlobalUnread(false);
  }, [chatType, globalUnread]);

  useEffect(() => {
    if (qaUnread && chatType === 'qa') setQaUnread(false);
  }, [chatType, qaUnread]);

  useEffect(() => {
    if (dmUnread && chatType === 'direct') setDmUnread(false);
  }, [chatType, dmUnread]);

  useEffect(() => {
    if (eventUnread && (chatType === 'main-event' || chatType === 'room')) setEventUnread(false);
  }, [chatType, eventUnread]);

  const setUnreadStatus = (id: string, boolean: boolean) => {
    switch (id) {
      case 'global':
        setGlobalUnread(boolean);
        break;

      case 'qa':
        setQaUnread(boolean);
        break;

      default:
        setEventUnread(boolean);
    }
  };

  const switchChannel = async (type: ChatType, event?: string) => {
    if (!chatClient || type === 'direct') {
      return setCurrentChannel(undefined);
    }

    const channelIsEvent = type === 'main-event' || type === 'room';

    const channelId = event && channelIsEvent ? `${type}-${event}` : type;
    const newChannel = chatClient.channel('livestream', channelId);

    await newChannel.watch({ watchers: { limit: 100 } });

    setUnreadStatus(channelId, false);
    setCurrentChannel(newChannel);
  };

  useEffect(() => {
    const handleMessage = (event: Event) => {
      if (!currentChannel?.id || !event.channel_id) return;

      if (currentChannel.id !== event.channel_id) {
        setUnreadStatus(event.channel_id, true);
      }
    };

    if (chatClient && currentChannel) {
      chatClient.on('message.new', handleMessage);
    }

    return () => chatClient?.off('message.new', handleMessage);
  }, [chatClient, currentChannel]);

  const handleDmMessages = (event: Event) => {
    if (event.channel_type !== 'messaging') return;
    setDmUnread(true);
  };

  useEffect(() => {
    const initChat = async () => {
      const client = StreamChat.getInstance<StreamChatGenerics>(apiKey);

      if (process.env.REACT_APP_CHAT_SERVER_ENDPOINT) {
        client.setBaseURL(process.env.REACT_APP_CHAT_SERVER_ENDPOINT);
      }

      await client.connectUser(
        {
          id: userId,
          name: userId,
          image: process.env.REACT_APP_USER_IMAGE || getRandomImage(),
          title: userId === 'daddy-dan' ? 'Admin' : getRandomTitle(),
        },
        userToken,
      );

      const globalChannel = client.channel('livestream', 'global', { name: 'global' });
      await globalChannel.watch({ watchers: { limit: 100 } });

      client.on('message.new', handleDmMessages);
      client.on('notification.message_new', handleDmMessages);

      setChatClient(client);
      setCurrentChannel(globalChannel);
    };

    if (!chatClient) {
      initChat();
    } else {
      switchChannel(chatType, eventName);
    }
  }, [chatType, eventName]); // eslint-disable-line

  useEffect(() => {
    return () => {
      chatClient?.disconnectUser();
      setChatClient(undefined);
      setCurrentChannel(undefined);
    };
  }, []); // eslint-disable-line

  return { chatClient, currentChannel, dmUnread, globalUnread, eventUnread, qaUnread };
};
