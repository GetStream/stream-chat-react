import type { PropsWithChildren } from 'react';
import React, { useContext } from 'react';
import type { MessageComposer as MessageComposerController } from 'stream-chat';

const MessageComposerControllerContext = React.createContext<
  MessageComposerController | undefined
>(undefined);

/**
 * Supplies the composer a `MessageComposer` below it edits, in place of the thread's or channel's own.
 * For a composition the integrator owns - editing a message inline, for instance - where the default
 * composer is the wrong one to write into.
 */
export const MessageComposerControllerProvider = ({
  children,
  messageComposerController,
}: PropsWithChildren<{
  messageComposerController?: MessageComposerController;
}>) => (
  <MessageComposerControllerContext.Provider value={messageComposerController}>
    {children}
  </MessageComposerControllerContext.Provider>
);

/** The composer supplied by {@link MessageComposerControllerProvider}, if any. */
export const useMessageComposerControllerContext = () =>
  useContext(MessageComposerControllerContext);
