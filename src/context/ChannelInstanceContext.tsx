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
 * Returns the channel provided by the nearest `Channel`, or an empty object outside one. Unlike
 * {@link useChannel}, it does not throw and does not read the thread's channel.
 */
export const useChannelInstanceContext = (): Partial<ChannelInstanceContextValue> =>
  useContext(ChannelInstanceContext) ?? {};
