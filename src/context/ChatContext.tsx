import React, { PropsWithChildren, useContext } from 'react';

import type { AppSettingsAPIResponse, Channel, Mute } from 'stream-chat';

import { getDisplayName } from './utils/getDisplayName';
import type { ChatProps } from '../components/Chat/Chat';
import type { DefaultStreamChatGenerics, UnknownType } from '../types/types';
import type { ChannelsQueryState } from '../components/Chat/hooks/useChannelsQueryState';

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

type ChannelCID = string; // e.g.: "messaging:general"

export type ChatContextValue<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
> = {
  /**
   * Indicates, whether a channels query has been triggered within ChannelList by its channels pagination controller.
   */
  channelsQueryState: ChannelsQueryState;
  closeMobileNav: () => void;
  getAppSettings: () => Promise<AppSettingsAPIResponse<StreamChatGenerics>> | null;
  latestMessageDatesByChannels: Record<ChannelCID, Date>;
  mutes: Array<Mute<StreamChatGenerics>>;
  openMobileNav: () => void;
  /**
   * Sets active channel to be rendered within Channel component.
   * @param newChannel
   * @param watchers
   * @param event
   */
  setActiveChannel: (
    newChannel?: Channel<StreamChatGenerics>,
    watchers?: { limit?: number; offset?: number },
    event?: React.BaseSyntheticEvent,
  ) => void;
  useImageFlagEmojisOnWindows: boolean;
  /**
   * Active channel used to render the contents of the Channel component.
   */
  channel?: Channel<StreamChatGenerics>;
  /**
   * Object through which custom classes can be set for main container components of the SDK.
   */
  customClasses?: CustomClasses;
  navOpen?: boolean;
} & Partial<Pick<ChatProps<StreamChatGenerics>, 'isMessageAIGenerated'>> &
  Required<Pick<ChatProps<StreamChatGenerics>, 'theme' | 'client'>>;

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
