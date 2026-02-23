import type { PropsWithChildren } from 'react';
import React, { useContext } from 'react';

import type {
  AttachmentPreviewListProps,
  AttachmentProps,
  AvatarProps,
  AvatarStackProps,
  BaseImageProps,
  CalloutDialogProps,
  ChannelPreviewActionButtonsProps,
  DateSeparatorProps,
  EmojiSearchIndex,
  EmptyStateIndicatorProps,
  EventComponentProps,
  FileDragAndDropContentProps,
  FixedHeightMessageProps,
  GalleryProps,
  GiphyPreviewMessageProps,
  LoadingErrorIndicatorProps,
  LoadingIndicatorProps,
  MessageBouncePromptProps,
  MessageDeletedProps,
  MessageInputProps,
  MessageListNotificationsProps,
  MessageNotificationProps,
  MessageProps,
  MessageRepliesCountButtonProps,
  MessageStatusProps,
  MessageTimestampProps,
  MessageUIComponentProps,
  ModalGalleryProps,
  ModalProps,
  PinIndicatorProps,
  PollCreationDialogProps,
  PollOptionSelectorProps,
  QuotedMessagePreviewProps,
  ReactionOptions,
  ReactionSelectorProps,
  ReactionsListModalProps,
  ReactionsListProps,
  RecordingPermissionDeniedNotificationProps,
  ReminderNotificationProps,
  SendButtonProps,
  StartRecordingAudioButtonProps,
  StreamedMessageTextProps,
  TextareaComposerProps,
  ThreadHeaderProps,
  ThreadListItemProps,
  ThreadListItemUIProps,
  TimestampProps,
  TypingIndicatorProps,
  UnreadMessagesNotificationProps,
  UnreadMessagesSeparatorProps,
} from '../components';

import type {
  SuggestionItemProps,
  SuggestionListProps,
} from '../components/TextareaComposer';

import type {
  SearchProps,
  SearchResultsPresearchProps,
  SearchSourceResultListProps,
} from '../experimental';

import type { PropsWithChildrenOnly, UnknownType } from '../types/types';
import type { StopAIGenerationButtonProps } from '../components/MessageInput/StopAIGenerationButton';
import type { ShareLocationDialogProps } from '../components/Location';
import type { VideoPlayerProps } from '../components/VideoPlayer';
import type { EditedMessagePreviewProps } from '../components/MessageInput/EditedMessagePreview';

export type ComponentContextValue = {
  /** Custom UI component to display additional message composer action buttons left to the textarea, defaults to and accepts same props as: [AdditionalMessageComposerActions](https://github.com/GetStream/stream-chat-react/blob/master/src/components/MessageComposer/MessageComposerActions.tsx) */
  AdditionalMessageComposerActions?: React.ComponentType;
  /** Custom UI component to display a message attachment, defaults to and accepts same props as: [Attachment](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Attachment/Attachment.tsx) */
  Attachment?: React.ComponentType<AttachmentProps>;
  /** Custom UI component to display an attachment previews in MessageInput, defaults to and accepts same props as: [Attachment](https://github.com/GetStream/stream-chat-react/blob/master/src/components/MessageInput/AttachmentPreviewList.tsx) */
  AttachmentPreviewList?: React.ComponentType<AttachmentPreviewListProps>;
  /** Custom UI component to control adding attachments to MessageInput, defaults to and accepts same props as: [AttachmentSelector](https://github.com/GetStream/stream-chat-react/blob/master/src/components/MessageInput/AttachmentSelector.tsx) */
  AttachmentSelector?: React.ComponentType;
  /** Custom UI component for contents of attachment selector initiation button */
  AttachmentSelectorInitiationButtonContents?: React.ComponentType;
  /** Custom UI component to display AudioRecorder in MessageInput, defaults to and accepts same props as: [AudioRecorder](https://github.com/GetStream/stream-chat-react/blob/master/src/components/MessageInput/AudioRecorder.tsx) */
  AudioRecorder?: React.ComponentType;
  /** Optional UI component to override the default suggestion Item component, defaults to and accepts same props as: [Item](https://github.com/GetStream/stream-chat-react/blob/master/src/components/AutoCompleteTextarea/Item.js) */
  AutocompleteSuggestionItem?: React.ComponentType<SuggestionItemProps>;
  /** Optional UI component to override the default List component that displays suggestions, defaults to and accepts same props as: [List](https://github.com/GetStream/stream-chat-react/blob/master/src/components/AutoCompleteTextarea/List.js) */
  AutocompleteSuggestionList?: React.ComponentType<SuggestionListProps>;
  /** UI component to display a user's avatar, defaults to and accepts same props as: [Avatar](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Avatar/Avatar.tsx) */
  Avatar?: React.ComponentType<AvatarProps>;
  /** UI component to display a list of avatars stacked in a row, defaults to and accepts same props as: [AvatarStack](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Avatar/AvatarStack.tsx) */
  AvatarStack?: React.ComponentType<AvatarStackProps>;
  /** Custom UI component to display <img/> elements resp. a fallback in case of load error, defaults to and accepts same props as: [BaseImage](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Gallery/BaseImage.tsx) */
  BaseImage?: React.ComponentType<BaseImageProps>;
  /** Custom UI component to display the contents of callout dialog, accepts same props as: [DefaultCalloutDialog](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Dialog/base/Callout.tsx) */
  CalloutDialog?: React.ComponentType<CalloutDialogProps>;
  /** Custom UI component to display set of action buttons within `ChannelPreviewMessenger` component, accepts same props as: [ChannelPreviewActionButtons](https://github.com/GetStream/stream-chat-react/blob/master/src/components/ChannelList/ChannelPreviewActionButtons.tsx) */
  ChannelPreviewActionButtons?: React.ComponentType<ChannelPreviewActionButtonsProps>;
  /** Custom UI component to display command chip, defaults to and accepts same props as: [CommandChip](https://github.com/GetStream/stream-chat-react/blob/master/src/components/MessageInput/CommandChip.tsx) */
  CommandChip?: React.ComponentType;
  /** Custom UI component to display the slow mode cooldown timer, defaults to and accepts same props as: [CooldownTimer](https://github.com/GetStream/stream-chat-react/blob/master/src/components/MessageInput/CooldownTimer.tsx) */
  CooldownTimer?: React.ComponentType;
  /** Custom UI component for date separators, defaults to and accepts same props as: [DateSeparator](https://github.com/GetStream/stream-chat-react/blob/master/src/components/DateSeparator.tsx) */
  DateSeparator?: React.ComponentType<DateSeparatorProps>;
  /** Custom UI component to display the contents on file drag-and-drop overlay, defaults to and accepts same props as: [FileDragAndDropContent](https://github.com/GetStream/stream-chat-react/blob/master/src/components/MessageInput/WithDragAndDropUpload.tsx) */
  FileDragAndDropContent?: React.ComponentType<FileDragAndDropContentProps>;
  /** Custom UI component to override default preview of edited message, defaults to and accepts same props as: [EditedMessagePreview](https://github.com/GetStream/stream-chat-react/blob/master/src/components/MessageInput/EditedMessagePreview.tsx) */
  EditedMessagePreview?: React.ComponentType<EditedMessagePreviewProps>;
  /** Custom UI component for rendering button with emoji picker in MessageInput */
  EmojiPicker?: React.ComponentType;
  /** Mechanism to be used with autocomplete and text replace features of the `MessageInput` component, see [emoji-mart `SearchIndex`](https://github.com/missive/emoji-mart#%EF%B8%8F%EF%B8%8F-headless-search) */
  emojiSearchIndex?: EmojiSearchIndex;
  /** Custom UI component to be displayed when the `MessageList` is empty, defaults to and accepts same props as: [EmptyStateIndicator](https://github.com/GetStream/stream-chat-react/blob/master/src/components/EmptyStateIndicator/EmptyStateIndicator.tsx)  */
  EmptyStateIndicator?: React.ComponentType<EmptyStateIndicatorProps>;
  /** Custom UI component to display media items in a carousel, defaults to and accepts same props as: [Gallery](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Gallery/Gallery.tsx) */
  Gallery?: React.ComponentType<GalleryProps>;
  /** Custom UI component to render a Giphy preview in the `VirtualizedMessageList` */
  GiphyPreviewMessage?: React.ComponentType<GiphyPreviewMessageProps>;
  /** Custom UI component to render at the top of the `MessageList` */
  HeaderComponent?: React.ComponentType;
  /** Custom UI component handling how the message input is rendered, defaults to and accepts the same props as [MessageInputFlat](https://github.com/GetStream/stream-chat-react/blob/master/src/components/MessageInput/MessageInputFlat.tsx) */
  Input?: React.ComponentType<MessageInputProps>;
  /** Custom component to render link previews in message input **/
  LinkPreviewList?: React.ComponentType;
  /** Custom UI component to be shown if the channel query fails, defaults to and accepts same props as: [LoadingErrorIndicator](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Loading/LoadingErrorIndicator.tsx) */
  LoadingErrorIndicator?: React.ComponentType<LoadingErrorIndicatorProps>;
  /** Custom UI component to render while the `MessageList` is loading new messages, defaults to and accepts same props as: [LoadingIndicator](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Loading/LoadingIndicator.tsx) */
  LoadingIndicator?: React.ComponentType<LoadingIndicatorProps>;
  /** Custom UI component to display a message in the standard `MessageList`, defaults to and accepts the same props as: [MessageSimple](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Message/MessageSimple.tsx) */
  Message?: React.ComponentType<MessageUIComponentProps>;
  /** Custom UI component for message actions popup, accepts no props, all the defaults are set within [MessageActions (unstable)](https://github.com/GetStream/stream-chat-react/blob/master/src/experimental/MessageActions/MessageActions.tsx) */
  MessageActions?: React.ComponentType;
  /** Custom UI component to display the contents of a bounced message modal. Usually it allows to retry, edit, or delete the message. Defaults to and accepts the same props as: [MessageBouncePrompt](https://github.com/GetStream/stream-chat-react/blob/master/src/components/MessageBounce/MessageBouncePrompt.tsx) */
  MessageBouncePrompt?: React.ComponentType<MessageBouncePromptProps>;
  /** Custom UI component for a moderation-blocked message, defaults to and accepts same props as: [MessageBlocked](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Message/MessageBlocked.tsx) */
  MessageBlocked?: React.ComponentType;
  /** Custom UI component for a deleted message, defaults to and accepts same props as: [MessageDeleted](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Message/MessageDeleted.tsx) */
  MessageDeleted?: React.ComponentType<MessageDeletedProps>;
  /** Custom UI component for an indicator that a message is a thread reply sent to channel list: [MessageIsThreadReplyInChannelButtonIndicator](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Message/MessageIsThreadReplyInChannelButtonIndicator.tsx) */
  MessageIsThreadReplyInChannelButtonIndicator?: React.ComponentType;
  MessageListMainPanel?: React.ComponentType<PropsWithChildrenOnly>;
  /** Custom UI component that displays message and connection status notifications in the `MessageList`, defaults to and accepts same props as [DefaultMessageListNotifications](https://github.com/GetStream/stream-chat-react/blob/master/src/components/MessageList/MessageListNotifications.tsx) */
  MessageListNotifications?: React.ComponentType<MessageListNotificationsProps>;
  /** Custom UI component to display a notification when scrolled up the list and new messages arrive, defaults to and accepts same props as [MessageNotification](https://github.com/GetStream/stream-chat-react/blob/master/src/components/MessageList/MessageNotification.tsx) */
  MessageNotification?: React.ComponentType<MessageNotificationProps>;
  /** Custom UI component to display message replies, defaults to and accepts same props as: [MessageRepliesCountButton](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Message/MessageRepliesCountButton.tsx) */
  MessageRepliesCountButton?: React.ComponentType<MessageRepliesCountButtonProps>;
  /** Custom UI component to display message delivery status, defaults to and accepts same props as: [MessageStatus](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Message/MessageStatus.tsx) */
  MessageStatus?: React.ComponentType<MessageStatusProps>;
  /** Custom UI component to display system messages, defaults to and accepts same props as: [EventComponent](https://github.com/GetStream/stream-chat-react/blob/master/src/components/EventComponent/EventComponent.tsx) */
  MessageSystem?: React.ComponentType<EventComponentProps>;
  /** Custom UI component to display a timestamp on a message, defaults to and accepts same props as: [MessageTimestamp](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Message/MessageTimestamp.tsx) */
  MessageTimestamp?: React.ComponentType<MessageTimestampProps>;
  /** Custom UI component for viewing content in a modal, defaults to and accepts the same props as [Modal](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Modal/Modal.tsx) */
  Modal?: React.ComponentType<ModalProps>;
  /** Custom UI component for viewing message's image and giphy attachments with option to expand into the Gallery on Modal, defaults to and accepts the same props as [ModalGallery](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Gallery/ModalGallery.tsx) */
  ModalGallery?: React.ComponentType<ModalGalleryProps>;
  /** Custom UI component to override default pinned message indicator, defaults to and accepts same props as: [PinIndicator](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Message/PinIndicator.tsx) */
  PinIndicator?: React.ComponentType<PinIndicatorProps>;
  /** Custom UI component to override default poll actions rendering in a message, defaults to and accepts same props as: [PollActions](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Poll/PollActions/PollActions.tsx) */
  PollActions?: React.ComponentType;
  /** Custom UI component to override default poll rendering in a message, defaults to and accepts same props as: [PollContent](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Poll/PollContent.tsx) */
  PollContent?: React.ComponentType;
  /** Custom UI component to override default poll creation dialog contents, defaults to and accepts same props as: [PollCreationDialog](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Poll/PollCreationDialog/PollCreationDialog.tsx) */
  PollCreationDialog?: React.ComponentType<PollCreationDialogProps>;
  /** Custom UI component to override default poll header in a message, defaults to and accepts same props as: [PollHeader](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Poll/PollHeader.tsx) */
  PollHeader?: React.ComponentType;
  /** Custom UI component to override default poll option selector, defaults to and accepts same props as: [PollOptionSelector](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Poll/PollOptionSelector.tsx) */
  PollOptionSelector?: React.ComponentType<PollOptionSelectorProps>;
  /** Custom UI component to override quoted message UI on a sent message, defaults to and accepts same props as: [QuotedMessage](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Message/QuotedMessage.tsx) */
  QuotedMessage?: React.ComponentType;
  /** Custom UI component to override the message input's quoted message preview, defaults to and accepts same props as: [QuotedMessagePreview](https://github.com/GetStream/stream-chat-react/blob/master/src/components/MessageInput/QuotedMessagePreview.tsx) */
  QuotedMessagePreview?: React.ComponentType<QuotedMessagePreviewProps>;
  /** Custom reaction options to be applied to ReactionSelector, ReactionList and SimpleReactionList components */
  reactionOptions?: ReactionOptions;
  /** Custom UI component to display the reaction selector, defaults to and accepts same props as: [ReactionSelector](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Reactions/ReactionSelector.tsx) */
  ReactionSelector?: React.ForwardRefExoticComponent<ReactionSelectorProps>;
  /** Custom UI component to display the list of reactions on a message, defaults to and accepts same props as: [ReactionsList](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Reactions/ReactionsList.tsx) */
  ReactionsList?: React.ComponentType<ReactionsListProps>;
  /** Custom UI component to display the reactions modal, defaults to and accepts same props as: [ReactionsListModal](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Reactions/ReactionsListModal.tsx) */
  ReactionsListModal?: React.ComponentType<ReactionsListModalProps>;
  RecordingPermissionDeniedNotification?: React.ComponentType<RecordingPermissionDeniedNotificationProps>;
  /** Custom UI component to display the message reminder information in the Message UI, defaults to and accepts same props as: [ReminderNotification](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Message/ReminderNotification.tsx) */
  ReminderNotification?: React.ComponentType<ReminderNotificationProps>;
  /** Custom component to display the search UI, defaults to and accepts same props as: [Search](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Search/Search.tsx) */
  Search?: React.ComponentType<SearchProps>;
  /** Custom component to display the UI where the searched string is entered, defaults to and accepts same props as: [SearchBar](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Search/SearchBar/SearchBar.tsx) */
  SearchBar?: React.ComponentType;
  /** Custom component for the search UI dedicated to display the results area, defaults to and accepts same props as: [SearchResults](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Search/SearchResults/SearchResults.tsx) */
  SearchResults?: React.ComponentType;
  /** Custom UI component to display header of search results pane, defaults to and accepts same props as: [SearchResultsHeader](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Search/SearchResults/SearchResultsHeader.tsx) */
  SearchResultsHeader?: React.ComponentType;
  /** Custom component to display search results pane before emitting the first search query for a given source, defaults to and accepts same props as: [SearchResultsPresearch](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Search/SearchResults/SearchSourceResultsPresearch.tsx) */
  SearchResultsPresearch?: React.ComponentType<SearchResultsPresearchProps>;
  /** Custom component to display the search source items results, defaults to and accepts same props as: [SearchSourceResultList](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Search/SearchResults/SearchSourceResultList.tsx) */
  SearchSourceResultList?: React.ComponentType<SearchSourceResultListProps>;
  /** Custom component to indicate the end of the last page for a searched source, defaults to and accepts same props as: [SearchSourceResultListFooter](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Search/SearchResults/SearchSourceResultListFooter.tsx) */
  SearchSourceResultListFooter?: React.ComponentType;
  /** Custom UI component to display search results items for a given search source pane, defaults to and accepts same props as: [SearchSourceResults](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Search/SearchResults/SourceSearchResults.tsx) */
  SearchSourceResults?: React.ComponentType;
  /** Custom component to display the search source results UI with 0 items found, defaults to and accepts same props as: [SearchSourceResultsEmpty](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Search/SearchResults/SearchSourceResultsEmpty.tsx) */
  SearchSourceResultsEmpty?: React.ComponentType;
  /** Custom component to display the header content for a given search source results, no default component is provided. */
  SearchSourceResultsHeader?: React.ComponentType;
  /** Custom component to display the search source results UI during the search query execution, defaults to and accepts same props as: [SearchSourceResultsLoadingIndicator](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Search/SearchResults/SearchSourceResultsLoadingIndicator.tsx) */
  SearchSourceResultsLoadingIndicator?: React.ComponentType;
  /** Custom UI component for send button, defaults to and accepts same props as: [SendButton](https://github.com/GetStream/stream-chat-react/blob/master/src/components/MessageInput/icons.tsx) */
  SendButton?: React.ComponentType<SendButtonProps>;
  /** Custom UI component checkbox that indicates message to be sent to main channel, defaults to and accepts same props as: [SendToChannelCheckbox](https://github.com/GetStream/stream-chat-react/blob/master/src/components/MessageInput/SendToChannelCheckbox.tsx) */
  SendToChannelCheckbox?: React.ComponentType;
  /** Custom UI component to render the location sharing dialog, defaults to and accepts same props as: [ShareLocationDialog](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Location/ShareLocationDialog.tsx) */
  ShareLocationDialog?: React.ComponentType<ShareLocationDialogProps>;
  /** Custom UI component button for initiating audio recording, defaults to and accepts same props as: [StartRecordingAudioButton](https://github.com/GetStream/stream-chat-react/blob/master/src/components/MediaRecorder/AudioRecorder/AudioRecordingButtons.tsx) */
  StartRecordingAudioButton?: React.ComponentType<StartRecordingAudioButtonProps>;
  StopAIGenerationButton?: React.ComponentType<StopAIGenerationButtonProps> | null;
  StreamedMessageText?: React.ComponentType<StreamedMessageTextProps>;
  /** Custom UI component to handle message text input, defaults to and accepts same props as [TextareaComposer](https://github.com/GetStream/stream-chat-react/blob/master/src/components/TextareaComposer/TextareaComposer.tsx) */
  TextareaComposer?: React.ComponentType<TextareaComposerProps>;
  /** Custom UI component that displays thread's parent or other message at the top of the `MessageList`, defaults to and accepts same props as [MessageSimple](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Message/MessageSimple.tsx) */
  ThreadHead?: React.ComponentType<MessageProps>;
  /** Custom UI component to display the header of a `Thread`, defaults to and accepts same props as: [DefaultThreadHeader](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Thread/Thread.tsx) */
  ThreadHeader?: React.ComponentType<ThreadHeaderProps>;
  ThreadInput?: React.ComponentType<MessageInputProps>;
  ThreadListEmptyPlaceholder?: React.ComponentType;
  ThreadListItem?: React.ComponentType<ThreadListItemProps>;
  ThreadListItemUI?: React.ComponentType<ThreadListItemUIProps>;
  ThreadListLoadingIndicator?: React.ComponentType;
  ThreadListUnseenThreadsBanner?: React.ComponentType;
  /** Custom UI component to display the start of a threaded `MessageList`, defaults to and accepts same props as: [DefaultThreadStart](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Thread/Thread.tsx) */
  ThreadStart?: React.ComponentType;
  /** Custom UI component to display a date used in timestamps. It's used internally by the default `MessageTimestamp`, and to display a timestamp for edited messages. */
  Timestamp?: React.ComponentType<TimestampProps>;
  /** Custom UI component for the typing indicator, defaults to and accepts same props as: [TypingIndicator](https://github.com/GetStream/stream-chat-react/blob/master/src/components/TypingIndicator/TypingIndicator.tsx) */
  TypingIndicator?: React.ComponentType<TypingIndicatorProps>;
  /** Custom UI component that indicates a user is viewing unread messages. It disappears once the user scrolls to UnreadMessagesSeparator. Defaults to and accepts same props as: [UnreadMessagesNotification](https://github.com/GetStream/stream-chat-react/blob/master/src/components/MessageList/UnreadMessagesNotification.tsx) */
  UnreadMessagesNotification?: React.ComponentType<UnreadMessagesNotificationProps>;
  /** Custom UI component that separates read messages from unread, defaults to and accepts same props as: [UnreadMessagesSeparator](https://github.com/GetStream/stream-chat-react/blob/master/src/components/MessageList/UnreadMessagesSeparator.tsx) */
  UnreadMessagesSeparator?: React.ComponentType<UnreadMessagesSeparatorProps>;
  /** Component used to play video. If not provided, ReactPlayer is used as a default video player. */
  VideoPlayer?: React.ComponentType<VideoPlayerProps>;
  /** Custom UI component to display a message in the `VirtualizedMessageList`, does not have a default implementation */
  VirtualMessage?: React.ComponentType<FixedHeightMessageProps>;
  /** Custom UI component to wrap MessageList children. Default is the `ul` tag */
  MessageListWrapper?: React.ComponentType<PropsWithChildren>;
  /** Custom UI component to wrap each element of MessageList. Default is the `li` tag */
  MessageListItem?: React.ComponentType<PropsWithChildren>;
};

export const ComponentContext = React.createContext<ComponentContextValue>({});

export const ComponentProvider = ({
  children,
  value,
}: PropsWithChildren<{
  value: Partial<ComponentContextValue>;
}>) => (
  <ComponentContext.Provider value={value as unknown as ComponentContextValue}>
    {children}
  </ComponentContext.Provider>
);

export const useComponentContext = (
  /**
   * @deprecated
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _componentName?: string,
) => useContext(ComponentContext) as unknown as ComponentContextValue;

/**
 * Typescript currently does not support partial inference, so if ComponentContext
 * typing is desired while using the HOC withComponentContext, the Props for the
 * wrapped component must be provided as the first generic.
 */
export const withComponentContext = <P extends UnknownType>(
  Component: React.ComponentType<P>,
) => {
  const WithComponentContextComponent = (props: Omit<P, keyof ComponentContextValue>) => {
    const componentContext = useComponentContext();

    return <Component {...(props as P)} {...componentContext} />;
  };

  WithComponentContextComponent.displayName = (
    Component.displayName ||
    Component.name ||
    'Component'
  ).replace('Base', '');

  return WithComponentContextComponent;
};
