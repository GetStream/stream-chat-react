import React, { useContext } from 'react';
import type { PropsWithChildren } from 'react';
import type {
  ChannelManager,
  SearchController,
  StreamChat,
  UserMuteResponse,
} from 'stream-chat';

import type { ChatProps } from '../components/Chat/Chat';

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

type ChannelConfId = string; // e.g.: "messaging:general"

export type ChatContextValue = {
  /**
   * The client's `ChannelManager` (`client.channelManager`) — used to query and manage channels
   * across one or more channel lists (the channel-list data source + cross-list ownership). The
   * lists themselves are registered on it by the application
   * (`client.channelManager.insertPaginator({ paginator })`); the SDK creates none.
   */
  channelManager: ChannelManager;
  getAppSettings: () => ReturnType<StreamChat['getAppSettings']> | null;
  latestMessageDatesByChannels: Record<ChannelConfId, Date>;
  mutes: Array<UserMuteResponse>;
  /** Instance of SearchController class that allows to control all the search operations. */
  searchController: SearchController;
  useImageFlagEmojisOnWindows: boolean;
  /**
   * Object through which custom classes can be set for main container components of the SDK.
   */
  customClasses?: CustomClasses;
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
