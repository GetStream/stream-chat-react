import React, { PropsWithChildren, useContext } from 'react';

import { getDisplayName } from './utils/getDisplayName';

import type { Channel, Mute, StreamChat } from 'stream-chat';

import type { Theme } from '../components/Chat';

import type {
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
  UnknownType,
} from '../../types/types';

export type ChatContextValue<
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
> = {
  client: StreamChat<At, Ch, Co, Ev, Me, Re, Us>;
  theme: Theme;
  channel?: Channel<At, Ch, Co, Ev, Me, Re, Us>;
  closeMobileNav?: () => void;
  mutes?: Mute<Us>[];
  navOpen?: boolean;
  openMobileNav?: () => void;
  setActiveChannel?: (
    newChannel?: Channel<At, Ch, Co, Ev, Me, Re, Us>,
    watchers?: { limit?: number; offset?: number },
    event?: React.SyntheticEvent,
  ) => void;
};

export const ChatContext = React.createContext({} as ChatContextValue);

export const ChatProvider = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
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
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>() =>
  (useContext(ChatContext) as unknown) as ChatContextValue<
    At,
    Ch,
    Co,
    Ev,
    Me,
    Re,
    Us
  >;

/**
 * Typescript currently does not support partial inference so if ChatContext
 * typing is desired while using the HOC withChatContext the Props for the
 * wrapped component must be provided as the first generic.
 */
export const withChatContext = <
  P extends UnknownType,
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>(
  Component: React.ComponentType<P>,
): React.FC<Omit<P, keyof ChatContextValue<At, Ch, Co, Ev, Me, Re, Us>>> => {
  const WithChatContextComponent = (
    props: Omit<P, keyof ChatContextValue<At, Ch, Co, Ev, Me, Re, Us>>,
  ) => {
    const chatContext = useChatContext<At, Ch, Co, Ev, Me, Re, Us>();

    return <Component {...(props as P)} {...chatContext} />;
  };
  WithChatContextComponent.displayName = `WithChatContext${getDisplayName(
    Component,
  )}`;
  return WithChatContextComponent;
};
