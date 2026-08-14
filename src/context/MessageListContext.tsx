import React, { createContext, useContext } from 'react';
import type { PropsWithChildren } from 'react';
import type { RenderedMessage } from '../components';
import { requireContext } from './requireContext';

export type MessageListContextValue = {
  /** Enriched message list, including date separators and intro message (if enabled) */
  processedMessages: RenderedMessage[];
  /** The scroll container within which the messages and typing indicator are rendered */
  listElement: HTMLElement | null;
  /** Function that scrolls the `listElement` to the bottom. */
  scrollToBottom: () => void;
};

export const MessageListContext = createContext<MessageListContextValue | undefined>(
  undefined,
);

/**
 * Context provider for components rendered within the `MessageList`
 */
export const MessageListContextProvider = ({
  children,
  value,
}: PropsWithChildren<{
  value: MessageListContextValue;
}>) => (
  <MessageListContext.Provider value={value as MessageListContextValue}>
    {children}
  </MessageListContext.Provider>
);

export const useMessageListContext = () =>
  requireContext(
    useContext(MessageListContext),
    'useMessageListContext',
    'MessageListContextProvider',
  );
