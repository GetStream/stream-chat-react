import React, { createContext, useContext } from 'react';
import type { PropsWithChildren } from 'react';

import type { MessageComposerProps } from '../components/MessageComposer';
import type { UseMessageComposerBindingsParams } from '../components/MessageComposer/hooks/useMessageComposerBindings';

export type MessageComposerContextValue = UseMessageComposerBindingsParams &
  Omit<MessageComposerProps, 'Input'>;

export const MessageComposerContext = createContext<
  UseMessageComposerBindingsParams | undefined
>(undefined);

export const MessageComposerContextProvider = ({
  children,
  value,
}: PropsWithChildren<{
  value: MessageComposerContextValue;
}>) => (
  <MessageComposerContext.Provider
    value={value as unknown as MessageComposerContextValue}
  >
    {children}
  </MessageComposerContext.Provider>
);

export const useMessageComposerContext = (
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  componentName?: string,
) => {
  const contextValue = useContext(MessageComposerContext);

  if (!contextValue) {
    return {} as MessageComposerContextValue;
  }

  return contextValue as unknown as MessageComposerContextValue;
};
