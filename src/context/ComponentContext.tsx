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
import type {
  CustomTrigger,
  DefaultStreamChatGenerics,
  PropsWithChildrenOnly,
  UnknownType,
} from '../types/types';

export type ComponentContextValue<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
  V extends CustomTrigger = CustomTrigger
> = {
  /** Custom UI component to display a message attachment, defaults to and accepts same props as: [Attachment](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Attachment/Attachment.tsx) */
  Attachment?: React.ComponentType<AttachmentProps<StreamChatGenerics>>;
  /** Custom UI component to display an attachment previews in MessageInput, defaults to and accepts same props as: [Attachment](https://github.com/GetStream/stream-chat-react/blob/master/src/components/MessageInput/AttachmentPreviewList.tsx) */
  AttachmentPreviewList?: React.ComponentType<AttachmentPreviewListProps>;
  /** Custom UI component to display AudioRecorder in MessageInput, defaults to and accepts same props as: [AudioRecorder](https://github.com/GetStream/stream-chat-react/blob/master/src/components/MessageInput/AudioRecorder.tsx) */
  AudioRecorder?: React.ComponentType;
  /** Optional UI component to override the default suggestion Item component, defaults to and accepts same props as: [Item](https://github.com/GetStream/stream-chat-react/blob/master/src/components/AutoCompleteTextarea/Item.js) */
  AutocompleteSuggestionItem?: React.ComponentType<SuggestionItemProps<StreamChatGenerics>>;
  /** Optional UI component to override the default List component that displays suggestions, defaults to and accepts same props as: [List](https://github.com/GetStream/stream-chat-react/blob/master/src/components/AutoCompleteTextarea/List.js) */
  AutocompleteSuggestionList?: React.ComponentType<SuggestionListProps<StreamChatGenerics>>;
  /** UI component to display a user's avatar, defaults to and accepts same props as: [Avatar](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Avatar/Avatar.tsx) */
  Avatar?: React.ComponentType<AvatarProps<StreamChatGenerics>>;
  /** Custom UI component to display <img/> elements resp. a fallback in case of load error, defaults to and accepts same props as: [BaseImage](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Gallery/BaseImage.tsx) */
  BaseImage?: React.ComponentType<BaseImageProps>;
  /** Custom UI component to display the slow mode cooldown timer, defaults to and accepts same props as: [CooldownTimer](https://github.com/GetStream/stream-chat-react/blob/master/src/components/MessageInput/CooldownTimer.tsx) */
  CooldownTimer?: React.ComponentType<CooldownTimerProps>;
  /** Custom UI component to render set of buttons to be displayed in the MessageActionsBox, defaults to and accepts same props as: [CustomMessageActionsList](https://github.com/GetStream/stream-chat-react/blob/master/src/components/MessageActions/CustomMessageActionsList.tsx) */
  CustomMessageActionsList?: React.ComponentType<CustomMessageActionsListProps<StreamChatGenerics>>;
  /** Custom UI component for date separators, defaults to and accepts same props as: [DateSeparator](https://github.com/GetStream/stream-chat-react/blob/master/src/components/DateSeparator.tsx) */
  DateSeparator?: React.ComponentType<DateSeparatorProps>;
  /** Custom UI component to override default edit message input, defaults to and accepts same props as: [EditMessageForm](https://github.com/GetStream/stream-chat-react/blob/master/src/components/MessageInput/EditMessageForm.tsx) */
  EditMessageInput?: React.ComponentType<MessageInputProps<StreamChatGenerics>>;
  /** Custom UI component for rendering button with emoji picker in MessageInput */
  EmojiPicker?: React.ComponentType;
  /** Mechanism to be used with autocomplete and text replace features of the `MessageInput` component, see [emoji-mart `SearchIndex`](https://github.com/missive/emoji-mart#%EF%B8%8F%EF%B8%8F-headless-search) */
  emojiSearchIndex?: EmojiSearchIndex;
  /** Custom UI component to be displayed when the `MessageList` is empty, defaults to and accepts same props as: [EmptyStateIndicator](https://github.com/GetStream/stream-chat-react/blob/master/src/components/EmptyStateIndicator/EmptyStateIndicator.tsx)  */
  EmptyStateIndicator?: React.ComponentType<EmptyStateIndicatorProps>;
  /** Custom UI component for file upload icon, defaults to and accepts same props as: [FileUploadIcon](https://github.com/GetStream/stream-chat-react/blob/master/src/components/MessageInput/icons.tsx) */
  FileUploadIcon?: React.ComponentType;
  /** Custom UI component to render a Giphy preview in the `VirtualizedMessageList` */
  GiphyPreviewMessage?: React.ComponentType<GiphyPreviewMessageProps<StreamChatGenerics>>;
  /** Custom UI component to render at the top of the `MessageList` */
  HeaderComponent?: React.ComponentType;
  /** Custom UI component handling how the message input is rendered, defaults to and accepts the same props as [MessageInputFlat](https://github.com/GetStream/stream-chat-react/blob/master/src/components/MessageInput/MessageInputFlat.tsx) */
  Input?: React.ComponentType<MessageInputProps<StreamChatGenerics, V>>;
  /** Custom component to render link previews in message input **/
  LinkPreviewList?: React.ComponentType<LinkPreviewListProps>;
  /** Custom UI component to render while the `MessageList` is loading new messages, defaults to and accepts same props as: [LoadingIndicator](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Loading/LoadingIndicator.tsx) */
  LoadingIndicator?: React.ComponentType<LoadingIndicatorProps>;
  /** Custom UI component to display a message in the standard `MessageList`, defaults to and accepts the same props as: [MessageSimple](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Message/MessageSimple.tsx) */
  Message?: React.ComponentType<MessageUIComponentProps<StreamChatGenerics>>;
  /** Custom UI component to display the contents of a bounced message modal. Usually it allows to retry, edit, or delete the message. Defaults to and accepts the same props as: [MessageBouncePrompt](https://github.com/GetStream/stream-chat-react/blob/master/src/components/MessageBounce/MessageBouncePrompt.tsx) */
  MessageBouncePrompt?: React.ComponentType<MessageBouncePromptProps>;
  /** Custom UI component for a deleted message, defaults to and accepts same props as: [MessageDeleted](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Message/MessageDeleted.tsx) */
  MessageDeleted?: React.ComponentType<MessageDeletedProps<StreamChatGenerics>>;
  MessageListMainPanel?: React.ComponentType<PropsWithChildrenOnly>;
  /** Custom UI component that displays message and connection status notifications in the `MessageList`, defaults to and accepts same props as [DefaultMessageListNotifications](https://github.com/GetStream/stream-chat-react/blob/master/src/components/MessageList/MessageListNotifications.tsx) */
  MessageListNotifications?: React.ComponentType<MessageListNotificationsProps>;
  /** Custom UI component to display a notification when scrolled up the list and new messages arrive, defaults to and accepts same props as [MessageNotification](https://github.com/GetStream/stream-chat-react/blob/master/src/components/MessageList/MessageNotification.tsx) */
  MessageNotification?: React.ComponentType<MessageNotificationProps>;
  /** Custom UI component for message options popup, defaults to and accepts same props as: [MessageOptions](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Message/MessageOptions.tsx) */
  MessageOptions?: React.ComponentType<MessageOptionsProps<StreamChatGenerics>>;
  /** Custom UI component to display message replies, defaults to and accepts same props as: [MessageRepliesCountButton](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Message/MessageRepliesCountButton.tsx) */
  MessageRepliesCountButton?: React.ComponentType<MessageRepliesCountButtonProps>;
  /** Custom UI component to display message delivery status, defaults to and accepts same props as: [MessageStatus](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Message/MessageStatus.tsx) */
  MessageStatus?: React.ComponentType<MessageStatusProps>;
  /** Custom UI component to display system messages, defaults to and accepts same props as: [EventComponent](https://github.com/GetStream/stream-chat-react/blob/master/src/components/EventComponent/EventComponent.tsx) */
  MessageSystem?: React.ComponentType<EventComponentProps<StreamChatGenerics>>;
  /** Custom UI component to display a timestamp on a message, defaults to and accepts same props as: [MessageTimestamp](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Message/MessageTimestamp.tsx) */
  MessageTimestamp?: React.ComponentType<MessageTimestampProps<StreamChatGenerics>>;
  /** Custom UI component for viewing message's image attachments, defaults to and accepts the same props as [ModalGallery](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Gallery/ModalGallery.tsx) */
  ModalGallery?: React.ComponentType<ModalGalleryProps>;
  /** Custom UI component to override default pinned message indicator, defaults to and accepts same props as: [PinIndicator](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Message/icons.tsx) */
  PinIndicator?: React.ComponentType<PinIndicatorProps<StreamChatGenerics>>;
  /** Custom UI component to override quoted message UI on a sent message, defaults to and accepts same props as: [QuotedMessage](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Message/QuotedMessage.tsx) */
  QuotedMessage?: React.ComponentType;
  /** Custom UI component to override the message input's quoted message preview, defaults to and accepts same props as: [QuotedMessagePreview](https://github.com/GetStream/stream-chat-react/blob/master/src/components/MessageInput/QuotedMessagePreview.tsx) */
  QuotedMessagePreview?: React.ComponentType<QuotedMessagePreviewProps<StreamChatGenerics>>;
  /** Custom reaction options to be applied to ReactionSelector, ReactionList and SimpleReactionList components */
  reactionOptions?: ReactionOptions;
  /** Custom UI component to display the reaction selector, defaults to and accepts same props as: [ReactionSelector](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Reactions/ReactionSelector.tsx) */
  ReactionSelector?: React.ForwardRefExoticComponent<ReactionSelectorProps<StreamChatGenerics>>;
  /** Custom UI component to display the list of reactions on a message, defaults to and accepts same props as: [ReactionsList](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Reactions/ReactionsList.tsx) */
  ReactionsList?: React.ComponentType<ReactionsListProps<StreamChatGenerics>>;
  RecordingPermissionDeniedNotification?: React.ComponentType<RecordingPermissionDeniedNotificationProps>;
  /** Custom UI component for send button, defaults to and accepts same props as: [SendButton](https://github.com/GetStream/stream-chat-react/blob/master/src/components/MessageInput/icons.tsx) */
  SendButton?: React.ComponentType<SendButtonProps<StreamChatGenerics>>;
  /** Custom UI component button for initiating audio recording, defaults to and accepts same props as: [StartRecordingAudioButton](https://github.com/GetStream/stream-chat-react/blob/master/src/components/MediaRecorder/AudioRecorder/AudioRecordingButtons.tsx) */
  StartRecordingAudioButton?: React.ComponentType<StartRecordingAudioButtonProps>;
  /** Custom UI component that displays thread's parent or other message at the top of the `MessageList`, defaults to and accepts same props as [MessageSimple](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Message/MessageSimple.tsx) */
  ThreadHead?: React.ComponentType<MessageProps<StreamChatGenerics>>;
  /** Custom UI component to display the header of a `Thread`, defaults to and accepts same props as: [DefaultThreadHeader](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Thread/Thread.tsx) */
  ThreadHeader?: React.ComponentType<ThreadHeaderProps<StreamChatGenerics>>;
  ThreadInput?: React.ComponentType<MessageInputProps<StreamChatGenerics, V>>;
  ThreadListEmptyPlaceholder?: React.ComponentType;
  ThreadListItem?: React.ComponentType<ThreadListItemProps>;
  ThreadListItemUI?: React.ComponentType<ThreadListItemUIProps>;
  ThreadListLoadingIndicator?: React.ComponentType;
  ThreadListUnseenThreadsBanner?: React.ComponentType;
  /** Custom UI component to display the start of a threaded `MessageList`, defaults to and accepts same props as: [DefaultThreadStart](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Thread/Thread.tsx) */
  ThreadStart?: React.ComponentType;
  /** Custom UI component to display a date used in timestamps. It's used internally by the default `MessageTimestamp`, and to display a timestamp for edited messages. */
  Timestamp?: React.ComponentType<TimestampProps>;
  /** Optional context provider that lets you override the default autocomplete triggers, defaults to: [DefaultTriggerProvider](https://github.com/GetStream/stream-chat-react/blob/master/src/components/MessageInput/DefaultTriggerProvider.tsx) */
  TriggerProvider?: React.ComponentType;
  /** Custom UI component for the typing indicator, defaults to and accepts same props as: [TypingIndicator](https://github.com/GetStream/stream-chat-react/blob/master/src/components/TypingIndicator/TypingIndicator.tsx) */
  TypingIndicator?: React.ComponentType<TypingIndicatorProps>;
  /** Custom UI component that indicates a user is viewing unread messages. It disappears once the user scrolls to UnreadMessagesSeparator. Defaults to and accepts same props as: [UnreadMessagesNotification](https://github.com/GetStream/stream-chat-react/blob/master/src/components/MessageList/UnreadMessagesNotification.tsx) */
  UnreadMessagesNotification?: React.ComponentType<UnreadMessagesNotificationProps>;
  /** Custom UI component that separates read messages from unread, defaults to and accepts same props as: [UnreadMessagesSeparator](https://github.com/GetStream/stream-chat-react/blob/master/src/components/MessageList/UnreadMessagesSeparator.tsx) */
  UnreadMessagesSeparator?: React.ComponentType<UnreadMessagesSeparatorProps>;
  /** Custom UI component to display a message in the `VirtualizedMessageList`, does not have a default implementation */
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
