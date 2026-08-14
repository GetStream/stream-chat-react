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
 * Deliberately does not throw outside a `Channel` subtree — it is the non-throwing counterpart to
 * {@link useChannel}, used to probe whether a channel is in scope (see `useNotificationTarget`).
 * The `Partial` return keeps that honest: `channel` is genuinely absent outside the provider.
 */
export const useChannelInstanceContext = (): Partial<ChannelInstanceContextValue> =>
  useContext(ChannelInstanceContext) ?? {};
