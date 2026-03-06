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
  <ChannelInstanceContext.Provider
    value={value as unknown as ChannelInstanceContextValue}
  >
    {children}
  </ChannelInstanceContext.Provider>
);

export const useChannelInstanceContext = () => {
  const contextValue = useContext(ChannelInstanceContext);

  if (!contextValue) {
    return {} as ChannelInstanceContextValue;
  }

  return contextValue as unknown as ChannelInstanceContextValue;
};
