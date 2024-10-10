import React, { PropsWithChildren, useContext } from 'react';

import {
  BaseImageProps,
  CooldownTimerProps,
  CustomMessageActionsListProps,
  StartRecordingAudioButtonProps,
} from '../components';

import type {
  AttachmentPreviewListProps,
  AttachmentProps,
  AvatarProps,
  DateSeparatorProps,
  EmojiSearchIndex,
  EmptyStateIndicatorProps,
  EventComponentProps,
  FixedHeightMessageProps,
  GiphyPreviewMessageProps,
  LinkPreviewListProps,
  LoadingIndicatorProps,
  MessageDeletedProps,
  MessageInputProps,
  MessageListNotificationsProps,
  MessageNotificationProps,
  MessageOptionsProps,
  MessageProps,
  MessageRepliesCountButtonProps,
  MessageStatusProps,
  MessageTimestampProps,
  MessageUIComponentProps,
  ModalGalleryProps,
  PinIndicatorProps,
  QuotedMessagePreviewProps,
  ReactionOptions,
  ReactionSelectorProps,
  ReactionsListProps,
  RecordingPermissionDeniedNotificationProps,
  SendButtonProps,
  SuggestionItemProps,
  SuggestionListProps,
  ThreadHeaderProps,
  ThreadListItemProps,
  ThreadListItemUIProps,
  TypingIndicatorProps,
  UnreadMessagesNotificationProps,
  UnreadMessagesSeparatorProps,
} from '../components';

import type { MessageBouncePromptProps } from '../components/MessageBounce';
import type { TimestampProps } from '../components/Message/Timestamp';
import type { CustomTrigger, DefaultStreamChatGenerics, UnknownType } from '../types/types';

export type ComponentContextValue<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
  V extends CustomTrigger = CustomTrigger
> = {
  Attachment?: React.ComponentType<AttachmentProps<StreamChatGenerics>>;
  AttachmentPreviewList?: React.ComponentType<AttachmentPreviewListProps>;
  AttachmentSelector?: React.ComponentType;
  AudioRecorder?: React.ComponentType;
  AutocompleteSuggestionItem?: React.ComponentType<SuggestionItemProps<StreamChatGenerics>>;
  AutocompleteSuggestionList?: React.ComponentType<SuggestionListProps<StreamChatGenerics>>;
  Avatar?: React.ComponentType<AvatarProps<StreamChatGenerics>>;
  BaseImage?: React.ComponentType<BaseImageProps>;
  CooldownTimer?: React.ComponentType<CooldownTimerProps>;
  CustomMessageActionsList?: React.ComponentType<CustomMessageActionsListProps<StreamChatGenerics>>;
  DateSeparator?: React.ComponentType<DateSeparatorProps>;
  EditMessageInput?: React.ComponentType<MessageInputProps<StreamChatGenerics>>;
  EmojiPicker?: React.ComponentType;
  emojiSearchIndex?: EmojiSearchIndex;
  EmptyStateIndicator?: React.ComponentType<EmptyStateIndicatorProps>;
  FileUploadIcon?: React.ComponentType;
  GiphyPreviewMessage?: React.ComponentType<GiphyPreviewMessageProps<StreamChatGenerics>>;
  HeaderComponent?: React.ComponentType;
  Input?: React.ComponentType<MessageInputProps<StreamChatGenerics, V>>;
  LinkPreviewList?: React.ComponentType<LinkPreviewListProps>;
  LoadingIndicator?: React.ComponentType<LoadingIndicatorProps>;
  Message?: React.ComponentType<MessageUIComponentProps<StreamChatGenerics>>;
  MessageBouncePrompt?: React.ComponentType<MessageBouncePromptProps>;
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
  reactionOptions?: ReactionOptions;
  ReactionSelector?: React.ForwardRefExoticComponent<ReactionSelectorProps<StreamChatGenerics>>;
  ReactionsList?: React.ComponentType<ReactionsListProps<StreamChatGenerics>>;
  RecordingPermissionDeniedNotification?: React.ComponentType<RecordingPermissionDeniedNotificationProps>;
  SendButton?: React.ComponentType<SendButtonProps<StreamChatGenerics>>;
  StartRecordingAudioButton?: React.ComponentType<StartRecordingAudioButtonProps>;
  ThreadHead?: React.ComponentType<MessageProps<StreamChatGenerics>>;
  ThreadHeader?: React.ComponentType<ThreadHeaderProps<StreamChatGenerics>>;
  ThreadInput?: React.ComponentType<MessageInputProps<StreamChatGenerics, V>>;
  ThreadListEmptyPlaceholder?: React.ComponentType;
  ThreadListItem?: React.ComponentType<ThreadListItemProps>;
  ThreadListItemUI?: React.ComponentType<ThreadListItemUIProps>;
  ThreadListLoadingIndicator?: React.ComponentType;
  ThreadListUnseenThreadsBanner?: React.ComponentType;
  ThreadStart?: React.ComponentType;
  Timestamp?: React.ComponentType<TimestampProps>;
  TriggerProvider?: React.ComponentType;
  TypingIndicator?: React.ComponentType<TypingIndicatorProps>;
  UnreadMessagesNotification?: React.ComponentType<UnreadMessagesNotificationProps>;
  UnreadMessagesSeparator?: React.ComponentType<UnreadMessagesSeparatorProps>;
  VirtualMessage?: React.ComponentType<FixedHeightMessageProps<StreamChatGenerics>>;
};

export const ComponentContext = React.createContext<ComponentContextValue>({});

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
  /**
   * @deprecated
   */
  // eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
  _componentName?: string,
) => (useContext(ComponentContext) as unknown) as ComponentContextValue<StreamChatGenerics, V>;

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
