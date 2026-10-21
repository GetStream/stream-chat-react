import React, { createContext, useContext } from 'react';
import type { PropsWithChildren } from 'react';
import type { RenderedMessage } from '../components';
import { requireContext } from './requireContext';

export type MessageListContextValue = {
  /** Messages enriched with date separators and, if enabled, the intro message. */
  processedMessages: RenderedMessage[];
  /** The scroll container that holds the messages and the typing indicator. */
  listElement: HTMLElement | null;
  /** Scrolls the `listElement` to the bottom. */
  scrollToBottom: () => void;
};

export const MessageListContext = createContext<MessageListContextValue | undefined>(
  undefined,
);

/** Provides the value to components rendered within the `MessageList`. */
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
