import type { PropsWithChildren } from 'react';
import React, { useContext } from 'react';
import type { Channel, LocalMessage } from 'stream-chat';

export type ChannelNotifications = Array<{
  id: string;
  text: string;
  type: 'success' | 'error';
}>;

export type ChannelState = {
  error?: Error | null;
  hasMore?: boolean;
  hasMoreNewer?: boolean;
  highlightedMessageId?: string;
  loading?: boolean;
  loadingMore?: boolean;
  loadingMoreNewer?: boolean;
  messages?: LocalMessage[];
  pinnedMessages?: LocalMessage[];
};

export type ChannelStateContextValue = {
  channel: Channel;
  notifications: ChannelNotifications;
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
