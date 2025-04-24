import React, { createContext, useContext } from 'react';
import type { PropsWithChildren } from 'react';

import type { CooldownTimerState, MessageInputProps } from '../components/MessageInput';
import type { MessageInputHookProps } from '../components/MessageInput/hooks/useMessageInputUiApi';

export type MessageInputContextValue = MessageInputHookProps &
  Omit<MessageInputProps, 'Input' | 'overrideSubmitHandler'> &
  CooldownTimerState;

export const MessageInputContext = createContext<MessageInputHookProps | undefined>(
  undefined,
);

export const MessageInputContextProvider = ({
  children,
  value,
}: PropsWithChildren<{
  value: MessageInputContextValue;
}>) => (
  <MessageInputContext.Provider value={value as unknown as MessageInputContextValue}>
    {children}
  </MessageInputContext.Provider>
);

export const useMessageInputContext = (
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  componentName?: string,
) => {
  const contextValue = useContext(MessageInputContext);

  if (!contextValue) {
    return {} as MessageInputContextValue;
  }

  return contextValue as unknown as MessageInputContextValue;
};
