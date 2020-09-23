// @ts-check

import React from 'react';
import PropTypes from 'prop-types';

import { ChatContext, TranslationContext } from '../../context';

import { useChat } from './hooks/useChat';

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
 * @type {React.FC<{ client: import('types').StreamChatReactClient, theme?: string, i18nInstance?: import('../../i18n').Streami18n, initialNavOpen?: boolean }>}
 */
const Chat = ({
  client,
  theme = 'messaging light',
  i18nInstance,
  initialNavOpen = true,
  children,
}) => {
  const {
    setActiveChannel,
    navOpen,
    mutes,
    channel,
    openMobileNav,
    closeMobileNav,
    translators,
  } = useChat({ client, initialNavOpen, i18nInstance });

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
