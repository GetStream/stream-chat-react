// @ts-check

import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';

import Dayjs from 'dayjs';
import { ChatContext, TranslationContext } from '../../context';
import { Streami18n } from '../../i18n';

import { version } from '../../../package.json';

/**
 * Chat - Wrapper component for Chat. The needs to be placed around any other chat components.
 * This Chat component provides the ChatContext to all other components.
 *
 * The ChatContext provides the following props:
 *
 * - client (the client connection)
 * - channels (the list of channels)
 * - setActiveChannel (a function to set the currently active channel)
 * - channel (the currently active channel)
 *
 * It also exposes the withChatContext HOC which you can use to consume the ChatContext
 *
 * @example ../../docs/Chat.md
 * @typedef {import('stream-chat').Channel | undefined} ChannelState
 * @type {React.FC<{ client: import('types').StreamChatReactClient, theme?: string, i18nInstance?: Streami18n, initialNavOpen?: boolean }>}
 */
const Chat = ({
  client,
  theme = 'messaging light',
  i18nInstance,
  initialNavOpen = true,
  children,
}) => {
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
    if (!client) return;
    const userAgent = client.getUserAgent();
    if (!userAgent.includes('stream-chat-react')) {
      // should result in something like:
      // 'stream-chat-react-2.3.2-stream-chat-javascript-client-browser-2.2.2'
      client.setUserAgent(`stream-chat-react-${version}-${userAgent}`);
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
    if (i18nInstance instanceof Streami18n) streami18n = i18nInstance;
    else streami18n = new Streami18n({ language: 'en' });

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

  if (!translators.t) return null;

  return (
    <ChatContext.Provider
      value={{
        client,
        theme,
        channel,
        mutes,
        navOpen,
        setActiveChannel,
        openMobileNav,
        closeMobileNav,
      }}
    >
      <TranslationContext.Provider value={translators}>
        {children}
      </TranslationContext.Provider>
    </ChatContext.Provider>
  );
};

Chat.propTypes = {
  /** The StreamChat client object */
  client: /** @type {PropTypes.Validator<import('stream-chat').StreamChat>} */ (PropTypes
    .object.isRequired),
  /**
   *
   * Theme could be used for custom styling of the components.
   *
   * You can override the classes used in our components under parent theme class.
   *
   * e.g. If you want to build a theme where background of message is black
   *
   * ```
   *  <Chat client={client} theme={demo}>
   *    <Channel>
   *      <MessageList />
   *    </Channel>
   *  </Chat>
   * ```
   *
   * ```scss
   *  .demo.str-chat {
   *    .str-chat__message-simple {
   *      &-text-inner {
   *        background-color: black;
   *      }
   *    }
   *  }
   * ```
   *
   * Built in available themes:
   *
   *  - `messaging light`
   *  - `messaging dark`
   *  - `team light`
   *  - `team dark`
   *  - `commerce light`
   *  - `commerce dark`
   *  - `livestream light`
   *  - `livestream dark`
   */
  theme: PropTypes.string,
  /** navOpen initial status */
  initialNavOpen: PropTypes.bool,
};

export default Chat;
