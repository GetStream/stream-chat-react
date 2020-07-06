import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';

import { ChatContext, TranslationContext } from '../../context';
import { Streami18n } from '../../i18n';

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
 */
const Chat = ({ client, theme, i18nInstance, initialNavOpen, children }) => {
  const [translators, setTranslators] = useState({});
  const [mutes, setMutes] = useState([]);
  const [navOpen, setNavOpen] = useState(initialNavOpen);
  const [channel, setChannel] = useState({});

  const openMobileNav = () => setTimeout(() => setNavOpen(true), 100);
  const closeMobileNav = () => setNavOpen(false);

  useEffect(() => {
    setMutes(client?.user?.mutes || []);

    const handleEvent = (e) => {
      if (e.type === 'notification.mutes_updated') setMutes(e.me.mutes || []);
    };
    if (client) client.on(handleEvent);
    return () => client && client.off(handleEvent);
  }, [client]);

  useEffect(() => {
    let streami18n;
    if (i18nInstance instanceof Streami18n) streami18n = i18nInstance;
    else streami18n = new Streami18n({ language: 'en' });

    streami18n.registerSetLanguageCallback((t) =>
      setTranslators((prevTranslator) => ({ ...prevTranslator, t })),
    );
    streami18n.getTranslators().then(setTranslators);
  }, [i18nInstance]);

  const setActiveChannel = useCallback(
    async (activeChannel, watchers = {}, e) => {
      if (e && e.preventDefault) e.preventDefault();

      if (Object.keys(watchers).length)
        await activeChannel.query({ watch: true, watchers });

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

Chat.defaultProps = {
  initialNavOpen: true,
  theme: 'messaging light',
};

Chat.propTypes = {
  /** The StreamChat client object */
  client: PropTypes.object.isRequired,
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
