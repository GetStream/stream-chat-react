import React, { createContext, useContext } from 'react';
import type { PropsWithChildren } from 'react';

export type VirtualizedMessageListContextValue = {
  /** Function that scrolls the list to the bottom. */
  scrollToBottom: () => void;
};

export const VirtualizedMessageListContext = createContext<
  VirtualizedMessageListContextValue | undefined
>(undefined);

/**
 * Context provider for components rendered within the `VirtualizedMessageList`
 */
export const VirtualizedMessageListContextProvider = ({
  children,
  value,
}: PropsWithChildren<{
  value: VirtualizedMessageListContextValue;
}>) => (
  <VirtualizedMessageListContext.Provider
    value={value as VirtualizedMessageListContextValue}
  >
    {children}
  </VirtualizedMessageListContext.Provider>
);

export const useVirtualizedMessageListContext = () =>
  useContext(VirtualizedMessageListContext) as VirtualizedMessageListContextValue;
