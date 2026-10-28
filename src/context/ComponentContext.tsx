import type { ComponentProps, ComponentType, PropsWithChildren } from 'react';
import React, { useContext } from 'react';
import type { UserResponse } from 'stream-chat';

import {
  type AttachmentPreviewListProps,
  type AttachmentProps,
  type AvatarStackProps,
  type BaseImageProps,
  type CalloutDialogProps,
  type ChannelAvatarProps,
  type ChannelListItemUIProps,
  type ContextMenuContentProps,
  type ContextMenuProps,
  type DateSeparatorProps,
  type EmojiSearchIndex,
  type EmptyStateIndicatorProps,
  type EventComponentProps,
  type FileDragAndDropContentProps,
  type GalleryProps,
  type GiphyPreviewMessageProps,
  type ImagePlaceholderProps,
  type LoadingIndicatorProps,
  type MessageBouncePromptProps,
  type MessageComposerProps,
  type MessageDeletedProps,
  type MessageEditedIndicatorProps,
  type MessageProps,
  type MessageReactionsDetailProps,
  type MessageReactionsProps,
  type MessageRepliesCountButtonProps,
  type MessageStatusProps,
  type MessageTimestampProps,
  type MessageUIComponentProps,
  type ModalGalleryProps,
  type ModalProps,
  type NewMessageNotificationProps,
  type NotificationListProps,
  type NotificationProps,
  type PinIndicatorProps,
  type PollCreationDialogProps,
  type PollOptionSelectorProps,
  type QuotedMessagePreviewProps,
  type ReactionOptions,
  type ReactionSelector,
  type ReactionSelectorProps,
  type RecordingPermissionDeniedNotificationProps,
  type ReminderNotificationProps,
  type ScrollToLatestMessageButtonProps,
  type SearchResultsPresearchProps,
  type SearchSourceResultListProps,
  type SendButtonProps,
  type ShareLocationDialogProps,
  type StartRecordingAudioButtonProps,
  type StreamedMessageTextProps,
  type TextareaComposerProps,
  type ThreadListItemProps,
  type ThreadListItemUIProps,
  type TimestampProps,
  type TranslationIndicatorProps,
  type UnreadMessagesNotificationProps,
  type UnreadMessagesSeparatorProps,
  type VoiceRecordingPreviewSlotProps,
} from '../components';

import type {
  SuggestionItemProps,
  SuggestionListProps,
} from '../components/TextareaComposer';

import type { PropsWithChildrenOnly } from '../types/types';
import type { StopAIGenerationButtonProps } from '../components/MessageComposer/StopAIGenerationButton';
import type { VideoPlayerProps } from '../components/VideoPlayer';
import type { EditedMessagePreviewProps } from '../components/MessageComposer/EditedMessagePreview';
import type { FileIconProps } from '../components/FileIcon/FileIcon';
import type { FileSizeIndicatorProps } from '../components/Attachment/components/FileSizeIndicator';
import type { CommandChipProps } from '../components/MessageComposer/CommandChip';
import type { ProgressIndicatorProps } from '../components/Loading/progress-indicators';
import type { UploadedSizeIndicatorProps } from '../components/Loading/UploadedSizeIndicator';
import type { NotificationAnnouncerProps } from '../components/Accessibility';
import type { SummarizedMessagePreviewProps } from '../components/SummarizedMessagePreview';
import type { TypingIndicatorProps } from '../components/TypingIndicator';
import type { AttachmentUploadProgressIndicatorProps } from '../components/Attachment/components/AttachmentUploadProgressIndicator';
import type { IconSlots } from '../components/Icons/slots';

export type ComponentContextValue = {
  /** Progress of an attachment whose upload is still in flight. */
  AttachmentUploadProgressIndicator?: React.ComponentType<AttachmentUploadProgressIndicatorProps>;
  /** Custom UI component rendered when a paginated list (e.g. the channel list) is empty. */
  EmptyListIndicator?: React.ComponentType;
  /** Custom UI component rendered at the top/bottom edge of a paginated list. */
  EndReachedIndicator?: React.ComponentType<{
    hasEnded: boolean;
    reached: 'top' | 'bottom';
  }>;
  /** Custom UI component rendered while a paginated list loads its first page. */
  FirstPageLoadingIndicator?: React.ComponentType;
  /** Custom UI component rendered per item of a paginated list. */
  ListItem?: ComponentType<{ item: unknown }>;
  /** Custom UI component rendered while a paginated list loads its next page. */
  LoadingNextPageIndicator?: React.ComponentType<{ isLoading?: boolean }>;
  /** Actions between the textarea and the send actions. The default renders the `EmojiPicker`. */
  AdditionalMessageComposerActions?: React.ComponentType;
  /** Renders a message attachment. */
  Attachment?: React.ComponentType<AttachmentProps>;
  /**
   * File type icon on file attachments (e.g. PDF, doc). Override it to change the dimensions or
   * the icon.
   */
  AttachmentFileIcon?: React.ComponentType<FileIconProps>;
  /** Attachment previews in the `MessageComposer`. */
  AttachmentPreviewList?: React.ComponentType<AttachmentPreviewListProps>;
  /** Control for adding attachments to the `MessageComposer`. */
  AttachmentSelector?: React.ComponentType;
  /** Slot for the voice recording preview above the composer attachments. */
  VoiceRecordingPreviewSlot?: React.ComponentType<VoiceRecordingPreviewSlotProps>;
  /** Contents of the attachment selector's initiation button. */
  AttachmentSelectorInitiationButtonContents?: React.ComponentType;
  /** Audio recorder in the `MessageComposer`. */
  AudioRecorder?: React.ComponentType;
  /** Item in the composer's suggestion list. */
  AutocompleteSuggestionItem?: React.ComponentType<SuggestionItemProps>;
  /** List that displays the composer's suggestions. */
  AutocompleteSuggestionList?: React.ComponentType<SuggestionListProps>;
  extractDisplayInfo?: (_: {
    user?: Partial<UserResponse>;
  }) => NonNullable<AvatarStackProps['displayInfo']>[number];
  /** A user's avatar. */
  Avatar?: React.ComponentType<ChannelAvatarProps>;
  /** Avatars stacked in a row. */
  AvatarStack?: React.ComponentType<AvatarStackProps>;
  /** An `<img/>` element that renders a fallback when the image fails to load. */
  BaseImage?: React.ComponentType<BaseImageProps>;
  /** Contents of the callout dialog. */
  CalloutDialog?: React.ComponentType<CalloutDialogProps>;
  /** Shown instead of an image that fails to load. */
  ImagePlaceholder?: React.ComponentType<ImagePlaceholderProps>;
  /** Header of the `ChannelList`. */
  ChannelListHeader?: React.ComponentType;
  /** Action buttons within `ChannelListItemUI`. */
  ChannelListItemActionButtons?: React.ComponentType;
  /** Channel preview in the list. */
  ChannelListItemUI?: React.ComponentType<ChannelListItemUIProps>;
  /** A channel list item's previewed message. */
  SummarizedMessagePreview?: React.ComponentType<SummarizedMessagePreviewProps>;
  /** Chip showing the active command, with a button to exit it. */
  CommandChip?: React.ComponentType<CommandChipProps>;
  /**
   * Context menu. The default also handles anchoring and placement against the reference element,
   * submenu navigation, dismissal (Escape, overlay click, controlled close), focus management for
   * anchored menus and transition reset between openings.
   */
  ContextMenu?: React.ComponentType<ContextMenuProps>;
  /** Content of the `ContextMenu`. */
  ContextMenuContent?: React.ComponentType<ContextMenuContentProps>;
  /** Slow mode cooldown timer. */
  CooldownTimer?: React.ComponentType;
  DateSeparator?: React.ComponentType<DateSeparatorProps>;
  /** Contents of the file drag-and-drop overlay. */
  FileDragAndDropContent?: React.ComponentType<FileDragAndDropContentProps>;
  /** Formatted file size, in message attachments and upload previews. */
  FileSizeIndicator?: React.ComponentType<FileSizeIndicatorProps>;
  /** Preview of the message being edited, shown in the composer. */
  EditedMessagePreview?: React.ComponentType<EditedMessagePreviewProps>;
  /** Emoji picker button in the composer. No default; `stream-chat-react/emojis` exports one. */
  EmojiPicker?: React.ComponentType;
  /**
   * Search index for the autocomplete and text replace features of the `MessageComposer`; see
   * emoji-mart's headless `SearchIndex`.
   */
  emojiSearchIndex?: EmojiSearchIndex;
  /** Shown when a message list is empty. */
  EmptyStateIndicator?: React.ComponentType<EmptyStateIndicatorProps>;
  /**
   * Provides gallery state (current index, navigation) through `GalleryContext` and renders
   * `GalleryUI`. Override it to change the data and navigation logic.
   */
  Gallery?: React.ComponentType<GalleryProps>;
  /**
   * The gallery's visual interface (slides, navigation buttons, header). Override it to change the
   * appearance without changing the navigation logic.
   */
  GalleryUI?: React.ComponentType;
  /** Giphy preview in the `VirtualizedMessageList`. */
  GiphyPreviewMessage?: React.ComponentType<GiphyPreviewMessageProps>;
  /** Rendered in the `MessageList` at its `headerPosition`, by default at the top. */
  HeaderComponent?: React.ComponentType;
  /**
   * Overrides for the SDK's icons, keyed by icon name. Merged per slot with the defaults, so
   * overriding one icon leaves the rest intact. Read with `useComponentContextIcons`.
   */
  icons?: IconSlots;
  /**
   * Previews above the composer's textarea. The default renders `defaultMessageComposerPreviewSet`;
   * render `MessageComposerPreviews` with your own `messageComposerPreviewSet` to change it.
   */
  MessageComposerPreviews?: React.ComponentType;
  /** How the message composer renders. */
  MessageComposerUI?: React.ComponentType<MessageComposerProps>;
  /** Link previews in the message composer. */
  LinkPreviewList?: React.ComponentType;
  /** Loading indicator, e.g. while a message list loads older messages. */
  LoadingIndicator?: React.ComponentType<LoadingIndicatorProps>;
  /** Determinate progress from 0 to 100. */
  ProgressIndicator?: React.ComponentType<ProgressIndicatorProps>;
  /** Renders a message in the standard `MessageList`. */
  MessageUI?: React.ComponentType<MessageUIComponentProps>;
  /** Message actions popup, rendered without props. */
  MessageActions?: React.ComponentType;
  /**
   * Contents of the bounced message modal, which usually lets the user retry, edit or delete the
   * message.
   */
  MessageBouncePrompt?: React.ComponentType<MessageBouncePromptProps>;
  /** A message blocked by moderation. */
  MessageBlocked?: React.ComponentType;
  /** A deleted message. No default component. */
  MessageDeleted?: React.ComponentType<MessageDeletedProps>;
  /** Bubble of a deleted message. */
  MessageDeletedBubble?: React.ComponentType;
  MessageListMainPanel?: React.ComponentType<PropsWithChildrenOnly>;
  /** A single notification in `NotificationList`. */
  Notification?: React.ForwardRefExoticComponent<
    NotificationProps & React.RefAttributes<HTMLDivElement>
  >;
  /** Screen-reader announcements of notifications. */
  NotificationAnnouncer?: React.ComponentType<NotificationAnnouncerProps>;
  /** Displays notifications. */
  NotificationList?: React.ComponentType<NotificationListProps>;
  /** Shown when new messages arrive while the list is scrolled up. */
  NewMessageNotification?: React.ComponentType<NewMessageNotificationProps>;
  /** Scroll-to-latest-message button in a `MessageList`. */
  ScrollToLatestMessageButton?: React.ComponentType<ScrollToLatestMessageButtonProps>;
  /** Button that opens a message's thread, showing its reply count and participants. */
  MessageRepliesCountButton?: React.ComponentType<MessageRepliesCountButtonProps>;
  /** Message delivery status. */
  MessageStatus?: React.ComponentType<MessageStatusProps>;
  /** System messages. */
  MessageSystem?: React.ComponentType<EventComponentProps>;
  /** Timestamp on a message. */
  MessageTimestamp?: React.ComponentType<MessageTimestampProps>;
  /** Modal for viewing content. */
  Modal?: React.ComponentType<ModalProps>;
  /** A message's image attachments, which expand into the `Gallery` in a `Modal`. */
  ModalGallery?: React.ComponentType<ModalGalleryProps>;
  /**
   * Indicator for a message with `show_in_channel`: "Also sent in channel" in a thread, "Replied
   * to a thread" in the channel.
   */
  MessageAlsoSentInChannelIndicator?: React.ComponentType;
  PinIndicator?: React.ComponentType<PinIndicatorProps>;
  /** Preview of the poll the message composer holds (`messageComposer.state.pollId`). */
  PollPreview?: React.ComponentType;
  /** Poll actions in a message. */
  PollActions?: React.ComponentType;
  /** Poll rendering in a message. */
  PollContent?: React.ComponentType;
  /** Contents of the poll creation dialog. */
  PollCreationDialog?: React.ComponentType<PollCreationDialogProps>;
  /** Poll header in a message. */
  PollHeader?: React.ComponentType;
  /** Poll option selector. */
  PollOptionSelector?: React.ComponentType<PollOptionSelectorProps>;
  /** Quoted message UI on a sent message. */
  QuotedMessage?: React.ComponentType;
  /** Quoted message preview in the message composer. */
  QuotedMessagePreview?: React.ComponentType<QuotedMessagePreviewProps>;
  /**
   * Reaction options read by `ReactionSelector`, `MessageReactions`, `MessageReactionsDetail` and
   * the reaction handler. Defaults to `defaultReactionOptions`.
   */
  reactionOptions?: ReactionOptions;
  ReactionSelector?: React.ForwardRefExoticComponent<ReactionSelectorProps>;
  ReactionSelectorExtendedList?: React.ComponentType<
    ComponentProps<(typeof ReactionSelector)['ExtendedList']>
  >;
  /** List of reactions on a message. */
  MessageReactions?: React.ComponentType<MessageReactionsProps>;
  /** Dialog with the details of a message's reactions, anchored to `MessageReactions`. */
  MessageReactionsDetail?: React.ComponentType<MessageReactionsDetailProps>;
  RecordingPermissionDeniedNotification?: React.ComponentType<RecordingPermissionDeniedNotificationProps>;
  /** Message reminder information in the message UI. */
  ReminderNotification?: React.ComponentType<ReminderNotificationProps>;
  /** Translation indicator, shown when the message has `i18n`. */
  MessageTranslationIndicator?: React.ComponentType<TranslationIndicatorProps>;
  /** Edited indicator and tooltip for an edited message. */
  MessageEditedIndicator?: React.ComponentType<MessageEditedIndicatorProps>;
  Search?: React.ComponentType;
  /** The UI where the search string is entered. */
  SearchBar?: React.ComponentType;
  /** The results area of the search UI. */
  SearchResults?: React.ComponentType;
  /** Header of the search results pane. */
  SearchResultsHeader?: React.ComponentType;
  /** Search results pane shown before the first search query for a source. */
  SearchResultsPresearch?: React.ComponentType<SearchResultsPresearchProps>;
  /** The items found for a search source. */
  SearchSourceResultList?: React.ComponentType<SearchSourceResultListProps>;
  /** Marks the end of the last page of results for a searched source. */
  SearchSourceResultListFooter?: React.ComponentType;
  /** Result items of a search source pane. */
  SearchSourceResults?: React.ComponentType;
  /** Results UI of a search source with 0 items found. */
  SearchSourceResultsEmpty?: React.ComponentType;
  /** Header content of a search source's results. The default renders nothing. */
  SearchSourceResultsHeader?: React.ComponentType;
  /** Results UI of a search source while its query is running. */
  SearchSourceResultsLoadingIndicator?: React.ComponentType;
  SendButton?: React.ComponentType<SendButtonProps>;
  /** Checkbox that sends a thread reply to the main channel too. */
  SendToChannelCheckbox?: React.ComponentType;
  /** Location sharing dialog. */
  ShareLocationDialog?: React.ComponentType<ShareLocationDialogProps>;
  /** Button that starts audio recording. */
  StartRecordingAudioButton?: React.ComponentType<StartRecordingAudioButtonProps>;
  StopAIGenerationButton?: React.ComponentType<StopAIGenerationButtonProps> | null;
  StreamedMessageText?: React.ComponentType<StreamedMessageTextProps>;
  /** Message text input. */
  TextareaComposer?: React.ComponentType<TextareaComposerProps>;
  /** The thread's parent message, rendered above the replies in a thread's message list. */
  ThreadHead?: React.ComponentType<MessageProps>;
  ThreadListEmptyPlaceholder?: React.ComponentType;
  ThreadListItem?: React.ComponentType<ThreadListItemProps>;
  ThreadListItemUI?: React.ComponentType<ThreadListItemUIProps>;
  ThreadListLoadingIndicator?: React.ComponentType;
  ThreadListUnseenThreadsBanner?: React.ComponentType;
  /** Reply count below the parent message in the default `ThreadHead`. */
  ThreadStart?: React.ComponentType;
  /**
   * Date shown in timestamps. Used by the default `MessageTimestamp` and for the timestamp of
   * edited messages.
   */
  Timestamp?: React.ComponentType<TimestampProps>;
  TypingIndicator?: React.ComponentType<TypingIndicatorProps>;
  /**
   * Indicates the user is viewing unread messages. Disappears once the user scrolls to
   * `UnreadMessagesSeparator`.
   */
  UnreadMessagesNotification?: React.ComponentType<UnreadMessagesNotificationProps>;
  /**
   * Rendered at the end of `ChannelListHeader` while a channel is open, and of `ThreadListHeader`
   * while a thread is open. No default.
   */
  HeaderEndContent?: React.ComponentType;
  /** Separates read messages from unread ones. */
  UnreadMessagesSeparator?: React.ComponentType<UnreadMessagesSeparatorProps>;
  /** Uploaded vs total byte size during an attachment upload, in the composer previews. */
  UploadedSizeIndicator?: React.ComponentType<UploadedSizeIndicatorProps>;
  /** Plays video. Defaults to a `react-player` based player. */
  VideoPlayer?: React.ComponentType<VideoPlayerProps>;
  /** Replaces `MessageUI` inside the `VirtualizedMessageList`. No default. */
  VirtualMessage?: React.ComponentType<MessageUIComponentProps>;
  /** Wraps the `MessageList` children. Defaults to `ul`. */
  MessageListWrapper?: React.ComponentType<PropsWithChildren>;
  /** Wraps each element of the `MessageList`. Defaults to `li`. */
  MessageListItem?: React.ComponentType<PropsWithChildren>;
};

export const ComponentContext = React.createContext<ComponentContextValue>({});

export const ComponentProvider = ({
  children,
  value,
}: PropsWithChildren<{
  value: Partial<ComponentContextValue>;
}>) => <ComponentContext.Provider value={value}>{children}</ComponentContext.Provider>;

export const useComponentContext = () => useContext(ComponentContext);
