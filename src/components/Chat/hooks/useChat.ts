import { useCallback, useEffect, useState } from 'react';
import Dayjs from 'dayjs';

import { Streami18n } from '../../../i18n';

import { version } from '../../../../package.json';

import type { Channel, Event, Mute, StreamChat } from 'stream-chat';

import type { TranslationContextValue } from '../../../context/TranslationContext';

import type {
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
  UnknownType,
} from '../../../../types/types';

export type UseChatParams<
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
> = {
  client: StreamChat<At, Ch, Co, Ev, Me, Re, Us>;
  i18nInstance?: Streami18n;
  initialNavOpen?: boolean;
};

export const useChat = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends DefaultUserType<Us> = DefaultUserType
>({
  client,
  i18nInstance,
  initialNavOpen,
}: UseChatParams<At, Ch, Co, Ev, Me, Re, Us>) => {
  const [translators, setTranslators] = useState<TranslationContextValue>({
    t: (key) => key,
    tDateTimeParser: (input) => Dayjs(input),
    userLanguage: 'en',
  });

  const [channel, setChannel] = useState<Channel<At, Ch, Co, Ev, Me, Re, Us>>();
  const [mutes, setMutes] = useState<Array<Mute<Us>>>([]);
  const [navOpen, setNavOpen] = useState(initialNavOpen);

  const clientMutes = client?.user?.mutes;

  const closeMobileNav = () => setNavOpen(false);
  const openMobileNav = () => setTimeout(() => setNavOpen(true), 100);

  useEffect(() => {
    if (client) {
      const userAgent = client.getUserAgent();
      if (!userAgent.includes('stream-chat-react')) {
        /**
         * results in something like: 'stream-chat-react-2.3.2-stream-chat-javascript-client-browser-2.2.2'
         */
        client.setUserAgent(`stream-chat-react-${version}-${userAgent}`);
      }
    }
  }, [client]);

  useEffect(() => {
    setMutes(clientMutes || []);

    const handleEvent = (event: Event<At, Ch, Co, Ev, Me, Re, Us>) => {
      if (event.type === 'notification.mutes_updated')
        setMutes(event.me?.mutes || []);
    };

    if (client) client.on(handleEvent);
    return () => {
      if (client) {
        client.off(handleEvent);
      }
    };
  }, [client, clientMutes]);

  useEffect(() => {
    const streami18n =
      i18nInstance instanceof Streami18n
        ? i18nInstance
        : new Streami18n({ language: 'en' });

    streami18n.registerSetLanguageCallback((t) =>
      setTranslators((prevTranslator) => ({ ...prevTranslator, t })),
    );

    streami18n.getTranslators().then((translator) => {
      if (translator) {
        setTranslators({
          ...translator,
          userLanguage: client?.user?.language || 'en',
        });
      }
    });
  }, [client, i18nInstance]);

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
    channel,
    closeMobileNav,
    mutes,
    navOpen,
    openMobileNav,
    setActiveChannel,
    translators,
  };
};
