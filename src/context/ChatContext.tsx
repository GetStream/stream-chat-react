import React, { PropsWithChildren, useContext } from 'react';

import type { AppSettingsAPIResponse, Channel, Mute, StreamChat } from 'stream-chat';

import { getDisplayName } from './utils/getDisplayName';
import type { Theme } from '../components/Chat/Chat';
import type { DefaultStreamChatGenerics, UnknownType } from '../types/types';

type CSSClasses =
  | 'chat'
  | 'chatContainer'
  | 'channel'
  | 'channelList'
  | 'message'
  | 'messageList'
  | 'thread'
  | 'threadList'
  | 'virtualMessage'
  | 'virtualizedMessageList';

export type CustomClasses = Partial<Record<CSSClasses, string>>;

export type ChatContextValue<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
> = {
  client: StreamChat<StreamChatGenerics>;
  closeMobileNav: () => void;
  getAppSettings: () => Promise<AppSettingsAPIResponse<StreamChatGenerics>> | null;
  latestMessageDatesByChannels: { [key: string]: Date };
  mutes: Array<Mute<StreamChatGenerics>>;
  openMobileNav: () => void;
  setActiveChannel: (
    newChannel?: Channel<StreamChatGenerics>,
    watchers?: { limit?: number; offset?: number },
    event?: React.BaseSyntheticEvent,
  ) => void;
  /** @deprecated */
  theme: Theme;
  useImageFlagEmojisOnWindows: boolean;
  channel?: Channel<StreamChatGenerics>;
  customClasses?: CustomClasses;
  navOpen?: boolean;
};

export const ChatContext = React.createContext<ChatContextValue | undefined>(undefined);

export const ChatProvider = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>({
  children,
  value,
}: PropsWithChildren<{
  value: ChatContextValue<StreamChatGenerics>;
}>) => (
  <ChatContext.Provider value={(value as unknown) as ChatContextValue}>
    {children}
  </ChatContext.Provider>
);

export const useChatContext = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>(
  componentName?: string,
) => {
  const contextValue = useContext(ChatContext);

  if (!contextValue) {
    console.warn(
      `The useChatContext hook was called outside of the ChatContext provider. Make sure this hook is called within a child of the Chat component. The errored call is located in the ${componentName} component.`,
    );

    return {} as ChatContextValue<StreamChatGenerics>;
  }

  return (contextValue as unknown) as ChatContextValue<StreamChatGenerics>;
};

/**
 * Typescript currently does not support partial inference so if ChatContext
 * typing is desired while using the HOC withChatContext the Props for the
 * wrapped component must be provided as the first generic.
 */
export const withChatContext = <
  P extends UnknownType,
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>(
  Component: React.ComponentType<P>,
) => {
  const WithChatContextComponent = (props: Omit<P, keyof ChatContextValue<StreamChatGenerics>>) => {
    const chatContext = useChatContext<StreamChatGenerics>();

    return <Component {...(props as P)} {...chatContext} />;
  };
  WithChatContextComponent.displayName = `WithChatContext${getDisplayName(Component)}`;
  return WithChatContextComponent;
};
