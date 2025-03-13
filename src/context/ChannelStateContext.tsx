import React, { useContext } from 'react';
import type { PropsWithChildren } from 'react';
import type {
  APIErrorResponse,
  Channel,
  ChannelConfigWithInfo,
  DraftResponse,
  ErrorFromResponse,
  MessageResponse,
  Mute,
  ChannelState as StreamChannelState,
  Thread,
} from 'stream-chat';

import type {
  ChannelUnreadUiState,
  GiphyVersions,
  ImageAttachmentSizeHandler,
  UnknownType,
  VideoAttachmentSizeHandler,
} from '../types/types';
import type { URLEnrichmentConfig } from '../components/MessageInput/hooks/useLinkPreviews';

export type ChannelNotifications = Array<{
  id: string;
  text: string;
  type: 'success' | 'error';
}>;

export type StreamMessage =
  // FIXME: we should use only one of the two (either formatted or unformatted)
  (ReturnType<StreamChannelState['formatMessage']> | MessageResponse) & {
    customType?: string;
    errorStatusCode?: number;
    error?: ErrorFromResponse<APIErrorResponse>;
    editing?: boolean;
    date?: Date;
  };

export type ChannelState = {
  suppressAutoscroll: boolean;
  error?: Error | null;
  hasMore?: boolean;
  hasMoreNewer?: boolean;
  highlightedMessageId?: string;
  loading?: boolean;
  loadingMore?: boolean;
  loadingMoreNewer?: boolean;
  members?: StreamChannelState['members'];
  messageDraft: DraftResponse | null;
  messages?: StreamMessage[];
  pinnedMessages?: StreamMessage[];
  read?: StreamChannelState['read'];
  thread?: StreamMessage | null;
  threadHasMore?: boolean;
  threadInstance?: Thread;
  threadLoadingMore?: boolean;
  threadMessages?: StreamMessage[];
  threadSuppressAutoscroll?: boolean;
  typing?: StreamChannelState['typing'];
  watcherCount?: number;
  watchers?: StreamChannelState['watchers'];
};

export type ChannelStateContextValue = Omit<ChannelState, 'typing'> & {
  channel: Channel;
  channelCapabilities: Record<string, boolean>;
  channelConfig: ChannelConfigWithInfo | undefined;
  imageAttachmentSizeHandler: ImageAttachmentSizeHandler;
  multipleUploads: boolean;
  notifications: ChannelNotifications;
  shouldGenerateVideoThumbnail: boolean;
  videoAttachmentSizeHandler: VideoAttachmentSizeHandler;
  acceptedFiles?: string[];
  channelUnreadUiState?: ChannelUnreadUiState;
  debounceURLEnrichmentMs?: URLEnrichmentConfig['debounceURLEnrichmentMs'];
  dragAndDropWindow?: boolean;
  enrichURLForPreview?: URLEnrichmentConfig['enrichURLForPreview'];
  findURLFn?: URLEnrichmentConfig['findURLFn'];
  giphyVersion?: GiphyVersions;
  maxNumberOfFiles?: number;
  messageDraftsEnabled?: boolean;
  mutes?: Array<Mute>;
  onLinkPreviewDismissed?: URLEnrichmentConfig['onLinkPreviewDismissed'];
  watcher_count?: number;
};

export const ChannelStateContext = React.createContext<
  ChannelStateContextValue | undefined
>(undefined);

export const ChannelStateProvider = ({
  children,
  value,
}: PropsWithChildren<{
  value: ChannelStateContextValue;
}>) => (
  <ChannelStateContext.Provider value={value as unknown as ChannelStateContextValue}>
    {children}
  </ChannelStateContext.Provider>
);

export const useChannelStateContext = (componentName?: string) => {
  const contextValue = useContext(ChannelStateContext);

  if (!contextValue) {
    console.warn(
      `The useChannelStateContext hook was called outside of the ChannelStateContext provider. Make sure this hook is called within a child of the Channel component. The errored call is located in the ${componentName} component.`,
    );

    return {} as ChannelStateContextValue;
  }

  return contextValue as unknown as ChannelStateContextValue;
};

/**
 * Typescript currently does not support partial inference, so if ChannelStateContext
 * typing is desired while using the HOC withChannelStateContext, the Props for the
 * wrapped component must be provided as the first generic.
 */
export const withChannelStateContext = <P extends UnknownType>(
  Component: React.ComponentType<P>,
) => {
  const WithChannelStateContextComponent = (
    props: Omit<P, keyof ChannelStateContextValue>,
  ) => {
    const channelStateContext = useChannelStateContext();

    return <Component {...(props as P)} {...channelStateContext} />;
  };

  WithChannelStateContextComponent.displayName = (
    Component.displayName ||
    Component.name ||
    'Component'
  ).replace('Base', '');

  return WithChannelStateContextComponent;
};
