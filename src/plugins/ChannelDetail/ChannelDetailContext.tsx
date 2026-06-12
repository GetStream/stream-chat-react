import type { PropsWithChildren } from 'react';
import React, { useContext, useMemo } from 'react';
import type { Channel } from 'stream-chat';

export type ChannelDetailContextValue = {
  channel: Channel;
};

const ChannelDetailContext = React.createContext<ChannelDetailContextValue | undefined>(
  undefined,
);

export type ChannelDetailProviderProps = PropsWithChildren<{
  channel: Channel;
}>;

export const ChannelDetailProvider = ({
  channel,
  children,
}: ChannelDetailProviderProps) => {
  const value = useMemo(() => ({ channel }), [channel]);

  return (
    <ChannelDetailContext.Provider value={value}>
      {children}
    </ChannelDetailContext.Provider>
  );
};

export const useChannelDetailContext = () => {
  const contextValue = useContext(ChannelDetailContext);

  if (!contextValue) {
    throw new Error(
      'The useChannelDetailContext hook was called outside of ChannelDetailProvider.',
    );
  }

  return contextValue;
};
