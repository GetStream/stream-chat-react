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
 * Reports whether the caller is rendered beneath a `MessageComposerContextProvider`, without
 * requiring the context value itself. For components that legitimately render both inside and
 * outside a composer — see `WithDragAndDropUpload`, which uses it to decide whether to upload
 * straight to the surrounding composer or to fan drops out to subscribed composers.
 */
export const useIsWithinMessageComposerContext = () =>
  useContext(MessageComposerContext) !== undefined;
