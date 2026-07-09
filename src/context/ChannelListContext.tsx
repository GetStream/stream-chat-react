import type { PropsWithChildren } from 'react';
import React, { createContext, useContext } from 'react';

import type { ChannelPaginator } from 'stream-chat';

export type ChannelListContextValue = {
  /**
   * The primary channel paginator held by the `ChannelPaginatorsOrchestrator` on `ChatContext`.
   * Read the loaded channels reactively with `useStateStore(paginator.state, …)`, load the next
   * page with `paginator.next()`, and mutate the loaded list (e.g. prepend a just-opened channel)
   * via `paginator.setItems({ valueOrFactory })`. Undefined when rendered outside a channel list.
   */
  paginator?: ChannelPaginator;
};

export const ChannelListContext = createContext<ChannelListContextValue | undefined>(
  undefined,
);

/**
 * Context provider exposing the primary channel paginator to components rendered within the
 * channel list (e.g. search results, member actions, notification targeting).
 */
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
