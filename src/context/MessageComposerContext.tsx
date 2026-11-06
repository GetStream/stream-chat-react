import React, { createContext, useContext } from 'react';
import type { PropsWithChildren } from 'react';

import type { MessageComposerProps } from '../components/MessageComposer';
import type { UseMessageComposerBindingsParams } from '../components/MessageComposer/hooks/useMessageComposerBindings';
import { requireContext } from './requireContext';

/** The `MessageComposer` props, except those its bindings consume, plus the bindings. */
export type MessageComposerContextValue = UseMessageComposerBindingsParams &
  Omit<MessageComposerProps, 'audioRecordingConfig' | 'generateRecordingTitle'>;

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
 * Whether the caller is rendered within a `MessageComposerContextProvider`, for components that
 * render both inside and outside a composer (see `WithDragAndDropUpload`).
 */
export const useIsWithinMessageComposerContext = () =>
  useContext(MessageComposerContext) !== undefined;
