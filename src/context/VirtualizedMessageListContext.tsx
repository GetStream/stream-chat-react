import React, { createContext, useContext } from 'react';
import type { PropsWithChildren } from 'react';
import { requireContext } from './requireContext';

export type VirtualizedMessageListContextValue = {
  /** Scrolls the list to the bottom. */
  scrollToBottom: () => void;
};

export const VirtualizedMessageListContext = createContext<
  VirtualizedMessageListContextValue | undefined
>(undefined);

/** Provides the value to components rendered within the `VirtualizedMessageList`. */
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
  requireContext(
    useContext(VirtualizedMessageListContext),
    'useVirtualizedMessageListContext',
    'VirtualizedMessageListContextProvider',
  );
