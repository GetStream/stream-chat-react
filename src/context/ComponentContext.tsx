import React, { PropsWithChildren, useContext } from 'react';

import type { NimbleEmojiIndex, NimbleEmojiProps, NimblePickerProps } from 'emoji-mart';

import type { AttachmentProps } from '../components/Attachment/Attachment';
import type { AvatarProps } from '../components/Avatar/Avatar';
import type { DateSeparatorProps } from '../components/DateSeparator/DateSeparator';
import type { EmptyStateIndicatorProps } from '../components/EmptyStateIndicator/EmptyStateIndicator';
import type { EventComponentProps } from '../components/EventComponent/EventComponent';
import type { LoadingIndicatorProps } from '../components/Loading/LoadingIndicator';
import type { FixedHeightMessageProps } from '../components/Message/FixedHeightMessage';
import type { MessageUIComponentProps, PinIndicatorProps } from '../components/Message/types';
import type { MessageDeletedProps } from '../components/Message/MessageDeleted';
import type { MessageNotificationProps } from '../components/MessageList/MessageNotification';
import type { MessageOptionsProps } from '../components/Message/MessageOptions';
import type { MessageInputProps } from '../components/MessageInput/MessageInput';
import type { MessageRepliesCountButtonProps } from '../components/Message/MessageRepliesCountButton';
import type { MessageTimestampProps } from '../components/Message/MessageTimestamp';
import type { ReactionSelectorProps } from '../components/Reactions/ReactionSelector';
import type { ReactionsListProps } from '../components/Reactions/ReactionsList';
import type { ThreadHeaderProps } from '../components/Thread/Thread';
import type { TypingIndicatorProps } from '../components/TypingIndicator/TypingIndicator';

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
  Avatar?: React.ComponentType<AvatarProps>;
  DateSeparator?: React.ComponentType<DateSeparatorProps>;
  EditMessageInput?: React.ComponentType<MessageInputProps<At, Ch, Co, Ev, Me, Re, Us>>;
  EmptyStateIndicator?: React.ComponentType<EmptyStateIndicatorProps>;
  HeaderComponent?: React.ComponentType;
  LoadingIndicator?: React.ComponentType<LoadingIndicatorProps>;
  MessageDeleted?: React.ComponentType<MessageDeletedProps<At, Ch, Co, Ev, Me, Re, Us>>;
  MessageNotification?: React.ComponentType<MessageNotificationProps>;
  MessageOptions?: React.ComponentType<MessageOptionsProps<At, Ch, Co, Ev, Me, Re, Us>>;
  MessageRepliesCountButton?: React.ComponentType<MessageRepliesCountButtonProps>;
  MessageSystem?: React.ComponentType<EventComponentProps<At, Ch, Co, Ev, Me, Re, Us>>;
  MessageTimestamp?: React.ComponentType<MessageTimestampProps<At, Ch, Co, Ev, Me, Re, Us>>;
  PinIndicator?: React.ComponentType<PinIndicatorProps<At, Ch, Co, Ev, Me, Re, Us>>;
  ReactionSelector?: React.ForwardRefExoticComponent<ReactionSelectorProps<Re, Us>>;
  ReactionsList?: React.ComponentType<ReactionsListProps<Re, Us>>;
  ThreadHeader?: React.ComponentType<ThreadHeaderProps<At, Ch, Co, Ev, Me, Re, Us>>;
  ThreadStart?: React.ComponentType;
  TypingIndicator?: React.ComponentType<TypingIndicatorProps>;
  VirtualMessage?: React.ComponentType<FixedHeightMessageProps<At, Ch, Co, Ev, Me, Re, Us>>;
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
  value: Partial<ComponentContextValue<At, Ch, Co, Ev, Me, Re, Us>>;
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
    const componentContext = useComponentContext<At, Ch, Co, Ev, Me, Re, Us>();

    return <Component {...(props as P)} {...componentContext} />;
  };

  WithComponentContextComponent.displayName = (
    Component.displayName ||
    Component.name ||
    'Component'
  ).replace('Base', '');

  return WithComponentContextComponent;
};
