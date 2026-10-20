import type { PropsWithChildren } from 'react';
import React, { createContext, useContext } from 'react';

import type { ChannelPaginator } from 'stream-chat';

export type ChannelListContextValue = {
  /**
   * The primary (first) channel paginator of the `ChannelManager` on `ChatContext`. Undefined
   * outside `ChannelLists`.
   */
  paginator?: ChannelPaginator;
};

export const ChannelListContext = createContext<ChannelListContextValue | undefined>(
  undefined,
);

/** Provides the primary channel paginator to the channel lists rendered by `ChannelLists`. */
export const ChannelListContextProvider = ({
  children,
  value,
}: PropsWithChildren<{
  value: ChannelListContextValue;
}>) => (
  <ChannelListContext.Provider value={value}>{children}</ChannelListContext.Provider>
);

export const useChannelListContext = (): ChannelListContextValue =>
  useContext(ChannelListContext) ?? {};
