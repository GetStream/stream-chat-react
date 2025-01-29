import React, {
  createContext,
  Dispatch,
  PropsWithChildren,
  SetStateAction,
  useContext,
} from 'react';

import type { Channel } from 'stream-chat';

import type { DefaultStreamChatGenerics } from '../types/types';

export type ChannelListContextValue<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = {
  /**
   * State representing the array of loaded channels.
   * Channels query is executed by default only by ChannelList component in the SDK.
   */
  channels: Channel<StreamChatGenerics>[];
  /**
   * Sets the list of Channel objects to be rendered by ChannelList component.
   */
  setChannels: Dispatch<SetStateAction<Channel<StreamChatGenerics>[]>>;
};

export const ChannelListContext = createContext<ChannelListContextValue | undefined>(
  undefined,
);

/**
 * Context provider for components rendered within the `ChannelList`
 */
export const ChannelListContextProvider = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>({
  children,
  value,
}: PropsWithChildren<{
  value: ChannelListContextValue<StreamChatGenerics>;
}>) => (
  <ChannelListContext.Provider value={value as unknown as ChannelListContextValue}>
    {children}
  </ChannelListContext.Provider>
);

export const useChannelListContext = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  componentName?: string,
) => {
  const contextValue = useContext(ChannelListContext);

  if (!contextValue) {
    console.warn(
      `The useChannelListContext hook was called outside of the ChannelListContext provider. Make sure this hook is called within the ChannelList component. The errored call is located in the ${componentName} component.`,
    );

    return {} as ChannelListContextValue<StreamChatGenerics>;
  }

  return contextValue as unknown as ChannelListContextValue<StreamChatGenerics>;
};
