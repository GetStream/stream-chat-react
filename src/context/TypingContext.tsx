import React, { useContext } from 'react';
import type { PropsWithChildren } from 'react';

import type { ChannelState as StreamChannelState } from 'stream-chat';

export type TypingContextValue = {
  typing?: StreamChannelState['typing'];
};

export const TypingContext = React.createContext<TypingContextValue | undefined>(
  undefined,
);

export const TypingProvider = ({
  children,
  value,
}: PropsWithChildren<{
  value: TypingContextValue;
}>) => (
  <TypingContext.Provider value={value as unknown as TypingContextValue}>
    {children}
  </TypingContext.Provider>
);

export const useTypingContext = (componentName?: string) => {
  const contextValue = useContext(TypingContext);

  if (!contextValue) {
    console.warn(
      `The useTypingContext hook was called outside of the TypingContext provider. Make sure this hook is called within a child of the Channel component. The errored call is located in the ${componentName} component.`,
    );

    return {} as TypingContextValue;
  }

  return contextValue as TypingContextValue;
};
