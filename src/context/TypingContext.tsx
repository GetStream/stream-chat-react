import React, { PropsWithChildren, useContext } from 'react';

import type { ChannelState as StreamChannelState } from 'stream-chat';

import type { DefaultStreamChatGenerics, UnknownType } from '../types/types';

export type TypingContextValue<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
> = {
  typing?: StreamChannelState<StreamChatGenerics>['typing'];
};

export const TypingContext = React.createContext<TypingContextValue | undefined>(undefined);

export const TypingProvider = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>({
  children,
  value,
}: PropsWithChildren<{
  value: TypingContextValue<StreamChatGenerics>;
}>) => (
  <TypingContext.Provider value={(value as unknown) as TypingContextValue}>
    {children}
  </TypingContext.Provider>
);

export const useTypingContext = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>(
  componentName?: string,
) => {
  const contextValue = useContext(TypingContext);

  if (!contextValue) {
    console.warn(
      `The useTypingContext hook was called outside of the TypingContext provider. Make sure this hook is called within a child of the Channel component. The errored call is located in the ${componentName} component.`,
    );

    return {} as TypingContextValue<StreamChatGenerics>;
  }

  return contextValue as TypingContextValue<StreamChatGenerics>;
};

/**
 * Typescript currently does not support partial inference, so if TypingContext
 * typing is desired while using the HOC withTypingContext, the Props for the
 * wrapped component must be provided as the first generic.
 */
export const withTypingContext = <
  P extends UnknownType,
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>(
  Component: React.ComponentType<P>,
) => {
  const WithTypingContextComponent = (
    props: Omit<P, keyof TypingContextValue<StreamChatGenerics>>,
  ) => {
    const typingContext = useTypingContext<StreamChatGenerics>();

    return <Component {...(props as P)} {...typingContext} />;
  };

  WithTypingContextComponent.displayName = (
    Component.displayName ||
    Component.name ||
    'Component'
  ).replace('Base', '');

  return WithTypingContextComponent;
};
