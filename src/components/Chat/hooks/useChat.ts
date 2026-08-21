import { useEffect, useRef, useState } from 'react';

import type {
  EventPayload,
  OwnUserResponse,
  StreamChat,
  UserMuteResponse,
} from 'stream-chat';

export type UseChatParams = {
  client: StreamChat;
};

export const useChat = ({ client }: UseChatParams) => {
  const [mutes, setMutes] = useState<Array<UserMuteResponse>>([]);
  const [latestMessageDatesByChannels, setLatestMessageDatesByChannels] = useState({});

  const clientMutes = (client.user as OwnUserResponse)?.mutes ?? [];

  const appSettings = useRef<ReturnType<StreamChat['getAppSettings']> | null>(null);

  const getAppSettings = () => {
    if (appSettings.current) {
      return appSettings.current;
    }
    appSettings.current = client.getAppSettings();
    return appSettings.current;
  };

  useEffect(() => {
    if (!client) return;

    const version = process.env.STREAM_CHAT_REACT_VERSION;

    const userAgent = client.getUserAgent();
    if (!userAgent.includes('stream-chat-react')) {
      // result looks like: 'stream-chat-react-2.3.2-stream-chat-javascript-client-browser-2.2.2'
      // the upper-case text between double underscores is replaced with the actual semantic version of the library
      client.setUserAgent(`stream-chat-react-${version}-${userAgent}`);
    }

    client.threads.registerSubscriptions();
    client.polls.registerSubscriptions();
    client.reminders.registerSubscriptions();
    client.reminders.initTimers();

    return () => {
      client.threads.unregisterSubscriptions();
      client.polls.unregisterSubscriptions();
      client.reminders.unregisterSubscriptions();
      client.reminders.clearTimers();
    };
  }, [client]);

  useEffect(() => {
    setMutes(clientMutes);

    const handleEvent = (event: EventPayload<'notification.mutes_updated'>) => {
      setMutes(event.me?.mutes || []);
    };

    const subscription = client.on('notification.mutes_updated', handleEvent);
    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientMutes?.length]);

  useEffect(() => {
    setLatestMessageDatesByChannels({});
  }, [client.user?.id]);

  return {
    getAppSettings,
    latestMessageDatesByChannels,
    mutes,
  };
};
