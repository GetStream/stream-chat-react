import React, { PropsWithChildren, useContext } from 'react';

import type { AppSettingsAPIResponse, Channel, Mute, StreamChat } from 'stream-chat';

import { getDisplayName } from './utils/getDisplayName';
import type { Theme } from '../components/Chat/Chat';
import type {
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
  UnknownType,
} from '../types/types';

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
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends DefaultChannelType = DefaultChannelType,
  Co extends DefaultCommandType = DefaultCommandType,
  Ev extends DefaultEventType = DefaultEventType,
  Me extends DefaultMessageType = DefaultMessageType,
  Re extends DefaultReactionType = DefaultReactionType,
  Us extends DefaultUserType<Us> = DefaultUserType
> = {
  client: StreamChat<At, Ch, Co, Ev, Me, Re, Us>;
  closeMobileNav: () => void;
  mutes: Mute<Us>[];
  openMobileNav: () => void;
  setActiveChannel: (
    newChannel?: Channel<At, Ch, Co, Ev, Me, Re, Us>,
    watchers?: { limit?: number; offset?: number },
    event?: React.BaseSyntheticEvent,
  ) => void;
  /** @deprecated */
  theme: Theme;
  useImageFlagEmojisOnWindows: boolean;
  appSettings?: AppSettingsAPIResponse<Co>;
  channel?: Channel<At, Ch, Co, Ev, Me, Re, Us>;
  customClasses?: CustomClasses;
  navOpen?: boolean;
};

export const ChatContext = React.createContext<ChatContextValue | undefined>(undefined);

export const ChatProvider = <
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends DefaultChannelType = DefaultChannelType,
  Co extends DefaultCommandType = DefaultCommandType,
  Ev extends DefaultEventType = DefaultEventType,
  Me extends DefaultMessageType = DefaultMessageType,
  Re extends DefaultReactionType = DefaultReactionType,
  Us extends DefaultUserType<Us> = DefaultUserType
>({
  children,
  value,
}: PropsWithChildren<{
  value: ChatContextValue<At, Ch, Co, Ev, Me, Re, Us>;
}>) => (
  <ChatContext.Provider value={(value as unknown) as ChatContextValue}>
    {children}
  </ChatContext.Provider>
);

export const useChatContext = <
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends DefaultChannelType = DefaultChannelType,
  Co extends DefaultCommandType = DefaultCommandType,
  Ev extends DefaultEventType = DefaultEventType,
  Me extends DefaultMessageType = DefaultMessageType,
  Re extends DefaultReactionType = DefaultReactionType,
  Us extends DefaultUserType<Us> = DefaultUserType
>(
  componentName?: string,
) => {
  const contextValue = useContext(ChatContext);

  if (!contextValue) {
    console.warn(
      `The useChatContext hook was called outside of the ChatContext provider. Make sure this hook is called within a child of the Chat component. The errored call is located in the ${componentName} component.`,
    );

    return {} as ChatContextValue<At, Ch, Co, Ev, Me, Re, Us>;
  }

  return (contextValue as unknown) as ChatContextValue<At, Ch, Co, Ev, Me, Re, Us>;
};

/**
 * Typescript currently does not support partial inference so if ChatContext
 * typing is desired while using the HOC withChatContext the Props for the
 * wrapped component must be provided as the first generic.
 */
export const withChatContext = <
  P extends UnknownType,
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends DefaultChannelType = DefaultChannelType,
  Co extends DefaultCommandType = DefaultCommandType,
  Ev extends DefaultEventType = DefaultEventType,
  Me extends DefaultMessageType = DefaultMessageType,
  Re extends DefaultReactionType = DefaultReactionType,
  Us extends DefaultUserType<Us> = DefaultUserType
>(
  Component: React.ComponentType<P>,
): React.FC<Omit<P, keyof ChatContextValue<At, Ch, Co, Ev, Me, Re, Us>>> => {
  const WithChatContextComponent = (
    props: Omit<P, keyof ChatContextValue<At, Ch, Co, Ev, Me, Re, Us>>,
  ) => {
    const chatContext = useChatContext<At, Ch, Co, Ev, Me, Re, Us>();

    return <Component {...(props as P)} {...chatContext} />;
  };
  WithChatContextComponent.displayName = `WithChatContext${getDisplayName(Component)}`;
  return WithChatContextComponent;
};
