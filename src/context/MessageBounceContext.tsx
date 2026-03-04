import type { ReactEventHandler } from 'react';
import React, { createContext, useCallback, useContext, useMemo } from 'react';
import { useMessageContext } from './MessageContext';
import { useChannel } from './useChannel';
import { isMessageBounced, useMessageComposer, useRetryHandler } from '../components';
import type { LocalMessage } from 'stream-chat';
import type { PropsWithChildrenOnly } from '../types/types';

export interface MessageBounceContextValue {
  handleDelete: ReactEventHandler;
  handleEdit: ReactEventHandler;
  handleRetry: ReactEventHandler;
  message: LocalMessage;
}

const MessageBounceContext = createContext<MessageBounceContextValue | undefined>(
  undefined,
);

export function useMessageBounceContext(componentName?: string) {
  const contextValue = useContext(MessageBounceContext);

  if (!contextValue) {
    console.warn(
      `The useMessageBounceContext hook was called outside of the MessageBounceContext provider. The errored call is located in the ${componentName} component.`,
    );

    return {} as MessageBounceContextValue;
  }

  return contextValue;
}

export function MessageBounceProvider({ children }: PropsWithChildrenOnly) {
  const messageComposer = useMessageComposer();
  const { message } = useMessageContext('MessageBounceProvider');
  const doHandleRetry = useRetryHandler();

  if (!isMessageBounced(message)) {
    console.warn(
      `The MessageBounceProvider was rendered for a message that is not bounced. Have you missed the "isMessageBounced" check?`,
    );
  }

  const channel = useChannel();

  const handleDelete: ReactEventHandler = useCallback(() => {
    channel.state.removeMessage(message);
  }, [channel, message]);

  const handleEdit: ReactEventHandler = useCallback(
    (e) => {
      e.preventDefault();
      messageComposer.initState({ composition: message });
    },
    [message, messageComposer],
  );

  const handleRetry: ReactEventHandler = useCallback(() => {
    void doHandleRetry({ localMessage: message });
  }, [doHandleRetry, message]);

  const value = useMemo(
    () => ({
      handleDelete,
      handleEdit,
      handleRetry,
      message,
    }),
    [handleDelete, handleEdit, handleRetry, message],
  );

  return (
    <MessageBounceContext.Provider value={value}>
      {children}
    </MessageBounceContext.Provider>
  );
}
