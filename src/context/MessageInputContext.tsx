import React, { createContext, PropsWithChildren, useContext } from 'react';
import type {
  MessageInputHookProps,
  MessageInputState,
} from '../components/MessageInput/hooks/messageInput';
import type { DefaultAttachmentType, DefaultCommandType, DefaultUserType } from '../../types/types';

export const MessageInputContext = createContext<
  (MessageInputState & MessageInputHookProps) | undefined
>(undefined);

export const MessageInputContextProvider = <
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Co extends DefaultCommandType = DefaultCommandType,
  Us extends DefaultUserType<Us> = DefaultUserType
>({
  children,
  value,
}: PropsWithChildren<{
  value: MessageInputState<At, Us> & MessageInputHookProps<Co, Us>;
}>) => (
  <MessageInputContext.Provider value={value as MessageInputState & MessageInputHookProps}>
    {children}
  </MessageInputContext.Provider>
);

/**
 * hook for MessageInput context
 */
export const useMessageInput = <
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Co extends DefaultCommandType = DefaultCommandType,
  Us extends DefaultUserType<Us> = DefaultUserType
>() => {
  const contextValue = useContext(MessageInputContext);
  if (contextValue === undefined) {
    console.warn(
      'Empty MessageInputContext consumed. Make sure you wrap every component that uses MessageInputContext with a MessageInputProvider',
    );
  }

  return contextValue as MessageInputState<At, Us> & MessageInputHookProps<Co, Us>;
};
