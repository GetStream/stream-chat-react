import React, { createContext, useContext } from 'react';
import type { PropsWithChildren } from 'react';

import type { TriggerSettings } from '../components/MessageInput/DefaultTriggerProvider';
import type { CooldownTimerState, MessageInputProps } from '../components/MessageInput';
import type {
  CommandsListState,
  MentionsListState,
  MessageInputHookProps,
  MessageInputState,
} from '../components/MessageInput/hooks/useMessageInputState';

import type { CustomTrigger } from '../types/types';
import type { MessageComposer } from 'stream-chat';

export type MessageInputContextValue<V extends CustomTrigger = CustomTrigger> =
  MessageInputState &
    MessageInputHookProps &
    Omit<MessageInputProps<V>, 'Input'> &
    CooldownTimerState & {
      messageComposer: MessageComposer;
      autocompleteTriggers?: TriggerSettings<V>;
    } & CommandsListState &
    MentionsListState;

export const MessageInputContext = createContext<
  (MessageInputState & MessageInputHookProps) | undefined
>(undefined);

export const MessageInputContextProvider = <V extends CustomTrigger = CustomTrigger>({
  children,
  value,
}: PropsWithChildren<{
  value: MessageInputContextValue<V>;
}>) => (
  <MessageInputContext.Provider value={value as unknown as MessageInputContextValue}>
    {children}
  </MessageInputContext.Provider>
);

export const useMessageInputContext = <V extends CustomTrigger = CustomTrigger>(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  componentName?: string,
) => {
  const contextValue = useContext(MessageInputContext);

  if (!contextValue) {
    return {} as MessageInputContextValue<V>;
  }

  return contextValue as unknown as MessageInputContextValue<V>;
};
