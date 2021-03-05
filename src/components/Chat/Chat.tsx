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
  UnknownType,
} from '../../../types/types';

export type Theme =
  | 'commerce dark'
  | 'commerce light'
  | 'livestream dark'
  | 'livestream light'
  | 'messaging dark'
  | 'messaging light'
  | 'team dark'
  | 'team light';

export type ChatProps<
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
> = {
  /** The StreamChat client object */
  client: StreamChat<At, Ch, Co, Ev, Me, Re, Us>;
  /** Instance of Stream i18n */
  i18nInstance?: Streami18n;
  /** Initial status of mobile navigation */
  initialNavOpen?: boolean;
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
  theme?: Theme;
};

/**
 *
 * Chat - Wrapper component for Chat. The needs to be placed around any other chat components.
 * This Chat component provides the ChatContext to all other components.
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
 *
 * It also exposes the withChatContext HOC which you can use to consume the ChatContext
 * @example ./Chat.md
 */
export const Chat = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>(
  props: PropsWithChildren<ChatProps<At, Ch, Co, Ev, Me, Re, Us>>,
) => {
  const {
    children,
    client,
    i18nInstance,
    initialNavOpen = true,
    theme = 'messaging light',
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
    <ChatProvider<At, Ch, Co, Ev, Me, Re, Us>
      value={{
        channel,
        client,
        closeMobileNav,
        mutes,
        navOpen,
        openMobileNav,
        setActiveChannel,
        theme,
      }}
    >
      <TranslationProvider value={translators}>{children}</TranslationProvider>
    </ChatProvider>
  );
};
