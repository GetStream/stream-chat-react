import React, { PropsWithChildren, useContext } from 'react';

import type { AttachmentProps } from '../components/Attachment/Attachment';
import type { AvatarProps } from '../components/Avatar/Avatar';
import type { DateSeparatorProps } from '../components/DateSeparator/DateSeparator';
import type { EmptyStateIndicatorProps } from '../components/EmptyStateIndicator/EmptyStateIndicator';
import type { EventComponentProps } from '../components/EventComponent/EventComponent';
import type { LoadingIndicatorProps } from '../components/Loading/LoadingIndicator';
import type { FixedHeightMessageProps } from '../components/Message/FixedHeightMessage';
import type { MessageUIComponentProps, PinIndicatorProps } from '../components/Message/types';
import type { MessageDeletedProps } from '../components/Message/MessageDeleted';
import type { GiphyPreviewMessageProps } from '../components/MessageList/GiphyPreviewMessage';
import type { MessageListNotificationsProps } from '../components/MessageList/MessageListNotifications';
import type { MessageNotificationProps } from '../components/MessageList/MessageNotification';
import type { MessageOptionsProps } from '../components/Message/MessageOptions';
import type { CooldownTimerProps } from '../components/MessageInput/hooks/useCooldownTimer';
import type { MessageInputProps } from '../components/MessageInput/MessageInput';
import type { QuotedMessagePreviewProps } from '../components/MessageInput/QuotedMessagePreview';
import type { MessageRepliesCountButtonProps } from '../components/Message/MessageRepliesCountButton';
import type { MessageStatusProps } from '../components/Message/MessageStatus';
import type { MessageTimestampProps } from '../components/Message/MessageTimestamp';
import type { ReactionSelectorProps } from '../components/Reactions/ReactionSelector';
import type { ReactionsListProps } from '../components/Reactions/ReactionsList';
import type {
  SuggestionItemProps,
  SuggestionListProps,
} from '../components/ChatAutoComplete/ChatAutoComplete';
import type { SuggestionListHeaderProps } from '../components/AutoCompleteTextarea';
import type { SendButtonProps } from '../components/MessageInput/icons';
import type { ThreadHeaderProps } from '../components/Thread/Thread';
import type { TypingIndicatorProps } from '../components/TypingIndicator/TypingIndicator';

import type {
  CustomTrigger,
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
  UnknownType,
} from '../types/types';

export type ComponentContextValue<
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends DefaultChannelType = DefaultChannelType,
  Co extends DefaultCommandType = DefaultCommandType,
  Ev extends DefaultEventType = DefaultEventType,
  Me extends DefaultMessageType = DefaultMessageType,
  Re extends DefaultReactionType = DefaultReactionType,
  Us extends DefaultUserType<Us> = DefaultUserType,
  V extends CustomTrigger = CustomTrigger
> = {
  Attachment: React.ComponentType<AttachmentProps<At>>;
  Message: React.ComponentType<MessageUIComponentProps<At, Ch, Co, Ev, Me, Re, Us>>;
  AutocompleteSuggestionHeader?: React.ComponentType<SuggestionListHeaderProps>;
  AutocompleteSuggestionItem?: React.ComponentType<SuggestionItemProps<Co, Us>>;
  AutocompleteSuggestionList?: React.ComponentType<SuggestionListProps<Co, Us, V>>;
  Avatar?: React.ComponentType<AvatarProps<Us>>;
  CooldownTimer?: React.ComponentType<CooldownTimerProps>;
  DateSeparator?: React.ComponentType<DateSeparatorProps>;
  EditMessageInput?: React.ComponentType<MessageInputProps<At, Ch, Co, Ev, Me, Re, Us>>;
  EmojiIcon?: React.ComponentType;
  EmptyStateIndicator?: React.ComponentType<EmptyStateIndicatorProps>;
  FileUploadIcon?: React.ComponentType;
  GiphyPreviewMessage?: React.ComponentType<GiphyPreviewMessageProps<At, Ch, Co, Ev, Me, Re, Us>>;
  HeaderComponent?: React.ComponentType;
  Input?: React.ComponentType<MessageInputProps<At, Ch, Co, Ev, Me, Re, Us, V>>;
  LoadingIndicator?: React.ComponentType<LoadingIndicatorProps>;
  MessageDeleted?: React.ComponentType<MessageDeletedProps<At, Ch, Co, Ev, Me, Re, Us>>;
  MessageListNotifications?: React.ComponentType<MessageListNotificationsProps>;
  MessageNotification?: React.ComponentType<MessageNotificationProps>;
  MessageOptions?: React.ComponentType<MessageOptionsProps<At, Ch, Co, Ev, Me, Re, Us>>;
  MessageRepliesCountButton?: React.ComponentType<MessageRepliesCountButtonProps>;
  MessageStatus?: React.ComponentType<MessageStatusProps>;
  MessageSystem?: React.ComponentType<EventComponentProps<At, Ch, Co, Ev, Me, Re, Us>>;
  MessageTimestamp?: React.ComponentType<MessageTimestampProps<At, Ch, Co, Ev, Me, Re, Us>>;
  PinIndicator?: React.ComponentType<PinIndicatorProps<At, Ch, Co, Ev, Me, Re, Us>>;
  QuotedMessage?: React.ComponentType;
  QuotedMessagePreview?: React.ComponentType<QuotedMessagePreviewProps<At, Ch, Co, Ev, Me, Re, Us>>;
  ReactionSelector?: React.ForwardRefExoticComponent<ReactionSelectorProps<Re, Us>>;
  ReactionsList?: React.ComponentType<ReactionsListProps<Re, Us>>;
  SendButton?: React.ComponentType<SendButtonProps<At, Me, Us>>;
  ThreadHeader?: React.ComponentType<ThreadHeaderProps<At, Ch, Co, Ev, Me, Re, Us>>;
  ThreadInput?: React.ComponentType<MessageInputProps<At, Ch, Co, Ev, Me, Re, Us, V>>;
  ThreadStart?: React.ComponentType;
  TriggerProvider?: React.ComponentType;
  TypingIndicator?: React.ComponentType<TypingIndicatorProps>;
  VirtualMessage?: React.ComponentType<FixedHeightMessageProps<At, Ch, Co, Ev, Me, Re, Us>>;
};

export const ComponentContext = React.createContext<ComponentContextValue | undefined>(undefined);

export const ComponentProvider = <
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends DefaultChannelType = DefaultChannelType,
  Co extends DefaultCommandType = DefaultCommandType,
  Ev extends DefaultEventType = DefaultEventType,
  Me extends DefaultMessageType = DefaultMessageType,
  Re extends DefaultReactionType = DefaultReactionType,
  Us extends DefaultUserType<Us> = DefaultUserType,
  V extends CustomTrigger = CustomTrigger
>({
  children,
  value,
}: PropsWithChildren<{
  value: Partial<ComponentContextValue<At, Ch, Co, Ev, Me, Re, Us, V>>;
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
  Us extends DefaultUserType<Us> = DefaultUserType,
  V extends CustomTrigger = CustomTrigger
>(
  componentName?: string,
) => {
  const contextValue = useContext(ComponentContext);

  if (!contextValue) {
    console.warn(
      `The useComponentContext hook was called outside of the ComponentContext provider. Make sure this hook is called within a child of the Channel component. The errored call is located in the ${componentName} component.`,
    );

    return {} as ComponentContextValue<At, Ch, Co, Ev, Me, Re, Us, V>;
  }

  return contextValue as ComponentContextValue<At, Ch, Co, Ev, Me, Re, Us, V>;
};

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
  Us extends DefaultUserType<Us> = DefaultUserType,
  V extends CustomTrigger = CustomTrigger
>(
  Component: React.ComponentType<P>,
): React.FC<Omit<P, keyof ComponentContextValue<At, Ch, Co, Ev, Me, Re, Us, V>>> => {
  const WithComponentContextComponent = (
    props: Omit<P, keyof ComponentContextValue<At, Ch, Co, Ev, Me, Re, Us, V>>,
  ) => {
    const componentContext = useComponentContext<At, Ch, Co, Ev, Me, Re, Us, V>();

    return <Component {...(props as P)} {...componentContext} />;
  };

  WithComponentContextComponent.displayName = (
    Component.displayName ||
    Component.name ||
    'Component'
  ).replace('Base', '');

  return WithComponentContextComponent;
};
