import React, { PropsWithChildren, useContext } from 'react';

import type { ChannelState as StreamChannelState } from 'stream-chat';

import type {
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
  UnknownType,
} from '../types/types';

export type TypingContextValue<
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends DefaultChannelType = DefaultChannelType,
  Co extends DefaultCommandType = DefaultCommandType,
  Ev extends DefaultEventType = DefaultEventType,
  Me extends DefaultMessageType = DefaultMessageType,
  Re extends DefaultReactionType = DefaultReactionType,
  Us extends DefaultUserType<Us> = DefaultUserType
> = {
  typing?: StreamChannelState<At, Ch, Co, Ev, Me, Re, Us>['typing'];
};

export const TypingContext = React.createContext<TypingContextValue | undefined>(undefined);

export const TypingProvider = <
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends DefaultChannelType = DefaultChannelType,
  Co extends DefaultCommandType = DefaultCommandType,
  Ev extends DefaultEventType = DefaultEventType,
  Me extends DefaultMessageType = DefaultMessageType,
  Re extends DefaultReactionType = DefaultReactionType,
  Us extends DefaultUserType<Us> = DefaultUserType
>({
  children,
  value,
}: PropsWithChildren<{
  value: TypingContextValue<At, Ch, Co, Ev, Me, Re, Us>;
}>) => (
  <TypingContext.Provider value={(value as unknown) as TypingContextValue}>
    {children}
  </TypingContext.Provider>
);

export const useTypingContext = <
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends DefaultChannelType = DefaultChannelType,
  Co extends DefaultCommandType = DefaultCommandType,
  Ev extends DefaultEventType = DefaultEventType,
  Me extends DefaultMessageType = DefaultMessageType,
  Re extends DefaultReactionType = DefaultReactionType,
  Us extends DefaultUserType<Us> = DefaultUserType
>(
  componentName?: string,
) => {
  const contextValue = useContext(TypingContext);

  if (!contextValue) {
    console.warn(
      `The useTypingContext hook was called outside of the TypingContext provider. Make sure this hook is called within a child of the Channel component. The errored call is located in the ${componentName} component.`,
    );

    return {} as TypingContextValue<At, Ch, Co, Ev, Me, Re, Us>;
  }

  return contextValue as TypingContextValue<At, Ch, Co, Ev, Me, Re, Us>;
};

/**
 * Typescript currently does not support partial inference, so if TypingContext
 * typing is desired while using the HOC withTypingContext, the Props for the
 * wrapped component must be provided as the first generic.
 */
export const withTypingContext = <
  P extends UnknownType,
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends DefaultChannelType = DefaultChannelType,
  Co extends DefaultCommandType = DefaultCommandType,
  Ev extends DefaultEventType = DefaultEventType,
  Me extends DefaultMessageType = DefaultMessageType,
  Re extends DefaultReactionType = DefaultReactionType,
  Us extends DefaultUserType<Us> = DefaultUserType
>(
  Component: React.ComponentType<P>,
): React.FC<Omit<P, keyof TypingContextValue<At, Ch, Co, Ev, Me, Re, Us>>> => {
  const WithTypingContextComponent = (
    props: Omit<P, keyof TypingContextValue<At, Ch, Co, Ev, Me, Re, Us>>,
  ) => {
    const typingContext = useTypingContext<At, Ch, Co, Ev, Me, Re, Us>();

    return <Component {...(props as P)} {...typingContext} />;
  };

  WithTypingContextComponent.displayName = (
    Component.displayName ||
    Component.name ||
    'Component'
  ).replace('Base', '');

  return WithTypingContextComponent;
};
