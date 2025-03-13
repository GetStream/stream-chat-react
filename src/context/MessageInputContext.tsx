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

import type { CustomTrigger, DefaultStreamChatGenerics } from '../types/types';
import { MessageComposer } from 'stream-chat';

export type MessageInputContextValue<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
  V extends CustomTrigger = CustomTrigger,
> = MessageInputState<StreamChatGenerics> &
  MessageInputHookProps<StreamChatGenerics> &
  Omit<MessageInputProps<StreamChatGenerics, V>, 'Input'> &
  CooldownTimerState & {
    // @ts-ignore
    messageComposer: MessageComposer<StreamChatGenerics>;
    autocompleteTriggers?: TriggerSettings<StreamChatGenerics, V>;
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
  componentName?: string,
) => {
  const contextValue = useContext(MessageInputContext);

  if (!contextValue) {
    return {} as MessageInputContextValue<StreamChatGenerics, V>;
  }

  return contextValue as unknown as MessageInputContextValue<StreamChatGenerics, V>;
};
