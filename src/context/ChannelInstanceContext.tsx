import type { PropsWithChildren } from 'react';
import React, { useContext } from 'react';
import type { Channel } from 'stream-chat';

export type ChannelInstanceContextValue = {
  channel: Channel;
};

export const ChannelInstanceContext = React.createContext<
  ChannelInstanceContextValue | undefined
>(undefined);

export const ChannelInstanceProvider = ({
  children,
  value,
}: PropsWithChildren<{
  value: ChannelInstanceContextValue;
}>) => (
  <ChannelInstanceContext.Provider value={value}>
    {children}
  </ChannelInstanceContext.Provider>
);

/**
 * Non-throwing counterpart to {@link useChannel}: returns an empty object outside a `Channel`
 * subtree, for callers that only need to know whether a channel is in scope.
 */
export const useChannelInstanceContext = (): Partial<ChannelInstanceContextValue> =>
  useContext(ChannelInstanceContext) ?? {};
