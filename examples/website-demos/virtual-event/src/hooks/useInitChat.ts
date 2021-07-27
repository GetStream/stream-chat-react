import { useEffect, useState } from 'react';
import { Channel as StreamChannel, StreamChat } from 'stream-chat';

import { ChatType, useEventContext } from '../contexts/EventContext';

const urlParams = new URLSearchParams(window.location.search);

const apiKey = urlParams.get('apikey') || (process.env.REACT_APP_STREAM_KEY as string);
const userId = urlParams.get('user') || (process.env.REACT_APP_USER_ID as string);
const userToken = urlParams.get('user_token') || (process.env.REACT_APP_USER_TOKEN as string);

export const useInitChat = () => {
  const [chatClient, setChatClient] = useState<StreamChat>();
  const [currentChannel, setCurrentChannel] = useState<StreamChannel>();

  const { chatType, eventName } = useEventContext();

  const switchChannel = async (type: ChatType, event?: string) => {
    if (!chatClient || type === 'direct') return;

    const channelId = event && type !== 'global' ? `${type}-${event}` : type;
    const newChannel = chatClient.channel('livestream', channelId);

    await newChannel.watch({ watchers: { limit: 100 } });
    setCurrentChannel(newChannel);
  };

  useEffect(() => {
    const initChat = async () => {
      const client = StreamChat.getInstance(apiKey);

      if (process.env.REACT_APP_CHAT_SERVER_ENDPOINT) {
        client.setBaseURL(process.env.REACT_APP_CHAT_SERVER_ENDPOINT);
      }

      await client.connectUser(
        {
          id: userId,
          name: userId,
          image: process.env.REACT_APP_USER_IMAGE,
        },
        userToken,
      );

      const globalChannel = client.channel('livestream', 'global', { name: 'global' });
      await globalChannel.watch({ watchers: { limit: 100 } });

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

  return { chatClient, currentChannel };
};
