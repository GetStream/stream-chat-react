import React, { createContext, useContext } from 'react';
import type { PropsWithChildren } from 'react';

import type { MessageComposerProps } from '../components/MessageComposer';
import type { UseMessageComposerBindingsParams } from '../components/MessageComposer/hooks/useMessageComposerBindings';
import { requireContext } from './requireContext';

export type MessageComposerContextValue = UseMessageComposerBindingsParams &
  Omit<MessageComposerProps, 'Input'>;

export const MessageComposerContext = createContext<
  MessageComposerContextValue | undefined
>(undefined);

export const MessageComposerContextProvider = ({
  children,
  value,
}: PropsWithChildren<{
  value: MessageComposerContextValue;
}>) => (
  <MessageComposerContext.Provider value={value}>
    {children}
  </MessageComposerContext.Provider>
);

export const useMessageComposerContext = () =>
  requireContext(
    useContext(MessageComposerContext),
    'useMessageComposerContext',
    'MessageComposerContextProvider',
  );

/**
 * Whether the caller sits beneath a `MessageComposerContextProvider`, for components that render
 * both inside and outside a composer. See `WithDragAndDropUpload`.
 */
export const useIsWithinMessageComposerContext = () =>
  useContext(MessageComposerContext) !== undefined;
