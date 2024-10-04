import React, { PropsWithChildren, useContext, useEffect, useMemo } from 'react';
import { Poll } from 'stream-chat';
import { useChatContext } from './ChatContext';

import type { PollResponse } from 'stream-chat';
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
  poll: pollData,
}: PropsWithChildren<{
  poll: PollResponse<StreamChatGenerics>;
}>) => {
  const { client } = useChatContext();

  const poll = useMemo<Poll>(() => new Poll({ client, poll: pollData }), [client, pollData]);

  useEffect(() => {
    poll.registerSubscriptions();
    return poll.unregisterSubscriptions;
  }, [poll]);

  return <PollContext.Provider value={{ poll }}>{children}</PollContext.Provider>;
};

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
