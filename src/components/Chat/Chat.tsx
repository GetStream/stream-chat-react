import React, { PropsWithChildren } from 'react';

import { useChat } from './hooks/useChat';

import { ChatProvider } from '../../context/ChatContext';
import { TranslationProvider } from '../../context/TranslationContext';

import type { StreamChat } from 'stream-chat';

import type { Streami18n } from '../../i18n/Streami18n';

import type {
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
} from '../../types/types';

export type Theme<T extends string = string> =
  | 'commerce dark'
  | 'commerce light'
  | 'livestream dark'
  | 'livestream light'
  | 'messaging dark'
  | 'messaging light'
  | 'team dark'
  | 'team light'
  | T;

export type ChatProps<
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends DefaultChannelType = DefaultChannelType,
  Co extends DefaultCommandType = DefaultCommandType,
  Ev extends DefaultEventType = DefaultEventType,
  Me extends DefaultMessageType = DefaultMessageType,
  Re extends DefaultReactionType = DefaultReactionType,
  Us extends DefaultUserType<Us> = DefaultUserType
> = {
  /** The StreamChat client object */
  client: StreamChat<At, Ch, Co, Ev, Me, Re, Us>;
  /** Instance of Stream i18n */
  i18nInstance?: Streami18n;
  /** Initial status of mobile navigation */
  initialNavOpen?: boolean;
  /**
   *
   * Theme could be used for custom styling of the components
   *
   * You can override the classes used in our components under parent theme class
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
  theme?: Theme;
  /**
   * Windows 10 does not support country flag emojis out of the box.
   * It chooses to render these emojis as characters instead.
   * Stream chat can override this by loading a custom web font that will
   * render images (PNGs or SVGs depending on the platform) instead.
   * Set this prop to true if you want to use these custom emojis for Windows users.
   */
  useImageFlagEmojisOnWindows?: boolean;
};

/**
 *
 * The wrapper component for a StreamChat application. Chat needs to be placed around any other chat components
 * as it provides the ChatContext.
 *
 * ChatContext provides the following values:
 *
 * - channel - the current active channel
 * - client - the client connection
 * - closeMobileNav - function to close mobile navigation
 * - mutes - array of muted users
 * - navOpen - boolean if navigation is open
 * - openMobileNav - function to open mobile navigation
 * - setActiveChannel - a function to set currently active channel
 * - theme - current theme
 * - useImageFlagEmojisOnWindows - replaces flag emojis with images on Windows
 *
 * It also exposes the [withChatContext](https://getstream.github.io/stream-chat-react/#section-withchatcontext) HOC which you can use to consume the [ChatContext](https://getstream.github.io/stream-chat-react/#section-chatcontext).
 * @example ./Chat.md
 */
export const Chat = <
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends DefaultChannelType = DefaultChannelType,
  Co extends DefaultCommandType = DefaultCommandType,
  Ev extends DefaultEventType = DefaultEventType,
  Me extends DefaultMessageType = DefaultMessageType,
  Re extends DefaultReactionType = DefaultReactionType,
  Us extends DefaultUserType<Us> = DefaultUserType
>(
  props: PropsWithChildren<ChatProps<At, Ch, Co, Ev, Me, Re, Us>>,
) => {
  const {
    children,
    client,
    i18nInstance,
    initialNavOpen = true,
    theme = 'messaging light',
    useImageFlagEmojisOnWindows = false,
  } = props;

  const {
    channel,
    closeMobileNav,
    mutes,
    navOpen,
    openMobileNav,
    setActiveChannel,
    translators,
  } = useChat({ client, i18nInstance, initialNavOpen });

  if (!translators.t) return null;

  return (
    <ChatProvider
      value={{
        channel,
        client,
        closeMobileNav,
        mutes,
        navOpen,
        openMobileNav,
        setActiveChannel,
        theme,
        useImageFlagEmojisOnWindows,
      }}
    >
      <TranslationProvider value={translators}>{children}</TranslationProvider>
    </ChatProvider>
  );
};
