import type { Dispatch, PropsWithChildren, SetStateAction } from 'react';
import React, { createContext, useContext } from 'react';

import type { Channel } from 'stream-chat';

export type ChannelListContextValue = {
  /**
   * State representing the array of loaded channels.
   * Channels query is executed by default only by ChannelList component in the SDK.
   */
  channels: Channel[];
  /**
   * Indicator for channel pagination to determine whether more items can be loaded
   */
  hasNextPage: boolean;
  /**
   * Pagination function to load more channels
   */
  loadNextPage(): Promise<void>;
  /**
   * Sets the list of Channel objects to be rendered by ChannelList component.
   */
  setChannels: Dispatch<SetStateAction<Channel[]>>;
};

export const ChannelListContext = createContext<ChannelListContextValue | undefined>(
  undefined,
);

/**
 * Context provider for components rendered within the `ChannelList`
 */
export const ChannelListContextProvider = ({
  children,
  value,
}: PropsWithChildren<{
  value: ChannelListContextValue;
}>) => (
  <ChannelListContext.Provider value={value as unknown as ChannelListContextValue}>
    {children}
  </ChannelListContext.Provider>
);

export const useChannelListContext = (componentName?: string) => {
  const contextValue = useContext(ChannelListContext);

  if (!contextValue) {
    console.warn(
      `The useChannelListContext hook was called outside of the ChannelListContext provider. Make sure this hook is called within the ChannelList component. The errored call is located in the ${componentName} component.`,
    );

    return {} as ChannelListContextValue;
  }

  return contextValue as unknown as ChannelListContextValue;
};
