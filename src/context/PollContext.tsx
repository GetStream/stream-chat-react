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
>(
  componentName?: string,
) => {
  const contextValue = useContext(PollContext);

  if (!contextValue) {
    console.warn(
      `The usePollContext hook was called outside of the PollContext provider. Make sure this hook is called within a child of the Channel component. The errored call is located in the ${componentName} component.`,
    );

    return {} as PollContextValue<StreamChatGenerics>;
  }

  return (contextValue as unknown) as PollContextValue<StreamChatGenerics>;
};
