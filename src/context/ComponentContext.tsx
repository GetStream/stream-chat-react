import React, { PropsWithChildren, useContext } from 'react';

import type { NimbleEmojiIndex, NimbleEmojiProps, NimblePickerProps } from 'emoji-mart';

import type { AttachmentProps } from '../components/Attachment/Attachment';
import type { MessageUIComponentProps } from '../components/Message/types';

import type {
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
  UnknownType,
} from '../../types/types';

export type ComponentContextValue<
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends DefaultChannelType = DefaultChannelType,
  Co extends DefaultCommandType = DefaultCommandType,
  Ev extends DefaultEventType = DefaultEventType,
  Me extends DefaultMessageType = DefaultMessageType,
  Re extends DefaultReactionType = DefaultReactionType,
  Us extends DefaultUserType<Us> = DefaultUserType
> = {
  Attachment: React.ComponentType<AttachmentProps<At>>;
  Emoji: React.ComponentType<NimbleEmojiProps>;
  EmojiIndex: NimbleEmojiIndex;
  EmojiPicker: React.ComponentType<NimblePickerProps>;
  Message: React.ComponentType<MessageUIComponentProps<At, Ch, Co, Ev, Me, Re, Us>>;
};

export const ComponentContext = React.createContext<ComponentContextValue>(
  {} as ComponentContextValue,
);

export const ComponentProvider = <
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
  value: ComponentContextValue<At, Ch, Co, Ev, Me, Re, Us>;
}>) => (
  <ComponentContext.Provider value={(value as unknown) as ComponentContextValue}>
    {children}
  </ComponentContext.Provider>
);

export const useComponentContext = <
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends DefaultChannelType = DefaultChannelType,
  Co extends DefaultCommandType = DefaultCommandType,
  Ev extends DefaultEventType = DefaultEventType,
  Me extends DefaultMessageType = DefaultMessageType,
  Re extends DefaultReactionType = DefaultReactionType,
  Us extends DefaultUserType<Us> = DefaultUserType
>() =>
  (useContext(ComponentContext) as unknown) as ComponentContextValue<At, Ch, Co, Ev, Me, Re, Us>;

/**
 * Typescript currently does not support partial inference, so if ComponentContext
 * typing is desired while using the HOC withComponentContext, the Props for the
 * wrapped component must be provided as the first generic.
 */
export const withComponentContext = <
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
): React.FC<Omit<P, keyof ComponentContextValue<At, Ch, Co, Ev, Me, Re, Us>>> => {
  const WithComponentContextComponent = (
    props: Omit<P, keyof ComponentContextValue<At, Ch, Co, Ev, Me, Re, Us>>,
  ) => {
    const channelContext = useComponentContext<At, Ch, Co, Ev, Me, Re, Us>();

    return <Component {...(props as P)} {...channelContext} />;
  };

  WithComponentContextComponent.displayName = (
    Component.displayName ||
    Component.name ||
    'Component'
  ).replace('Base', '');

  return WithComponentContextComponent;
};
