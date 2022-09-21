import React, { PropsWithChildren, useContext } from 'react';

import type {
  Channel,
  ChannelConfigWithInfo,
  MessageResponse,
  Mute,
  ChannelState as StreamChannelState,
} from 'stream-chat';

import type {
  DefaultStreamChatGenerics,
  GiphyVersions,
  ImageAttachmentSizeHandler,
  UnknownType,
  VideoAttachmentSizeHandler,
} from '../types/types';

export type ChannelNotifications = Array<{
  id: string;
  text: string;
  type: 'success' | 'error';
}>;

export type StreamMessage<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
> =
  | ReturnType<StreamChannelState<StreamChatGenerics>['formatMessage']>
  | MessageResponse<StreamChatGenerics>;

export type ChannelState<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
> = {
  suppressAutoscroll: boolean;
  error?: Error | null;
  hasMore?: boolean;
  hasMoreNewer?: boolean;
  highlightedMessageId?: string;
  loading?: boolean;
  loadingMore?: boolean;
  loadingMoreNewer?: boolean;
  members?: StreamChannelState<StreamChatGenerics>['members'];
  messages?: StreamMessage<StreamChatGenerics>[];
  pinnedMessages?: StreamMessage<StreamChatGenerics>[];
  quotedMessage?: StreamMessage<StreamChatGenerics>;
  read?: StreamChannelState<StreamChatGenerics>['read'];
  thread?: StreamMessage<StreamChatGenerics> | null;
  threadHasMore?: boolean;
  threadLoadingMore?: boolean;
  threadMessages?: StreamMessage<StreamChatGenerics>[];
  threadSuppressAutoscroll?: boolean;
  typing?: StreamChannelState<StreamChatGenerics>['typing'];
  watcherCount?: number;
  watchers?: StreamChannelState<StreamChatGenerics>['watchers'];
};

export type ChannelStateContextValue<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
> = Omit<ChannelState<StreamChatGenerics>, 'typing'> & {
  channel: Channel<StreamChatGenerics>;
  channelCapabilities: Record<string, boolean>;
  channelConfig: ChannelConfigWithInfo<StreamChatGenerics> | undefined;
  imageAttachmentSizeHandler: ImageAttachmentSizeHandler;
  multipleUploads: boolean;
  notifications: ChannelNotifications;
  shouldGenerateVideoThumbnail: boolean;
  videoAttachmentSizeHandler: VideoAttachmentSizeHandler;
  acceptedFiles?: string[];
  dragAndDropWindow?: boolean;
  giphyVersion?: GiphyVersions;
  maxNumberOfFiles?: number;
  mutes?: Array<Mute<StreamChatGenerics>>;
  watcher_count?: number;
};

export const ChannelStateContext = React.createContext<ChannelStateContextValue | undefined>(
  undefined,
);

export const ChannelStateProvider = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>({
  children,
  value,
}: PropsWithChildren<{
  value: ChannelStateContextValue<StreamChatGenerics>;
}>) => (
  <ChannelStateContext.Provider value={(value as unknown) as ChannelStateContextValue}>
    {children}
  </ChannelStateContext.Provider>
);

export const useChannelStateContext = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>(
  componentName?: string,
) => {
  const contextValue = useContext(ChannelStateContext);

  if (!contextValue) {
    console.warn(
      `The useChannelStateContext hook was called outside of the ChannelStateContext provider. Make sure this hook is called within a child of the Channel component. The errored call is located in the ${componentName} component.`,
    );

    return {} as ChannelStateContextValue<StreamChatGenerics>;
  }

  return (contextValue as unknown) as ChannelStateContextValue<StreamChatGenerics>;
};

/**
 * Typescript currently does not support partial inference, so if ChannelStateContext
 * typing is desired while using the HOC withChannelStateContext, the Props for the
 * wrapped component must be provided as the first generic.
 */
export const withChannelStateContext = <
  P extends UnknownType,
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>(
  Component: React.ComponentType<P>,
) => {
  const WithChannelStateContextComponent = (
    props: Omit<P, keyof ChannelStateContextValue<StreamChatGenerics>>,
  ) => {
    const channelStateContext = useChannelStateContext<StreamChatGenerics>();

    return <Component {...(props as P)} {...channelStateContext} />;
  };

  WithChannelStateContextComponent.displayName = (
    Component.displayName ||
    Component.name ||
    'Component'
  ).replace('Base', '');

  return WithChannelStateContextComponent;
};
