import React, { PropsWithChildren } from 'react';

import { useChat } from './hooks/useChat';
import { useCreateChatContext } from './hooks/useCreateChatContext';
import { CustomStyles, darkModeTheme, useCustomStyles } from './hooks/useCustomStyles';

import { ChatProvider, CustomClasses } from '../../context/ChatContext';
import { SupportedTranslations, TranslationProvider } from '../../context/TranslationContext';

import type { StreamChat } from 'stream-chat';

import type { Streami18n } from '../../i18n/Streami18n';

import type { DefaultStreamChatGenerics } from '../../types/types';

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
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
> = {
  /** The StreamChat client object */
  client: StreamChat<StreamChatGenerics>;
  /** Object containing custom CSS classnames to override the library's default container CSS */
  customClasses?: CustomClasses;
  /** Object containing custom styles to override the default CSS variables */
  customStyles?: CustomStyles;
  /** If true, toggles the CSS variables to the default dark mode color palette */
  darkMode?: boolean;
  /** Sets the default fallback language for UI component translation, defaults to 'en' for English */
  defaultLanguage?: SupportedTranslations;
  /** Instance of Stream i18n */
  i18nInstance?: Streami18n;
  /** Initial status of mobile navigation */
  initialNavOpen?: boolean;
  /** @deprecated and to be removed in a future major release. Use the `customStyles` prop to adjust CSS variables and [customize the theme](https://getstream.io/chat/docs/sdk/react/customization/css_and_theming/#css-variables) of your app  */
  theme?: Theme;
  /** Windows 10 does not support country flag emojis out of the box. It chooses to render these emojis as characters instead. Stream
   * Chat can override this behavior by loading a custom web font that will render images instead (PNGs or SVGs depending on the platform).
   * Set this prop to true if you want to use these custom emojis for Windows users.
   */
  useImageFlagEmojisOnWindows?: boolean;
};

/**
 * Wrapper component for a StreamChat application. Chat needs to be placed around any other chat components
 * as it provides the ChatContext.
 */
export const Chat = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>(
  props: PropsWithChildren<ChatProps<StreamChatGenerics>>,
) => {
  const {
    children,
    client,
    customClasses,
    customStyles,
    darkMode = false,
    defaultLanguage,
    i18nInstance,
    initialNavOpen = true,
    theme = 'messaging light',
    useImageFlagEmojisOnWindows = false,
  } = props;

  const {
    channel,
    closeMobileNav,
    getAppSettings,
    latestMessageDatesByChannels,
    mutes,
    navOpen,
    openMobileNav,
    setActiveChannel,
    translators,
  } = useChat({ client, defaultLanguage, i18nInstance, initialNavOpen });

  useCustomStyles(darkMode ? darkModeTheme : customStyles);

  const chatContextValue = useCreateChatContext({
    channel,
    client,
    closeMobileNav,
    customClasses,
    getAppSettings,
    latestMessageDatesByChannels,
    mutes,
    navOpen,
    openMobileNav,
    setActiveChannel,
    theme,
    useImageFlagEmojisOnWindows,
  });

  if (!translators.t) return null;

  return (
    <ChatProvider value={chatContextValue}>
      <TranslationProvider value={translators}>{children}</TranslationProvider>
    </ChatProvider>
  );
};
