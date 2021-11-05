import { useCallback, useEffect, useState } from 'react';
import Dayjs from 'dayjs';

import {
  isLanguageSupported,
  SupportedTranslations,
  TranslationContextValue,
} from '../../../context/TranslationContext';
import { Streami18n } from '../../../i18n';
import { version } from '../../../version';

import type { AppSettingsAPIResponse, Channel, Event, Mute, StreamChat } from 'stream-chat';

import type {
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
} from '../../../types/types';

export type UseChatParams<
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends DefaultChannelType = DefaultChannelType,
  Co extends DefaultCommandType = DefaultCommandType,
  Ev extends DefaultEventType = DefaultEventType,
  Me extends DefaultMessageType = DefaultMessageType,
  Re extends DefaultReactionType = DefaultReactionType,
  Us extends DefaultUserType<Us> = DefaultUserType
> = {
  client: StreamChat<At, Ch, Co, Ev, Me, Re, Us>;
  defaultLanguage?: SupportedTranslations;
  i18nInstance?: Streami18n;
  initialNavOpen?: boolean;
};

export const useChat = <
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends DefaultChannelType = DefaultChannelType,
  Co extends DefaultCommandType = DefaultCommandType,
  Ev extends DefaultEventType = DefaultEventType,
  Me extends DefaultMessageType = DefaultMessageType,
  Re extends DefaultReactionType = DefaultReactionType,
  Us extends DefaultUserType<Us> = DefaultUserType
>({
  client,
  defaultLanguage = 'en',
  i18nInstance,
  initialNavOpen,
}: UseChatParams<At, Ch, Co, Ev, Me, Re, Us>) => {
  const [translators, setTranslators] = useState<TranslationContextValue>({
    t: (key: string) => key,
    tDateTimeParser: (input) => Dayjs(input),
    userLanguage: 'en',
  });

  const [appSettings, setAppSettings] = useState<AppSettingsAPIResponse<Co>>();
  const [channel, setChannel] = useState<Channel<At, Ch, Co, Ev, Me, Re, Us>>();
  const [mutes, setMutes] = useState<Array<Mute<Us>>>([]);
  const [navOpen, setNavOpen] = useState(initialNavOpen);

  const clientMutes = client.user?.mutes;

  const closeMobileNav = () => setNavOpen(false);
  const openMobileNav = () => setTimeout(() => setNavOpen(true), 100);

  useEffect(() => {
    const setAgentAndSettings = async () => {
      const userAgent = client.getUserAgent();
      if (!userAgent.includes('stream-chat-react')) {
        // result looks like: 'stream-chat-react-2.3.2-stream-chat-javascript-client-browser-2.2.2'
        client.setUserAgent(`stream-chat-react-${version}-${userAgent}`);
      }

      try {
        const settingsResponse = await client.getAppSettings();
        setAppSettings(settingsResponse);
      } catch (err) {
        setAppSettings(undefined);
      }
    };

    setAgentAndSettings();
  }, []);

  useEffect(() => {
    setMutes(clientMutes || []);

    const handleEvent = (event: Event<At, Ch, Co, Ev, Me, Re, Us>) => {
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
      activeChannel?: Channel<At, Ch, Co, Ev, Me, Re, Us>,
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

  return {
    appSettings,
    channel,
    closeMobileNav,
    mutes,
    navOpen,
    openMobileNav,
    setActiveChannel,
    translators,
  };
};
