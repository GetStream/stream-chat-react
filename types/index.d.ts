// TypeScript Version: 2.8

/** Components */
import * as React from 'react';
import * as Client from 'stream-chat';
import SeamlessImmutable from 'seamless-immutable';
import { MessageResponse } from 'stream-chat';
import ReactMarkdown from 'react-markdown';

export interface ChatContextValue {
  client?: Client.StreamChat;
  channel?: Client.Channel;
  setActiveChannel?(channel: Client.Channel, event: React.SyntheticEvent): void;
  theme?: string;
}

export interface ChannelContextValue extends ChatContextValue {
  Message?: React.ElementType<MessageUIComponentProps>;
  Attachment?: React.ElementType<AttachmentUIComponentProps>;
  messages?: Client.MessageResponse[];
  online?: boolean;
  typing?: SeamlessImmutable.Immutable<{
    [user_id: string]: Client.Event<Client.TypingStartEvent>;
  }>;
  watcher_count?: number;
  watchers?: SeamlessImmutable.Immutable<{ [user_id: string]: Client.User }>;
  members?: SeamlessImmutable.Immutable<{ [user_id: string]: Client.Member }>;
  read?: {
    [user_id: string]: SeamlessImmutable.Immutable<{
      last_read: string;
      user: Client.UserResponse;
    }>;
  };
  error?: boolean | Error;
  // Loading the intial content of the channel
  loading?: boolean;
  // Loading more messages
  loadingMore?: boolean;
  hasMore?: boolean;
  threadLoadingMore?: boolean;
  threadHasMore?: boolean;
  eventHistory?: {
    [lastMessageId: string]: (
      | Client.MemberAddedEvent
      | Client.MemberRemovedEvent
    )[];
  };
  thread?: Client.MessageResponse | boolean;
  threadMessages?: Client.MessageResponse[];

  multipleUploads?: boolean;
  acceptedFiles?: string[];
  maxNumberOfFiles?: number;
  sendMessage?(message: Client.Message): void;
  editMessage?(updatedMessage: Client.Message): void;
  /** Via Context: The function to update a message, handled by the Channel component */
  updateMessage?(
    updatedMessage: Client.MessageResponse,
    extraState: object,
  ): void;
  /** Function executed when user clicks on link to open thread */
  retrySendMessage?(message: Client.Message): void;
  removeMessage?(updatedMessage: Client.MessageResponse): void;
  /** Function to be called when a @mention is clicked. Function has access to the DOM event and the target user object */
  onMentionsClick?(e: React.MouseEvent, user: Client.UserResponse): void;
  /** Function to be called when hovering over a @mention. Function has access to the DOM event and the target user object */
  onMentionsHover?(e: React.MouseEvent, user: Client.UserResponse): void;
  openThread?(
    message: Client.MessageResponse,
    event: React.SyntheticEvent,
  ): void;

  loadMore?(): void;
  // thread related
  closeThread?(event: React.SyntheticEvent): void;
  loadMoreThread?(): void;

  /** Via Context: The function is called when the list scrolls */
  listenToScroll?(offset: number): void;
}

export interface ChatProps {
  client: Client.StreamChat;
  // Available built in themes:
  // 'messaging light'
  // | 'messaging dark'
  // | 'team light'
  // | 'team dark'
  // | 'commerce light'
  // | 'commerce dark'
  // | 'gaming light'
  // | 'gaming dark'
  // | 'livestream light'
  // | 'livestream dark'
  theme?: string;
}

export interface ChannelProps extends ChatContextValue {
  /** The loading indicator to use */
  LoadingIndicator?: React.ElementType<LoadingIndicatorProps>;
  LoadingErrorIndicator?: React.ElementType<LoadingErrorIndicatorProps>;
  Message?: React.ElementType<MessageUIComponentProps>;
  Attachment?: React.ElementType<AttachmentUIComponentProps>;

  multipleUploads?: boolean;
  acceptedFiles?: string[];
  maxNumberOfFiles?: number;

  /** Function to be called when a @mention is clicked. Function has access to the DOM event and the target user object */
  onMentionsClick?(e: React.MouseEvent, user: Client.UserResponse): void;
  /** Function to be called when hovering over a @mention. Function has access to the DOM event and the target user object */
  onMentionsHover?(e: React.MouseEvent, user: Client.UserResponse): void;

  /** Override send message request (Advanced usage only) */
  doSendMessageRequest?(
    channelId: string,
    message: Client.Message,
  ): Promise<Client.MessageResponse> | void;
  /** Override update(edit) message request (Advanced usage only) */
  doUpdateMessageRequest?(
    channelId: string,
    updatedMessage: Client.Message,
  ): Promise<Client.MessageResponse> | void;
}

export interface ChannelListProps extends ChatContextValue {
  /** The Preview to use, defaults to ChannelPreviewLastMessage */
  Preview?: React.ElementType<ChannelPreviewUIComponentProps>;

  /** The loading indicator to use */
  LoadingIndicator?: React.ElementType<LoadingIndicatorProps>;
  List?: React.ElementType<ChannelListUIComponentProps>;
  Paginator?: React.ElementType<PaginatorProps>;

  onMessageNew?(
    thisArg: React.Component<ChannelListProps>,
    e: Client.Event<Client.MessageNewEvent>,
  ): any;
  /** Function that overrides default behaviour when users gets added to a channel */
  onAddedToChannel?(
    thisArg: React.Component<ChannelListProps>,
    e: Client.Event<Client.NotificationAddedToChannelEvent>,
  ): any;
  /** Function that overrides default behaviour when users gets removed from a channel */
  onRemovedFromChannel?(
    thisArg: React.Component<ChannelListProps>,
    e: Client.Event<Client.NotificationRemovedFromChannelEvent>,
  ): any;
  onChannelUpdated?(
    thisArg: React.Component<ChannelListProps>,
    e: Client.Event<Client.ChannelUpdatedEvent>,
  ): any;
  onChannelDeleted?(
    thisArg: React.Component<ChannelListProps>,
    e: Client.Event<Client.ChannelDeletedEvent>,
  ): void;
  onChannelTruncated?(
    thisArg: React.Component<ChannelListProps>,
    e: Client.Event<Client.ChannelTruncatedEvent>,
  ): void;
  /** Object containing query filters */
  filters: object;
  /** Object containing query options */
  options?: object;
  /** Object containing sort parameters */
  sort?: object;
  showSidebar?: boolean;
}

export interface ChannelListUIComponentProps extends ChatContextValue {
  /** If channel list ran into error */
  error?: boolean;
  /** If channel list is in loading state */
  loading?: boolean;
  showSidebar?: boolean;
  /**
   * Loading indicator UI Component. It will be displayed if `loading` prop is true.
   *
   * Defaults to and accepts same props as:
   * [LoadingChannels](https://github.com/GetStream/stream-chat-react/blob/master/src/components/LoadingChannels.js)
   *
   */
  LoadingIndicator?: React.ElementType<LoadingChannelsProps>;
  /**
   * Error indicator UI Component. It will be displayed if `error` prop is true
   *
   * Defaults to and accepts same props as:
   * [ChatDown](https://github.com/GetStream/stream-chat-react/blob/master/src/components/ChatDown.js)
   *
   */
  LoadingErrorIndicator?: React.ElementType<ChatDownProps>;
}

export interface ChannelPreviewProps {
  /** **Available from [chat context](https://getstream.github.io/stream-chat-react/#chat)** */
  channel: Client.Channel;
  /** Current selected channel object */
  activeChannel: Client.Channel;
  /**
   * Available built-in options (also accepts the same props as):
   *
   * 1. [ChannelPreviewCompact](https://getstream.github.io/stream-chat-react/#ChannelPreviewCompact) (default)
   * 2. [ChannelPreviewLastMessage](https://getstream.github.io/stream-chat-react/#ChannelPreviewLastMessage)
   * 3. [ChannelPreviewMessanger](https://getstream.github.io/stream-chat-react/#ChannelPreviewMessanger)
   *
   * The Preview to use, defaults to ChannelPreviewLastMessage
   * */
  Preview?: React.ElementType<ChannelPreviewUIComponentProps>;
  key: string;
  closeMenu?(): void;
  /** Setter for selected channel */
  setActiveChannel(
    channel: Client.Channel,
    watchers?: SeamlessImmutable.Immutable<{ [user_id: string]: Client.User }>,
    e?: React.BaseSyntheticEvent,
  ): void;
  // Following props is just to make sure preview component gets updated after connection is recovered.
  // It is not actually used anywhere internally
  connectionRecoveredCount?: number;
  channelUpdateCount?: number;
}

export interface ChannelPreviewUIComponentProps extends ChannelPreviewProps {
  /** Latest message's text. */
  latestMessage?: string;
  /** Length of latest message to truncate at */
  latestMessageLength?: number;
  active?: boolean;

  /** Following props are coming from state of ChannelPreview */
  unread?: number;
  lastMessage?: Client.MessageResponse;

  lastRead?: Date;
}

export interface PaginatorProps {
  /** callback to load the next page */
  loadNextPage(): void;
  hasNextPage?: boolean;
  /** indicates if there there's currently any refreshing taking place */
  refreshing?: boolean;
}

export interface LoadMorePaginatorProps extends PaginatorProps {
  /** display the items in opposite order */
  reverse: boolean;
  LoadMoreButton: React.ElementType;
}

export interface InfiniteScrollPaginatorProps extends PaginatorProps {
  /** display the items in opposite order */
  reverse?: boolean;
  /** Offset from when to start the loadNextPage call */
  threshold?: number;
  /** The loading indicator to use */
  LoadingIndicator?: React.ElementType<LoadingIndicatorProps>;
}

export interface LoadingIndicatorProps {
  /** The size of the loading icon */
  size?: number;
  /** Set the color of the LoadingIndicator */
  color?: string;
}

export interface LoadingErrorIndicatorProps {
  error: boolean | object;
}

export interface AvatarProps {
  /** image url */
  image?: string;
  /** name of the picture, used for title tag fallback */
  name?: string;
  /** shape of the avatar, circle, rounded or square */
  shape?: 'circle' | 'rounded' | 'square';
  /** size in pixels */
  size?: number;
}

export interface DateSeparatorProps {
  /** The date to format */
  date: Date;
  /** Set the position of the date in the separator */
  position?: 'left' | 'center' | 'right';
  /** Override the default formatting of the date. This is a function that has access to the original date object. Returns a string or Node  */
  formatDate?(date: Date): string;
}

export interface EmptyStateIndicatorProps {
  /** List Type */
  listType: string;
}

export interface SendButtonProps {
  /** Function that gets triggered on click */
  sendMessage?(message: Client.Message): void;
}

export interface MessageListProps extends ChannelContextValue {
  /** Typing indicator component to render  */
  TypingIndicator?: React.ElementType<TypingIndicatorProps>;
  /** Component to render at the top of the MessageList */
  HeaderComponent?: React.ElementType;
  /** Component to render at the top of the MessageList */
  EmptyStateIndicator?: React.ElementType<EmptyStateIndicatorProps>;
  /** Date separator component to render  */
  dateSeparator?: React.ElementType<DateSeparatorProps>;
  /** Turn off grouping of messages by user */
  noGroupByUser?: boolean;
  /** Weather its a thread of no. Default - false  */
  threadList?: boolean;
  /** render HTML instead of markdown. Posting HTML is only allowed server-side */
  unsafeHTML?: boolean;
  messageLimit?: number;
  messageActions?: Array<string>;
  getFlagMessageSuccessNotification?(message: MessageResponse): string;
  getFlagMessageErrorNotification?(message: MessageResponse): string;
  getMuteUserSuccessNotification?(message: MessageResponse): string;
  getMuteUserErrorNotification?(message: MessageResponse): string;
  additionalMessageInputProps?: object;
}

export interface ChannelHeaderProps extends ChannelContextValue {
  /** Set title manually */
  title?: string;
  /** Show a little indicator that the channel is live right now */
  live?: boolean;
}

export interface MessageInputProps {
  /** Set focus to the text input if this is enabled */
  focus?: boolean;
  /** Disable input */
  disabled?: boolean;
  /** Grow the textarea while you're typing */
  grow?: boolean;
  /** Max number of rows the textarea is allowed to grow */
  maxRows?: number;

  /** The parent message object when replying on a thread */
  parent?: Client.MessageResponse | null;

  /** The component handling how the input is rendered */
  Input?: React.ElementType<MessageInputUIComponentProps>;

  /** Change the SendButton component */
  SendButton?: React.ElementType<SendButtonProps>;

  /** Override image upload request */
  doImageUploadRequest?(file: object, channel: Client.Channel): void;

  /** Override file upload request */
  doFileUploadRequest?(file: object, channel: Client.Channel): void;

  /** Completely override the submit handler (advanced usage only) */
  overrideSubmitHandler?(message: object, channelCid: string): void;
}

export type ImageUpload = {
  id: string;
  url: string;
  state: 'finished' | 'failed' | 'uploading';
  file: { name: string };
};

export type FileUpload = {
  id: string;
  url: string;
  state: 'finished' | 'failed' | 'uploading';
  file: {
    name: string;
    type: string;
    size: string;
  };
};

export interface MessageInputState {
  text?: string;
  attachments?: Client.Attachment[];
  imageOrder?: string[];
  imageUploads?: SeamlessImmutable.Immutable<ImageUpload[]>;
  fileOrder?: string[];
  fileUploads?: SeamlessImmutable.Immutable<FileUpload[]>;
  emojiPickerIsOpen?: boolean;
  filePanelIsOpen?: boolean;
  // ids of users mentioned in message
  mentioned_users?: string[];
  numberOfUploads?: number;
}
export interface MessageInputUIComponentProps
  extends MessageInputProps,
    MessageInputState {
  uploadNewFiles?(files: File[]): void;
  removeImage?(id: string): void;
  uploadImage?(id: string): void;
  removeFile?(id: string): void;
  uploadFile?(id: string): void;
  emojiPickerRef?: React.RefObject<any>;
  panelRef?: React.RefObject<any>;
  textareaRef?: React.RefObject<any>;
  onSelectEmoji?(emoji: object): void;
  getUsers?(): Client.User[];
  getCommands?(): [];
  handleSubmit?(event: React.FormEvent): void;
  handleChange?(event: React.ChangeEventHandler): void;
  onPaste?: React.ClipboardEventHandler;
  onSelectItem?(item: Client.UserResponse): void;
  openEmojiPicker?(): void;
}

export interface AttachmentUIComponentProps {
  /** The attachment to render */
  attachment: Client.Attachment;
  /**
		The handler function to call when an action is selected on an attachment.
		Examples include canceling a \/giphy command or shuffling the results.
		*/
  actionHandler?(
    name: string,
    value: string,
    event: React.BaseSyntheticEvent,
  ): void;
}

export interface MessageProps {
  /** The message object */
  message?: Client.MessageResponse;
  /** The client connection object for connecting to Stream */
  client?: Client.StreamChat;
  /** The current channel this message is displayed in */
  channel?: Client.Channel;
  /** A list of users that have read this message **/
  readBy?: Array<Client.UserResponse>;
  /** groupStyles, a list of styles to apply to this message. ie. top, bottom, single etc */
  groupStyles?: Array<string>;
  /** Editing, if the message is currently being edited */
  editing?: boolean;
  /** The message rendering component, the Message component delegates its rendering logic to this component */
  Message?: React.ElementType<MessageUIComponentProps>;
  /** Allows you to overwrite the attachment component */
  Attachment?: React.ElementType<AttachmentUIComponentProps>;
  /** render HTML instead of markdown. Posting HTML is only allowed server-side */
  unsafeHTML?: boolean;
  messageActions?: Array<string>;
  getFlagMessageSuccessNotification?(message: MessageResponse): string;
  getFlagMessageErrorNotification?(message: MessageResponse): string;
  getMuteUserSuccessNotification?(message: MessageResponse): string;
  getMuteUserErrorNotification?(message: MessageResponse): string;
  lastReceivedId?: string | null;
  messageListRect?: DOMRect;
  members?: SeamlessImmutable.Immutable<{ [user_id: string]: Client.Member }>;
  watchers?: SeamlessImmutable.Immutable<{ [user_id: string]: Client.User }>;
  addNotification?(notificationText: string, type: string): any;
  setEditingState?(message: Client.MessageResponse): any;
  updateMessage?(
    updatedMessage: Client.MessageResponse,
    extraState: object,
  ): void;
  /** Function executed when user clicks on link to open thread */
  retrySendMessage?(message: Client.Message): void;
  removeMessage?(updatedMessage: Client.MessageResponse): void;
  /** Function to be called when a @mention is clicked. Function has access to the DOM event and the target user object */
  onMentionsClick?(e: React.MouseEvent, user: Client.UserResponse): void;
  /** Function to be called when hovering over a @mention. Function has access to the DOM event and the target user object */
  onMentionsHover?(e: React.MouseEvent, user: Client.UserResponse): void;
  openThread?(
    message: Client.MessageResponse,
    event: React.SyntheticEvent,
  ): void;
  additionalMessageInputProps?: object;
  clearEditingState?(e?: React.MouseEvent): void;
}

export interface MessageUIComponentProps extends MessageProps {
  actionsEnabled?: boolean;
  handleReaction?(reactionType: string, event?: React.BaseSyntheticEvent): void;
  handleEdit?(event?: React.BaseSyntheticEvent): void;
  handleDelete?(event?: React.BaseSyntheticEvent): void;
  handleFlag?(event?: React.BaseSyntheticEvent): void;
  handleMute?(event?: React.BaseSyntheticEvent): void;
  handleAction?(
    name: string,
    value: string,
    event: React.BaseSyntheticEvent,
  ): void;
  handleRetry?(message: Client.Message): void;
  isMyMessage?(message: Client.MessageResponse): boolean;
  handleOpenThread?(event: React.BaseSyntheticEvent): void;
  onMentionsClickMessage?(
    event: React.MouseEvent,
    user: Client.UserResponse,
  ): void;
  onMentionsHoverMessage?(
    event: React.MouseEvent,
    user: Client.UserResponse,
  ): void;
  getMessageActions(): Array<string>;
  channelConfig?: object;
  threadList?: boolean;
  additionalMessageInputProps?: object;
}

export interface ThreadProps extends ChannelContextValue {
  /** Display the thread on 100% width of it's container. Useful for mobile style view */
  fullWidth?: boolean;
  /** Make input focus on mounting thread */
  autoFocus?: boolean;
  additionalParentMessageProps?: object;
  additionalMessageListProps?: object;
  additionalMessageInputProps?: object;
  MessageInput?: React.ElementType<MessageInputProps>;
}

export interface TypingIndicatorProps {
  typing: object;
  client: Client.StreamChat;
}

export interface ReactionSelectorProps {
  /**
   * Array of latest reactions.
   * Reaction object has following structure:
   *
   * ```json
   * {
   *  "type": "love",
   *  "user_id": "demo_user_id",
   *  "user": {
   *    ...userObject
   *  },
   *  "created_at": "datetime";
   * }
   * ```
   * */
  latest_reactions: Client.ReactionResponse[];
  /**
   * {
   *  'like': 9,
   *  'love': 6,
   *  'haha': 2
   * }
   */
  reaction_counts: {
    [reaction_type: string]: number;
  };
  /** Enable the avatar display */
  detailedView?: boolean;
  /** Provide a list of reaction options [{name: 'angry', emoji: 'angry'}] */
  reactionOptions?: MinimalEmojiInterface;
  reverse?: boolean;
  handleReaction?(reactionType: string, event?: React.BaseSyntheticEvent): void;
  emojiSetDef?: EnojiSetDef;
}

export interface EnojiSetDef {
  spriteUrl: string;
  size: number;
  sheetColumns: number;
  sheetRows: number;
  sheetSize: number;
}

export interface ReactionsListProps {
  /**
   * Array of latest reactions.
   * Reaction object has following structure:
   *
   * ```json
   * {
   *  "type": "love",
   *  "user_id": "demo_user_id",
   *  "user": {
   *    ...userObject
   *  },
   *  "created_at": "datetime";
   * }
   * ```
   * */
  reactions: Client.ReactionResponse[];
  /**
   * {
   *  'like': 9,
   *  'love': 6,
   *  'haha': 2
   * }
   */
  reaction_counts: {
    [reaction_type: string]: number;
  };
  /** Provide a list of reaction options [{name: 'angry', emoji: 'angry'}] */
  reactionOptions?: MinimalEmojiInterface;
  onClick?(): void;
  reverse?: boolean;
  emojiSetDef?: EnojiSetDef;
}

export interface WindowProps {
  /** show or hide the window when a thread is active */
  hideOnThread?: boolean;
  thread?: Client.MessageResponse | boolean;
}

export interface AttachmentActionsProps {
  id: string;
  text: string;
  actions: Client.Action[];
  actionHandler?(
    name: string,
    value: string,
    event: React.BaseSyntheticEvent,
  ): void;
}

export interface AudioProps {
  og: Client.Attachment;
}

export interface CardProps {
  title?: string;
  title_link?: string;
  og_scrape_url?: string;
  image_url?: string;
  thumb_url?: string;
  text?: string;
}

export interface ChatAutoCompleteProps {
  rows: number;
  grow: boolean;
  maxRows: number;
  disabled: boolean;
  value: string;
  handleSubmit?(event: React.FormEvent): void;
  onChange?(event: React.ChangeEventHandler): void;
  placeholder: string;
  LoadingIndicator?: React.ElementType<LoadingIndicatorProps>;
  minChar: number;
  users: Client.UserResponse[];
  onSelectItem?(item: any): any;
  commands: Client.CommandResponse[];
  onFocus?: React.FocusEventHandler;
  onPaste?: React.ClipboardEventHandler;
}

export interface ChatDownProps {
  image: string;
  type: string;
  text: string;
}

export interface CommandItemProps {
  entity: {
    name: string;
    args: string;
    description: string;
  };
}

export interface EditMessageFormProps extends MessageInputUIComponentProps {}
export interface EmoticonItemProps {
  entity: {
    name: string;
    native: string;
    char: string;
  };
}

export interface UserItemProps {
  entity: {
    name: string;
    id: string;
    image: string;
  };
}

export interface EventComponentProps {
  message: Client.MessageResponse;
}

export interface GalleryProps {
  images: Client.Attachment[];
}

export interface ImageProps {
  image_url: string;
  thumb_url: string;
  fallback: string;
}

export interface InfiniteScrollProps {
  loadMore(): any;
  hasMore?: boolean;
  initialLoad?: boolean;
  isReverse?: boolean;
  pageStart?: number;
  isLoading?: boolean;
  useCapture?: boolean;
  useWindow?: boolean;
  element?: React.ElementType;
  loader?: React.ReactNode;
  threshold?: number;
}

export interface ReverseInfiniteScrollProps {
  loadMore(): any;
  hasMore?: boolean;
  initialLoad?: boolean;
  isReverse?: boolean;
  pageStart?: number;
  isLoading?: boolean;
  useCapture?: boolean;
  useWindow?: boolean;
  element?: React.ElementType;
  loader?: React.ReactNode;
  threshold?: number;
  className?: string;
  /** The function is called when the list scrolls */
  listenToScroll?(
    standardOffset: string | number,
    reverseOffset: string | number,
  ): any;
}

export interface LoadMoreButtonProps {
  onClick: React.MouseEventHandler;
  refreshing: boolean;
}
export interface LoadingChannelsProps {}
export interface MessageActionsProps {
  onClickReact: React.MouseEventHandler;
  /** If the message actions box should be open or not */
  open: boolean;
  /**
   * @deprecated
   *
   *  The message component, most logic is delegated to this component and MessageActionsBox uses the following functions explicitly:
   *  `handleFlag`, `handleMute`, `handleEdit`, `handleDelete`, `canDeleteMessage`, `canEditMessage`, `isMyMessage`, `isAdmin`
   */
  Message?: React.ElementType<MessageProps>;
  /** If message belongs to current user. */
  mine?: boolean;
  /** DOMRect object for parent MessageList component */
  messageListRect?: DOMRect;
  handleEdit?(event?: React.BaseSyntheticEvent): void;
  handleDelete?(event?: React.BaseSyntheticEvent): void;
  handleFlag?(event?: React.BaseSyntheticEvent): void;
  handleMute?(event?: React.BaseSyntheticEvent): void;
  getMessageActions(): Array<string>;
}
export interface MessageActionsBoxProps extends MessageActionsProps {}
export interface MessageNotificationProps {
  showNotification: boolean;
  onClick: React.MouseEventHandler;
}
export interface MessageRepliesCountButtonProps {
  labelSingle: string;
  labelPlural: string;
  reply_count: number;
  onClick: React.MouseEventHandler;
}
export interface ModalProps {
  onClose(): void;
  open: boolean;
}
export interface SafeAnchorProps {}
export interface SimpleReactionsListProps {
  reactions: Client.ReactionResponse[];
  /**
   * {
   *  'like': 9,
   *  'love': 6,
   *  'haha': 2
   * }
   */
  reaction_counts: {
    [reaction_type: string]: number;
  };
  showTooltip?: boolean;
  /** Provide a list of reaction options [{name: 'angry', emoji: 'angry'}] */
  reactionOptions?: MinimalEmojiInterface;
  handleReaction?(reactionType: string): void;
}
export interface TooltipProps {}

export class AttachmentActions extends React.PureComponent<
  AttachmentActionsProps,
  any
> {}
export class Audio extends React.PureComponent<AudioProps, any> {}
export class Card extends React.PureComponent<CardProps, any> {}
export class ChatAutoComplete extends React.PureComponent<
  ChatAutoCompleteProps,
  any
> {}
export class ChatDown extends React.PureComponent<ChatDownProps, any> {}

export class CommandItem extends React.PureComponent<CommandItemProps, any> {}
export class UserItem extends React.PureComponent<UserItemProps, any> {}

export class DateSeparator extends React.PureComponent<
  DateSeparatorProps,
  any
> {}
export class EditMessageForm extends React.PureComponent<
  EditMessageFormProps,
  any
> {}
export class EmoticonItem extends React.PureComponent<EmoticonItemProps, any> {}
export class EmptyStateIndicator extends React.PureComponent<
  EmptyStateIndicatorProps,
  any
> {}
export class EventComponent extends React.PureComponent<
  EventComponentProps,
  any
> {}
export class Gallery extends React.PureComponent<GalleryProps, any> {}
export class Image extends React.PureComponent<ImageProps, any> {}
export class InfiniteScroll extends React.PureComponent<
  InfiniteScrollProps,
  any
> {}
export class LoadMoreButton extends React.PureComponent<
  LoadMoreButtonProps,
  any
> {}
export class LoadingChannels extends React.PureComponent<
  LoadingChannelsProps,
  any
> {}
export class LoadingErrorIndicator extends React.PureComponent<
  LoadingErrorIndicatorProps,
  any
> {}
export class MessageActions extends React.PureComponent<
  MessageActionsProps,
  any
> {}
export class MessageActionsBox extends React.PureComponent<
  MessageActionsBoxProps,
  any
> {}
export class MessageNotification extends React.PureComponent<
  MessageNotificationProps,
  any
> {}
export class MessageRepliesCountButton extends React.PureComponent<
  MessageRepliesCountButtonProps,
  any
> {}
export class Modal extends React.PureComponent<ModalProps, any> {}
export class ReverseInfiniteScroll extends React.PureComponent<
  ReverseInfiniteScrollProps,
  any
> {}
export class SafeAnchor extends React.PureComponent<SafeAnchorProps, any> {}
export class SendButton extends React.PureComponent<SendButtonProps, any> {}
export class SimpleReactionsList extends React.PureComponent<
  SimpleReactionsListProps,
  any
> {}
export class Tooltip extends React.PureComponent<TooltipProps, any> {}

export class Chat extends React.PureComponent<ChatProps, any> {}
export class Channel extends React.PureComponent<ChannelProps, any> {}
export class Avatar extends React.PureComponent<AvatarProps, any> {}
export class Message extends React.PureComponent<MessageProps, any> {}
export class MessageList extends React.PureComponent<MessageListProps, any> {}
export class ChannelHeader extends React.PureComponent<
  ChannelHeaderProps,
  any
> {}
export class MessageInput extends React.PureComponent<MessageInputProps, any> {}
export class MessageInputLarge extends React.PureComponent<
  MessageInputUIComponentProps,
  any
> {}
export class MessageInputFlat extends React.PureComponent<
  MessageInputUIComponentProps,
  any
> {}
export class MessageInputSmall extends React.PureComponent<
  MessageInputUIComponentProps,
  any
> {}

export class Attachment extends React.PureComponent<
  AttachmentUIComponentProps
> {}

export class ChannelList extends React.PureComponent<ChannelListProps> {}
export class ChannelListMessenger extends React.PureComponent<
  ChannelListUIComponentProps,
  any
> {}
export class ChannelListTeam extends React.PureComponent<
  ChannelListUIComponentProps,
  any
> {}

export class ChannelPreview extends React.PureComponent<
  ChannelPreviewProps,
  any
> {}

export class ChannelPreviewCompact extends React.PureComponent<
  ChannelPreviewUIComponentProps,
  any
> {}
export class ChannelPreviewMessenger extends React.PureComponent<
  ChannelPreviewUIComponentProps,
  any
> {}

export class ChannelPreviewCountOnly extends React.PureComponent<
  ChannelPreviewUIComponentProps,
  any
> {}
export class ChannelPreviewLastMessage extends React.PureComponent<
  ChannelPreviewUIComponentProps,
  any
> {}

export class LoadMorePaginator extends React.PureComponent<
  LoadMorePaginatorProps,
  any
> {}
export class InfiniteScrollPaginator extends React.PureComponent<
  InfiniteScrollPaginatorProps,
  any
> {}

export class LoadingIndicator extends React.PureComponent<
  LoadingIndicatorProps,
  any
> {}

export class MessageCommerce extends React.PureComponent<
  MessageUIComponentProps,
  any
> {}
export class MessageLivestream extends React.PureComponent<
  MessageUIComponentProps,
  any
> {}
export class MessageTeam extends React.PureComponent<
  MessageUIComponentProps,
  any
> {}
export class MessageSimple extends React.PureComponent<
  MessageUIComponentProps,
  any
> {}

export class Thread extends React.PureComponent<ThreadProps, any> {}
export class TypingIndicator extends React.PureComponent<
  TypingIndicatorProps,
  any
> {}

export class ReactionSelector extends React.PureComponent<
  ReactionSelectorProps,
  any
> {}
export class ReactionsList extends React.PureComponent<
  ReactionsListProps,
  any
> {}

export class Window extends React.PureComponent<WindowProps, any> {}

/** Utils */
export const emojiSetDef: emojiSetDefInterface;
export interface emojiSetDefInterface {
  emoticons: [];
  short_names: [];
  custom: boolean;
}

export const commonEmoji: commonEmojiInterface;
export interface commonEmojiInterface {
  emoticons: [];
  short_names: [];
  custom: boolean;
}

export const defaultMinimalEmojis: MinimalEmojiInterface[];
export interface MinimalEmojiInterface
  extends commonEmojiInterface,
    emojiSetDefInterface {
  id: string;
  name: string;
  colons: string;
  sheet_x: number;
  sheet_y: number;
}

export function renderText(
  message:
    | SeamlessImmutable.Immutable<Client.MessageResponse>
    | Client.MessageResponse,
): ReactMarkdown;
export function smartRender(
  ElementOrComponentOrLiteral: ElementOrComponentOrLiteral,
  props?: {},
  fallback?: ElementOrComponentOrLiteral,
): React.Component<{}, {}>;
export type ElementOrComponentOrLiteral =
  | string
  | boolean
  | number
  | React.ElementType
  | null
  | undefined;

/**
 * {
 *  edit: 'edit',
 *  delete: 'delete',
 *  flag: 'flag',
 *  mute: 'mute',
 * }
 */
export const MESSAGE_ACTIONS: {
  [key: string]: string;
};

/** Context */
export const ChatContext: React.Context<ChatContextValue>;

/**
 * const CustomMessage = withChatContext<MessageUIComponentProps & ChatContextValue>(
 *  class CustomMessageComponent extends React.Component<MessageUIComponentProps & ChatContextValue> {
 *    render() {
 *      return (
 *        <div>Custom Message : {this.props.message.text}</div>
 *      )
 *    }
 *  }
 * )
 */
export function withChatContext<T>(
  OriginalComponent: React.ElementType<T>,
): React.ElementType<T>;

export const ChannelContext: React.Context<ChannelContextValue>;

/**
 * const CustomMessage = withChannelContext<MessageUIComponentProps & ChannelContextValue>(
 *  class CustomMessageComponent extends React.Component<MessageUIComponentProps & ChannelContextValue> {
 *    render() {
 *      return (
 *        <div>Custom Message : {this.props.message.text}</div>
 *      )
 *    }
 *  }
 * )
 */
export function withChannelContext<T>(
  OriginalComponent: React.ElementType<T>,
): React.ElementType<T>;
