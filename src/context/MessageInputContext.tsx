import React, { createContext, PropsWithChildren, useContext } from 'react';

import type { TriggerSettings } from '../components/MessageInput/DefaultTriggerProvider';
import type { CooldownTimerState, MessageInputProps } from '../components/MessageInput';
import type {
  CommandsListState,
  MentionsListState,
  MessageInputHookProps,
  MessageInputState,
} from '../components/MessageInput/hooks/useMessageInputState';

import type { CustomTrigger, DefaultStreamChatGenerics } from '../types/types';

export type MessageInputContextValue<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
  V extends CustomTrigger = CustomTrigger
> = MessageInputState<StreamChatGenerics> &
  MessageInputHookProps<StreamChatGenerics> &
  Omit<MessageInputProps<StreamChatGenerics, V>, 'Input'> &
  CooldownTimerState & {
    autocompleteTriggers?: TriggerSettings<StreamChatGenerics, V>;
  } & CommandsListState &
  MentionsListState;

export const MessageInputContext = createContext<
  (MessageInputState & MessageInputHookProps) | undefined
>(undefined);

export const MessageInputContextProvider = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
  V extends CustomTrigger = CustomTrigger
>({
  children,
  value,
}: PropsWithChildren<{
  value: MessageInputContextValue<StreamChatGenerics, V>;
}>) => (
  <MessageInputContext.Provider value={value as MessageInputContextValue}>
    {children}
  </MessageInputContext.Provider>
);

export const useMessageInputContext = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
  V extends CustomTrigger = CustomTrigger
>(
  componentName?: string,
) => {
  const contextValue = useContext(MessageInputContext);

  if (!contextValue) {
    console.warn(
      `The useMessageInputContext hook was called outside of the MessageInputContext provider. Make sure this hook is called within the MessageInput's UI component. The errored call is located in the ${componentName} component.`,
    );

    return {} as MessageInputContextValue<StreamChatGenerics, V>;
  }

  return contextValue as MessageInputContextValue<StreamChatGenerics, V>;
};
