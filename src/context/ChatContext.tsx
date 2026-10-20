import React, { useContext } from 'react';
import type { PropsWithChildren } from 'react';
import type {
  ChannelManager,
  SearchController,
  StreamChat,
  UserMuteResponse,
} from 'stream-chat';

import type { ChatProps } from '../components/Chat/Chat';
import { requireContext } from './requireContext';

type CSSClasses =
  | 'chat'
  | 'channel'
  | 'channelList'
  | 'message'
  | 'messageList'
  | 'thread'
  | 'threadList'
  | 'virtualMessage'
  | 'virtualizedMessageList';

export type CustomClasses = Partial<Record<CSSClasses, string>>;

export type ChatContextValue = {
  /**
   * The client's `ChannelManager`, which queries and manages channels across channel lists. The
   * application registers its lists with `client.channelManager.insertPaginator({ paginator })`;
   * the SDK creates none.
   */
  channelManager: ChannelManager;
  getAppSettings: () => ReturnType<StreamChat['getAppSettings']> | null;
  /** Users muted by the current user. */
  mutes: Array<UserMuteResponse>;
  /** Controls all search operations. */
  searchController: SearchController;
  useImageFlagEmojisOnWindows: boolean;
  /** Class names for the main container components of the SDK. */
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

export const useChatContext = () =>
  requireContext(useContext(ChatContext), 'useChatContext', 'Chat');
