import { useCallback, useEffect, useRef, useState } from 'react';

import {
  defaultDateTimeParser,
  isLanguageSupported,
  SupportedTranslations,
  TranslationContextValue,
} from '../../../context/TranslationContext';
import { Streami18n } from '../../../i18n';
import { version } from '../../../version';

import type { AppSettingsAPIResponse, Channel, Event, Mute, StreamChat } from 'stream-chat';

import type { DefaultStreamChatGenerics } from '../../../types/types';

export type UseChatParams<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
> = {
  client: StreamChat<StreamChatGenerics>;
  defaultLanguage?: SupportedTranslations;
  i18nInstance?: Streami18n;
  initialNavOpen?: boolean;
};

export const useChat = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>({
  client,
  defaultLanguage = 'en',
  i18nInstance,
  initialNavOpen,
}: UseChatParams<StreamChatGenerics>) => {
  const [translators, setTranslators] = useState<TranslationContextValue>({
    t: (key: string) => key,
    tDateTimeParser: defaultDateTimeParser,
    userLanguage: 'en',
  });

  const [channel, setChannel] = useState<Channel<StreamChatGenerics>>();
  const [mutes, setMutes] = useState<Array<Mute<StreamChatGenerics>>>([]);
  const [navOpen, setNavOpen] = useState(initialNavOpen);
  const [latestMessageDatesByChannels, setLatestMessageDatesByChannels] = useState({});

  const clientMutes = (client.user?.mutes as Array<Mute<StreamChatGenerics>>) || [];

  const closeMobileNav = () => setNavOpen(false);
  const openMobileNav = () => setTimeout(() => setNavOpen(true), 100);

  const appSettings = useRef<Promise<AppSettingsAPIResponse<StreamChatGenerics>> | null>(null);

  const getAppSettings = () => {
    if (appSettings.current) {
      return appSettings.current;
    }
    appSettings.current = client.getAppSettings();
    return appSettings.current;
  };

  useEffect(() => {
    if (client) {
      const userAgent = client.getUserAgent();
      if (!userAgent.includes('stream-chat-react')) {
        // result looks like: 'stream-chat-react-2.3.2-stream-chat-javascript-client-browser-2.2.2'
        client.setUserAgent(`stream-chat-react-${version}-${userAgent}`);
      }
    }
  }, [client]);

  useEffect(() => {
    setMutes(clientMutes);

    const handleEvent = (event: Event<StreamChatGenerics>) => {
      setMutes(event.me?.mutes || []);
    };

    client.on('notification.mutes_updated', handleEvent);
    return () => client.off('notification.mutes_updated', handleEvent);
  }, [clientMutes?.length]);

  useEffect(() => {
    let userLanguage = client.user?.language;

    if (!userLanguage) {
      const browserLanguage = window.navigator.language.slice(0, 2); // just get language code, not country-specific version
      userLanguage = isLanguageSupported(browserLanguage) ? browserLanguage : defaultLanguage;
    }

    const streami18n = i18nInstance || new Streami18n({ language: userLanguage });

    streami18n.registerSetLanguageCallback((t) =>
      setTranslators((prevTranslator) => ({ ...prevTranslator, t })),
    );

    streami18n.getTranslators().then((translator) => {
      setTranslators({
        ...translator,
        userLanguage: userLanguage || defaultLanguage,
      });
    });
  }, [i18nInstance]);

  const setActiveChannel = useCallback(
    async (
      activeChannel?: Channel<StreamChatGenerics>,
      watchers: { limit?: number; offset?: number } = {},
      event?: React.BaseSyntheticEvent,
    ) => {
      if (event && event.preventDefault) event.preventDefault();

      if (activeChannel && Object.keys(watchers).length) {
        await activeChannel.query({ watch: true, watchers });
      }

      setChannel(activeChannel);
      closeMobileNav();
    },
    [],
  );

  useEffect(() => {
    setLatestMessageDatesByChannels({});
  }, [client.user?.id]);

  return {
    channel,
    closeMobileNav,
    getAppSettings,
    latestMessageDatesByChannels,
    mutes,
    navOpen,
    openMobileNav,
    setActiveChannel,
    translators,
  };
};
