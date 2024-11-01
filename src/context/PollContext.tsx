import React, { PropsWithChildren, useContext } from 'react';
import type { Poll } from 'stream-chat';
import type { DefaultStreamChatGenerics } from '../types';

export type PollContextValue<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
> = {
  poll: Poll<StreamChatGenerics>;
};

export const PollContext = React.createContext<PollContextValue | undefined>(undefined);

export const PollProvider = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>({
  children,
  poll,
}: PropsWithChildren<{
  poll: Poll<StreamChatGenerics>;
}>) =>
  poll ? (
    <PollContext.Provider value={({ poll } as unknown) as PollContextValue}>
      {children}
    </PollContext.Provider>
  ) : null;

export const usePollContext = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>() => {
  const contextValue = useContext(PollContext);
  return (contextValue as unknown) as PollContextValue<StreamChatGenerics>;
};
