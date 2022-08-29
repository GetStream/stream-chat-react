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
import type { MessageInputProps } from '../components/MessageInput/MessageInput';
import type { QuotedMessagePreviewProps } from '../components/MessageInput/QuotedMessagePreview';
import type { MessageProps } from '../components/Message/types';
import type { MessageRepliesCountButtonProps } from '../components/Message/MessageRepliesCountButton';
import type { MessageStatusProps } from '../components/Message/MessageStatus';
import type { MessageTimestampProps } from '../components/Message/MessageTimestamp';
import type { ModalGalleryProps } from '../components/Gallery/ModalGallery';
import type { ReactionSelectorProps } from '../components/Reactions/ReactionSelector';
import type { ReactionsListProps } from '../components/Reactions/ReactionsList';
import type {
  SuggestionItemProps,
  SuggestionListProps,
} from '../components/ChatAutoComplete/ChatAutoComplete';
import type { SuggestionListHeaderProps } from '../components/AutoCompleteTextarea';
import type { SendButtonProps } from '../components/MessageInput/icons';
import type { ThreadHeaderProps } from '../components/Thread/ThreadHeader';
import type { TypingIndicatorProps } from '../components/TypingIndicator/TypingIndicator';

import type { CustomTrigger, DefaultStreamChatGenerics, UnknownType } from '../types/types';
import type { CooldownTimerProps } from '../components';

export type ComponentContextValue<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
  V extends CustomTrigger = CustomTrigger
> = {
  Attachment: React.ComponentType<AttachmentProps<StreamChatGenerics>>;
  Message: React.ComponentType<MessageUIComponentProps<StreamChatGenerics>>;
  AutocompleteSuggestionHeader?: React.ComponentType<SuggestionListHeaderProps>;
  AutocompleteSuggestionItem?: React.ComponentType<SuggestionItemProps<StreamChatGenerics>>;
  AutocompleteSuggestionList?: React.ComponentType<SuggestionListProps<StreamChatGenerics>>;
  Avatar?: React.ComponentType<AvatarProps<StreamChatGenerics>>;
  CooldownTimer?: React.ComponentType<CooldownTimerProps>;
  DateSeparator?: React.ComponentType<DateSeparatorProps>;
  EditMessageInput?: React.ComponentType<MessageInputProps<StreamChatGenerics>>;
  EmojiIcon?: React.ComponentType;
  EmptyStateIndicator?: React.ComponentType<EmptyStateIndicatorProps>;
  FileUploadIcon?: React.ComponentType;
  GiphyPreviewMessage?: React.ComponentType<GiphyPreviewMessageProps<StreamChatGenerics>>;
  HeaderComponent?: React.ComponentType;
  Input?: React.ComponentType<MessageInputProps<StreamChatGenerics, V>>;
  LoadingIndicator?: React.ComponentType<LoadingIndicatorProps>;
  MessageDeleted?: React.ComponentType<MessageDeletedProps<StreamChatGenerics>>;
  MessageListNotifications?: React.ComponentType<MessageListNotificationsProps>;
  MessageNotification?: React.ComponentType<MessageNotificationProps>;
  MessageOptions?: React.ComponentType<MessageOptionsProps<StreamChatGenerics>>;
  MessageRepliesCountButton?: React.ComponentType<MessageRepliesCountButtonProps>;
  MessageStatus?: React.ComponentType<MessageStatusProps>;
  MessageSystem?: React.ComponentType<EventComponentProps<StreamChatGenerics>>;
  MessageTimestamp?: React.ComponentType<MessageTimestampProps<StreamChatGenerics>>;
  ModalGallery?: React.ComponentType<ModalGalleryProps>;
  PinIndicator?: React.ComponentType<PinIndicatorProps<StreamChatGenerics>>;
  QuotedMessage?: React.ComponentType;
  QuotedMessagePreview?: React.ComponentType<QuotedMessagePreviewProps<StreamChatGenerics>>;
  ReactionSelector?: React.ForwardRefExoticComponent<ReactionSelectorProps<StreamChatGenerics>>;
  ReactionsList?: React.ComponentType<ReactionsListProps<StreamChatGenerics>>;
  SendButton?: React.ComponentType<SendButtonProps<StreamChatGenerics>>;
  ThreadHead?: React.ComponentType<MessageProps<StreamChatGenerics>>;
  ThreadHeader?: React.ComponentType<ThreadHeaderProps<StreamChatGenerics>>;
  ThreadInput?: React.ComponentType<MessageInputProps<StreamChatGenerics, V>>;
  ThreadStart?: React.ComponentType;
  TriggerProvider?: React.ComponentType;
  TypingIndicator?: React.ComponentType<TypingIndicatorProps>;
  VirtualMessage?: React.ComponentType<FixedHeightMessageProps<StreamChatGenerics>>;
};

export const ComponentContext = React.createContext<ComponentContextValue | undefined>(undefined);

export const ComponentProvider = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
  V extends CustomTrigger = CustomTrigger
>({
  children,
  value,
}: PropsWithChildren<{
  value: Partial<ComponentContextValue<StreamChatGenerics, V>>;
}>) => (
  <ComponentContext.Provider value={(value as unknown) as ComponentContextValue}>
    {children}
  </ComponentContext.Provider>
);

export const useComponentContext = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
  V extends CustomTrigger = CustomTrigger
>(
  componentName?: string,
) => {
  const contextValue = useContext(ComponentContext);

  if (!contextValue) {
    console.warn(
      `The useComponentContext hook was called outside of the ComponentContext provider. Make sure this hook is called within a child of the Channel component. The errored call is located in the ${componentName} component.`,
    );

    return {} as ComponentContextValue<StreamChatGenerics, V>;
  }

  return contextValue as ComponentContextValue<StreamChatGenerics, V>;
};

/**
 * Typescript currently does not support partial inference, so if ComponentContext
 * typing is desired while using the HOC withComponentContext, the Props for the
 * wrapped component must be provided as the first generic.
 */
export const withComponentContext = <
  P extends UnknownType,
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
  V extends CustomTrigger = CustomTrigger
>(
  Component: React.ComponentType<P>,
) => {
  const WithComponentContextComponent = (
    props: Omit<P, keyof ComponentContextValue<StreamChatGenerics, V>>,
  ) => {
    const componentContext = useComponentContext<StreamChatGenerics, V>();

    return <Component {...(props as P)} {...componentContext} />;
  };

  WithComponentContextComponent.displayName = (
    Component.displayName ||
    Component.name ||
    'Component'
  ).replace('Base', '');

  return WithComponentContextComponent;
};
