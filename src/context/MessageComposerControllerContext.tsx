import type { PropsWithChildren } from 'react';
import React, { useContext } from 'react';
import type { MessageComposer as MessageComposerController } from 'stream-chat';

const MessageComposerControllerContext = React.createContext<
  MessageComposerController | undefined
>(undefined);

/**
 * Supplies the composer that components below it write to, in place of the thread's or channel's
 * own. Use it for a composition the integrator owns, such as editing a message inline.
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
