import type { PropsWithChildren } from 'react';
import React, { useContext } from 'react';

import { getDisplayName } from './utils/getDisplayName';

import type {
  AppSettingsAPIResponse,
  Channel,
  Mute,
  SearchController,
} from 'stream-chat';
import type { ChatProps } from '../components/Chat/Chat';
import type { UnknownType } from '../types/types';
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

export type ChatContextValue = {
  /**
   * Indicates, whether a channels query has been triggered within ChannelList by its channels pagination controller.
   */
  channelsQueryState: ChannelsQueryState;
  closeMobileNav: () => void;
  getAppSettings: () => Promise<AppSettingsAPIResponse> | null;
  latestMessageDatesByChannels: Record<ChannelCID, Date>;
  mutes: Array<Mute>;
  openMobileNav: () => void;
  /** Instance of SearchController class that allows to control all the search operations. */
  searchController: SearchController<StreamChatGenerics>;
  /**
   * Sets active channel to be rendered within Channel component.
   * @param newChannel
   * @param watchers
   * @param event
   */
  setActiveChannel: (
    newChannel?: Channel,
    watchers?: { limit?: number; offset?: number },
    event?: React.BaseSyntheticEvent,
  ) => void;
  useImageFlagEmojisOnWindows: boolean;
  /**
   * Active channel used to render the contents of the Channel component.
   */
  channel?: Channel;
  /**
   * Object through which custom classes can be set for main container components of the SDK.
   */
  customClasses?: CustomClasses;
  navOpen?: boolean;
} & Partial<Pick<ChatProps, 'isMessageAIGenerated'>> &
  Required<Pick<ChatProps, 'theme' | 'client'>>;

export const ChatContext = React.createContext<ChatContextValue | undefined>(undefined);

export const ChatProvider = ({
  children,
  value,
}: PropsWithChildren<{
  value: ChatContextValue;
}>) => (
  <ChatContext.Provider value={value as unknown as ChatContextValue}>
    {children}
  </ChatContext.Provider>
);

export const useChatContext = (componentName?: string) => {
  const contextValue = useContext(ChatContext);

  if (!contextValue) {
    console.warn(
      `The useChatContext hook was called outside of the ChatContext provider. Make sure this hook is called within a child of the Chat component. The errored call is located in the ${componentName} component.`,
    );

    return {} as ChatContextValue;
  }

  return contextValue as unknown as ChatContextValue;
};

/**
 * Typescript currently does not support partial inference so if ChatContext
 * typing is desired while using the HOC withChatContext the Props for the
 * wrapped component must be provided as the first generic.
 */
export const withChatContext = <P extends UnknownType>(
  Component: React.ComponentType<P>,
) => {
  const WithChatContextComponent = (props: Omit<P, keyof ChatContextValue>) => {
    const chatContext = useChatContext();

    return <Component {...(props as P)} {...chatContext} />;
  };
  WithChatContextComponent.displayName = `WithChatContext${getDisplayName(Component)}`;
  return WithChatContextComponent;
};
