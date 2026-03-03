import React, { useContext } from 'react';
import type { PropsWithChildren } from 'react';
import type {
  AppSettingsAPIResponse,
  Channel,
  Mute,
  SearchController,
} from 'stream-chat';

import type { ChatProps } from '../components/Chat/Chat';
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

type ChannelConfId = string; // e.g.: "messaging:general"

export type ChatContextValue = {
  /**
   * Indicates, whether a channels query has been triggered within ChannelList by its channels pagination controller.
   */
  channelsQueryState: ChannelsQueryState;
  closeMobileNav: () => void;
  getAppSettings: () => Promise<AppSettingsAPIResponse> | null;
  latestMessageDatesByChannels: Record<ChannelConfId, Date>;
  mutes: Array<Mute>;
  openMobileNav: () => void;
  /** Instance of SearchController class that allows to control all the search operations. */
  searchController: SearchController;
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
