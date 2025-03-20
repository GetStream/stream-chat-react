import React, { createContext, useContext } from 'react';
import type { PropsWithChildren } from 'react';

import type { CooldownTimerState, MessageInputProps } from '../components/MessageInput';
import type {
  CommandsListState,
  MentionsListState,
  MessageInputHookProps,
  MessageInputState,
} from '../components/MessageInput/hooks/useMessageInputState';

export type MessageInputContextValue = MessageInputState &
  MessageInputHookProps &
  Omit<MessageInputProps, 'Input'> &
  CooldownTimerState &
  CommandsListState &
  MentionsListState;

export const MessageInputContext = createContext<
  (MessageInputState & MessageInputHookProps) | undefined
>(undefined);

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
