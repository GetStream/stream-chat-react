import React, { PropsWithChildren, useContext } from 'react';

import type {
  Channel,
  ChannelConfigWithInfo,
  MessageResponse,
  Mute,
  ChannelState as StreamChannelState,
} from 'stream-chat';

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

export type ChannelNotifications = Array<{
  id: string;
  text: string;
  type: 'success' | 'error';
}>;

export type StreamMessage<
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends DefaultChannelType = DefaultChannelType,
  Co extends DefaultCommandType = DefaultCommandType,
  Ev extends DefaultEventType = DefaultEventType,
  Me extends DefaultMessageType = DefaultMessageType,
  Re extends DefaultReactionType = DefaultReactionType,
  Us extends DefaultUserType<Us> = DefaultUserType
> =
  | ReturnType<StreamChannelState<At, Ch, Co, Ev, Me, Re, Us>['formatMessage']>
  | MessageResponse<At, Ch, Co, Me, Re, Us>;

export type ChannelState<
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends DefaultChannelType = DefaultChannelType,
  Co extends DefaultCommandType = DefaultCommandType,
  Ev extends DefaultEventType = DefaultEventType,
  Me extends DefaultMessageType = DefaultMessageType,
  Re extends DefaultReactionType = DefaultReactionType,
  Us extends DefaultUserType<Us> = DefaultUserType
> = {
  error?: Error | null;
  hasMore?: boolean;
  loading?: boolean;
  loadingMore?: boolean;
  members?: StreamChannelState<At, Ch, Co, Ev, Me, Re, Us>['members'];
  messages?: StreamMessage<At, Ch, Co, Ev, Me, Re, Us>[];
  pinnedMessages?: StreamMessage<At, Ch, Co, Ev, Me, Re, Us>[];
  quotedMessage?: StreamMessage<At, Ch, Co, Ev, Me, Re, Us>;
  read?: StreamChannelState<At, Ch, Co, Ev, Me, Re, Us>['read'];
  thread?: StreamMessage<At, Ch, Co, Ev, Me, Re, Us> | null;
  threadHasMore?: boolean;
  threadLoadingMore?: boolean;
  threadMessages?: StreamMessage<At, Ch, Co, Ev, Me, Re, Us>[];
  typing?: StreamChannelState<At, Ch, Co, Ev, Me, Re, Us>['typing'];
  watcherCount?: number;
  watchers?: StreamChannelState<At, Ch, Co, Ev, Me, Re, Us>['watchers'];
};

export type ChannelStateContextValue<
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends DefaultChannelType = DefaultChannelType,
  Co extends DefaultCommandType = DefaultCommandType,
  Ev extends DefaultEventType = DefaultEventType,
  Me extends DefaultMessageType = DefaultMessageType,
  Re extends DefaultReactionType = DefaultReactionType,
  Us extends DefaultUserType<Us> = DefaultUserType
> = Omit<ChannelState<At, Ch, Co, Ev, Me, Re, Us>, 'typing'> & {
  channel: Channel<At, Ch, Co, Ev, Me, Re, Us>;
  channelCapabilities: Record<string, boolean>;
  channelConfig: ChannelConfigWithInfo<Co> | undefined;
  multipleUploads: boolean;
  notifications: ChannelNotifications;
  acceptedFiles?: string[];
  maxNumberOfFiles?: number;
  mutes?: Mute<Us>[];
  watcher_count?: number;
};

export const ChannelStateContext = React.createContext<ChannelStateContextValue | undefined>(
  undefined,
);

export const ChannelStateProvider = <
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
  value: ChannelStateContextValue<At, Ch, Co, Ev, Me, Re, Us>;
}>) => (
  <ChannelStateContext.Provider value={(value as unknown) as ChannelStateContextValue}>
    {children}
  </ChannelStateContext.Provider>
);

export const useChannelStateContext = <
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
  const contextValue = useContext(ChannelStateContext);

  if (!contextValue) {
    console.warn(
      `The useChannelStateContext hook was called outside of the ChannelStateContext provider. Make sure this hook is called within a child of the Channel component. The errored call is located in the ${componentName} component.`,
    );

    return {} as ChannelStateContextValue<At, Ch, Co, Ev, Me, Re, Us>;
  }

  return (contextValue as unknown) as ChannelStateContextValue<At, Ch, Co, Ev, Me, Re, Us>;
};

/**
 * Typescript currently does not support partial inference, so if ChannelStateContext
 * typing is desired while using the HOC withChannelStateContext, the Props for the
 * wrapped component must be provided as the first generic.
 */
export const withChannelStateContext = <
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
): React.FC<Omit<P, keyof ChannelStateContextValue<At, Ch, Co, Ev, Me, Re, Us>>> => {
  const WithChannelStateContextComponent = (
    props: Omit<P, keyof ChannelStateContextValue<At, Ch, Co, Ev, Me, Re, Us>>,
  ) => {
    const channelStateContext = useChannelStateContext<At, Ch, Co, Ev, Me, Re, Us>();

    return <Component {...(props as P)} {...channelStateContext} />;
  };

  WithChannelStateContextComponent.displayName = (
    Component.displayName ||
    Component.name ||
    'Component'
  ).replace('Base', '');

  return WithChannelStateContextComponent;
};
