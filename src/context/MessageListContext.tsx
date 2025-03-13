import React, { createContext, useContext } from 'react';
import type { PropsWithChildren } from 'react';

export type MessageListContextValue = {
  /** The scroll container within which the messages and typing indicator are rendered */
  listElement: HTMLDivElement | null;
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

export const useMessageListContext = (componentName?: string) => {
  const contextValue = useContext(MessageListContext);

  if (!contextValue) {
    console.warn(
      `The useMessageListContext hook was called outside of the MessageListContext provider. Make sure this hook is called within the MessageList component. The errored call is located in the ${componentName} component.`,
    );

    return {} as MessageListContextValue;
  }

  return contextValue as MessageListContextValue;
};
