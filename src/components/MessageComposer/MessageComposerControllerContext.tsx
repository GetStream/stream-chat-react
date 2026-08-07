import type { PropsWithChildren } from 'react';
import React, { useContext } from 'react';

import type { MessageComposer as MessageComposerController } from 'stream-chat';

/**
 * Lets an integrator supply a custom `MessageComposer` instance, overriding the default
 * resolution order in `useMessageComposerController`.
 *
 * Kept in its own module rather than in `MessageComposer.tsx`: `useMessageComposerController`
 * consumes this context, and `MessageComposer.tsx` imports that hook, so co-locating the two
 * creates an import cycle through the `MessageComposer` barrel.
 */
const MessageComposerControllerContext = React.createContext<
  MessageComposerController | undefined
>(undefined);

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

export const useMessageComposerControllerContext = () =>
  useContext(MessageComposerControllerContext);
