import { useCallback, useState, useEffect } from 'react';
import Dayjs from 'dayjs';

import { Streami18n } from '../../../i18n';

import { version } from '../../../../package.json';

export const useChat = ({ client, initialNavOpen, i18nInstance }) => {
  const [translators, setTranslators] = useState(
    /** @type { Required<import('types').TranslationContextValue>} */ ({
      t: /** @param {string} key */ (key) => key,
      tDateTimeParser: (input) => Dayjs(input),
      userLanguage: '',
    }),
  );
  const [mutes, setMutes] = useState(
    /** @type {import('stream-chat').Mute[]} */ ([]),
  );
  const [navOpen, setNavOpen] = useState(initialNavOpen);
  const [channel, setChannel] = useState(
    /** @type {ChannelState} */ (undefined),
  );

  const openMobileNav = () => setTimeout(() => setNavOpen(true), 100);
  const closeMobileNav = () => setNavOpen(false);
  const clientMutes = client?.user?.mutes;

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

    /** @param {import('stream-chat').Event} e */
    const handleEvent = (e) => {
      if (e.type === 'notification.mutes_updated') setMutes(e.me?.mutes || []);
    };

    if (client) client.on(handleEvent);
    return () => client && client.off(handleEvent);
  }, [client, clientMutes]);

  useEffect(() => {
    let streami18n;

    if (i18nInstance instanceof Streami18n) {
      streami18n = i18nInstance;
    } else {
      streami18n = new Streami18n({ language: 'en' });
    }

    streami18n.registerSetLanguageCallback((t) =>
      setTranslators((prevTranslator) => ({ ...prevTranslator, t })),
    );

    streami18n.getTranslators().then((translator) => {
      if (translator) {
        setTranslators({
          ...translator,
          userLanguage: client?.user?.language || '',
        });
      }
    });
  }, [client, i18nInstance]);

  const setActiveChannel = useCallback(
    /**
     * @param {ChannelState} activeChannel
     * @param {{ limit?: number; offset?: number }} [watchers]
     * @param {React.BaseSyntheticEvent} [e]
     */
    async (activeChannel, watchers = {}, e) => {
      if (e && e.preventDefault) e.preventDefault();

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
