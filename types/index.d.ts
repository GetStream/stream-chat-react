// TypeScript Version: 2.8

/** Components */
import * as React from 'react';
import * as Client from 'stream-chat';
import SeamlessImmutable, {
  ImmutableArray,
  ImmutableObject,
} from 'seamless-immutable';
import { MessageResponse } from 'stream-chat';
import ReactMarkdown from 'react-markdown';
import * as i18next from 'i18next';
import * as Dayjs from 'dayjs';

export interface ChatContextValue {
  client?: Client.StreamChat | null;
  channel?: Client.Channel;
  setActiveChannel?(
    channel: Client.Channel,
    watchers?: SeamlessImmutable.Immutable<{ [user_id: string]: Client.User }>,
    event?: React.SyntheticEvent,
  ): void;
  openNav?: boolean;
  openMobileNav?(): void;
  closeMobileNav?(): void;
  theme?: string;
  mutes?: Client.Mute[];
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
  sendMessage?(message: Client.Message): Promise<any>;
  editMessage?(updatedMessage: Client.Message): Promise<any>;
  /** Via Context: The function to update a message, handled by the Channel component */
  updateMessage?(
    updatedMessage: Client.MessageResponse,
    extraState?: object,
  ): void;
  /** Function executed when user clicks on link to open thread */
  retrySendMessage?(message: Client.Message): Promise<void>;
  removeMessage?(updatedMessage: Client.MessageResponse): void;
  /** Function to be called when a @mention is clicked. Function has access to the DOM event and the target user object */
  onMentionsClick?(e: React.MouseEvent, user: Client.UserResponse[]): void;
  /** Function to be called when hovering over a @mention. Function has access to the DOM event and the target user object */
  onMentionsHover?(e: React.MouseEvent, user: Client.UserResponse[]): void;
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
  i18nInstance?: Streami18n;
  initialNavOpen?: boolean;
}

export interface ChannelProps
  extends ChatContextValue,
    TranslationContextValue {
  /** The loading indicator to use */
  LoadingIndicator?: React.ElementType<LoadingIndicatorProps>;
  LoadingErrorIndicator?: React.ElementType<LoadingErrorIndicatorProps>;
  Message?: React.ElementType<MessageUIComponentProps>;
  Attachment?: React.ElementType<AttachmentUIComponentProps>;
  mutes?: Client.Mute[];
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
  EmptyStateIndicator?: React.ElementType<EmptyStateIndicatorProps>;
  /** The Preview to use, defaults to ChannelPreviewLastMessage */
  Preview?: React.ElementType<ChannelPreviewUIComponentProps>;

  /** The loading indicator to use */
  LoadingIndicator?: React.ElementType<LoadingIndicatorProps>;
  LoadingErrorIndicator?: React.ElementType<LoadingErrorIndicatorProps>;
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
  setActiveChannelOnMount?: boolean;
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

export interface ChannelPreviewProps
  extends TranslationContextValue,
    ChatContextValue {
  /** **Available from [chat context](https://getstream.github.io/stream-chat-react/#chat)** */
  channel: Client.Channel;
  /** Current selected channel object */
  activeChannel?: Client.Channel;
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
  /** Title of channel to display */
  displayTitle?: string;
  /** Image of channel to display */
  displayImage?: string;
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

export interface LoadingErrorIndicatorProps extends TranslationContextValue {
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
  /** onClick handler  */
  onClick?(e: React.MouseEvent): void;
  /** onMouseOver handler */
  onMouseOver?(e: React.MouseEvent): void;
}

export interface DateSeparatorProps extends TranslationContextValue {
  /** The date to format */
  date: Date;
  /** Set the position of the date in the separator */
  position?: 'left' | 'center' | 'right';
  /** Override the default formatting of the date. This is a function that has access to the original date object. Returns a string or Node  */
  formatDate?(date: Date): string;
}

export interface EmptyStateIndicatorProps extends TranslationContextValue {
  /** List Type */
  listType: string;
}

export interface SendButtonProps {
  /** Function that gets triggered on click */
  sendMessage(e: React.MouseEvent<HTMLButtonElement, MouseEvent>): void;
}

export interface MessageListProps
  extends ChannelContextValue,
    TranslationContextValue {
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
  mutes?: Client.Mute[];
  getFlagMessageSuccessNotification?(message: MessageResponse): string;
  getFlagMessageErrorNotification?(message: MessageResponse): string;
  getMuteUserSuccessNotification?(message: MessageResponse): string;
  getMuteUserErrorNotification?(message: MessageResponse): string;
  additionalMessageInputProps?: object;
}

export interface ChannelHeaderProps
  extends ChannelContextValue,
    TranslationContextValue,
    ChatContextValue {
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
  Input?: React.ElementType<MessageInputProps>;

  /** Change the SendButton component */
  SendButton?: React.ElementType<SendButtonProps>;

  /** Override image upload request */
  doImageUploadRequest?(
    file: object,
    channel: Client.Channel,
  ): Promise<Client.FileUploadAPIResponse>;

  /** Override file upload request */
  doFileUploadRequest?(
    file: File,
    channel: Client.Channel,
  ): Promise<Client.FileUploadAPIResponse>;

  /** Completely override the submit handler (advanced usage only) */
  overrideSubmitHandler?(
    message: object,
    channelCid: string,
  ): Promise<any> | void;
  /**
   * Any additional attrubutes that you may want to add for underlying HTML textarea element.
   * e.g.
   * <MessageInput
   *  additionalTextareaProps={{
   *    maxLength: 10,
   *  }}
   * />
   */
  additionalTextareaProps?: object;
  /** Message object. If defined, the message passed will be edited, instead of a new message being created */
  message?: Client.MessageResponse;
  /** Callback to clear editing state in parent component */
  clearEditingState?: () => void;
  /** If true, file uploads are disabled. Default: false */
  noFiles?: boolean;
  /** Custom error handler, called when file/image uploads fail. */
  errorHandler?: (e: Error, type: string, file: object) => Promise<any> | void;
}

export type ImageUpload = {
  id: string;
  file: File;
  state: 'finished' | 'failed' | 'uploading';
  previewUri?: string;
  url?: string;
};

export type FileUpload = {
  id: string;
  url: string;
  state: 'finished' | 'failed' | 'uploading';
  file: File;
};

export interface MessageInputState {
  text: string;
  attachments: Client.Attachment[];
  imageOrder: string[];
  imageUploads: SeamlessImmutable.ImmutableObject<{
    [id: string]: ImageUpload;
  }>;
  fileOrder: string[];
  fileUploads: SeamlessImmutable.ImmutableObject<{ [id: string]: FileUpload }>;
  emojiPickerIsOpen: boolean;
  // ids of users mentioned in message
  mentioned_users: Client.UserResponse[];
  numberOfUploads: number;
}

export interface MessageInputUploadsProps extends MessageInputState {
  uploadNewFiles?(files: FileList): void;
  removeImage?(id: string): void;
  uploadImage?(id: string): void;
  removeFile?(id: string): void;
  uploadFile?(id: string): void;
}

export interface MessageInputEmojiPickerProps extends MessageInputState {
  onSelectEmoji(emoji: object): void;
  emojiPickerRef: React.RefObject<HTMLDivElement>;
  small?: boolean;
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

// MessageProps are all props shared between the Message component and the Message UI components (e.g. MessageSimple)
export interface MessageProps extends TranslationContextValue {
  /** The message object */
  message?: Client.MessageResponse;
  /** The client connection object for connecting to Stream */
  client?: Client.StreamChat;
  /** A list of users that have read this message **/
  readBy?: Array<Client.UserResponse>;
  /** groupStyles, a list of styles to apply to this message. ie. top, bottom, single etc */
  groupStyles?: Array<string>;
  /** Editing, if the message is currently being edited */
  editing?: boolean;
  /** The message rendering component, the Message component delegates its rendering logic to this component */
  Message?: React.ElementType<MessageUIComponentProps>;
  /** Message Deleted rendering component. Optional; if left undefined, the default of the Message rendering component is used */
  MessageDeleted?: React.ElementType<MessageDeletedProps>;
  /** Allows you to overwrite the attachment component */
  Attachment?: React.ElementType<AttachmentUIComponentProps>;
  /** render HTML instead of markdown. Posting HTML is only allowed server-side */
  unsafeHTML?: boolean;
  lastReceivedId?: string | null;
  messageListRect?: DOMRect;
  updateMessage?(
    updatedMessage: Client.MessageResponse,
    extraState?: object,
  ): void;
  additionalMessageInputProps?: object;
  clearEditingState?(e?: React.MouseEvent): void;
  getFlagMessageSuccessNotification?(message: MessageResponse): string;
  getFlagMessageErrorNotification?(message: MessageResponse): string;
  getMuteUserSuccessNotification?(message: MessageResponse): string;
  getMuteUserErrorNotification?(message: MessageResponse): string;
  setEditingState?(message: Client.MessageResponse): any;
}

export type MessageComponentState = {
  loading: boolean;
};
// MessageComponentProps defines the props for the Message component
export interface MessageComponentProps
  extends MessageProps,
    TranslationContextValue {
  /** The current channel this message is displayed in */
  channel?: Client.Channel;
  /** Function to be called when a @mention is clicked. Function has access to the DOM event and the target user object */
  onMentionsClick?(
    e: React.MouseEvent,
    mentioned_users: Client.UserResponse[],
  ): void;
  /** Function to be called when hovering over a @mention. Function has access to the DOM event and the target user object */
  onMentionsHover?(
    e: React.MouseEvent,
    mentioned_users: Client.UserResponse[],
  ): void;
  /** Function to be called when clicking the user that posted the message. Function has access to the DOM event and the target user object */
  onUserClick?(e: React.MouseEvent, user: Client.User): void;
  /** Function to be called when hovering the user that posted the message. Function has access to the DOM event and the target user object */
  onUserHover?(e: React.MouseEvent, user: Client.User): void;
  messageActions?: Array<string>;
  members?: SeamlessImmutable.Immutable<{ [user_id: string]: Client.Member }>;
  addNotification?(notificationText: string, type: string): any;
  retrySendMessage?(message: Client.Message): void;
  removeMessage?(updatedMessage: Client.MessageResponse): void;
  mutes?: Client.Mute[];
  openThread?(
    message: Client.MessageResponse,
    event: React.SyntheticEvent,
  ): void;
}

// MessageUIComponentProps defines the props for the Message UI components (e.g. MessageSimple)
export interface MessageUIComponentProps
  extends MessageProps,
    TranslationContextValue {
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
  isUserMuted?(): boolean;
  handleOpenThread?(event: React.BaseSyntheticEvent): void;
  mutes?: Client.Mute[];
  onMentionsClickMessage?(event: React.MouseEvent): void;
  onMentionsHoverMessage?(event: React.MouseEvent): void;
  onUserClick?(e: React.MouseEvent): void;
  onUserHover?(e: React.MouseEvent): void;
  getMessageActions(): Array<string>;
  channelConfig?: Client.ChannelConfig;
  threadList?: boolean;
  additionalMessageInputProps?: object;
  initialMessage?: boolean;
}

export interface MessageDeletedProps extends TranslationContextValue {
  /** The message object */
  message: Client.MessageResponse;
  isMyMessage?(message: Client.MessageResponse): boolean;
}

export interface ThreadProps
  extends ChannelContextValue,
    TranslationContextValue {
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
  latest_reactions?: Client.ReactionResponse[];
  /**
   * {
   *  'like': 9,
   *  'love': 6,
   *  'haha': 2
   * }
   */
  reaction_counts?: {
    [reaction_type: string]: number;
  };
  /** Enable the avatar display */
  detailedView?: boolean;
  /** Provide a list of reaction options [{name: 'angry', emoji: 'angry'}] */
  reactionOptions?: MinimalEmojiInterface[];
  reverse?: boolean;
  handleReaction?(reactionType: string, event?: React.BaseSyntheticEvent): void;
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
  reactions?: Client.ReactionResponse[];
  /**
   * {
   *  'like': 9,
   *  'love': 6,
   *  'haha': 2
   * }
   */
  reaction_counts?: {
    [reaction_type: string]: number;
  };
  /** Provide a list of reaction options [{name: 'angry', emoji: 'angry'}] */
  reactionOptions?: MinimalEmojiInterface[];
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

export interface CardProps extends TranslationContextValue {
  title?: string;
  title_link?: string;
  og_scrape_url?: string;
  image_url?: string;
  thumb_url?: string;
  text?: string;
  type?: string;
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
  additionalTextareaProps?: object;
}

export interface ChatDownProps extends TranslationContextValue {
  image?: string;
  type: string;
  text?: string;
}

export interface CommandItemProps {
  entity: {
    name: string;
    args: string;
    description: string;
  };
}

export interface EditMessageFormProps
  extends MessageInputProps,
    TranslationContextValue {}
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
  listenToScroll?(standardOffset: number, reverseOffset: number): void;
  [elementAttribute: string]: any; // any other prop is applied as attribute to element
}

export interface LoadMoreButtonProps {
  onClick: React.MouseEventHandler;
  refreshing: boolean;
}
export interface LoadingChannelsProps {}
export interface MessageActionsBoxProps {
  /** If the message actions box should be open or not */
  open?: boolean;
  /** If message belongs to current user. */
  mine?: boolean;
  isUserMuted?(): boolean;
  /** DOMRect object for parent MessageList component */
  messageListRect?: DOMRect;
  handleEdit?(event?: React.BaseSyntheticEvent): void;
  handleDelete?(event?: React.BaseSyntheticEvent): void;
  handleFlag?(event?: React.BaseSyntheticEvent): void;
  handleMute?(event?: React.BaseSyntheticEvent): void;
  getMessageActions(): Array<string>;
}
export interface MessageNotificationProps {
  showNotification: boolean;
  onClick: React.MouseEventHandler;
}
export interface MessageRepliesCountButtonProps
  extends TranslationContextValue {
  labelSingle?: string;
  labelPlural?: string;
  reply_count?: number;
  onClick?: React.MouseEventHandler;
}
export interface ModalProps {
  onClose(): void;
  open: boolean;
}
export interface SafeAnchorProps {}
export interface SimpleReactionsListProps {
  reactions?: Client.ReactionResponse[];
  /**
   * {
   *  'like': 9,
   *  'love': 6,
   *  'haha': 2
   * }
   */
  reaction_counts?: {
    [reaction_type: string]: number;
  };
  /** Provide a list of reaction options [{name: 'angry', emoji: 'angry'}] */
  reactionOptions?: MinimalEmojiInterface[];
  handleReaction?(reactionType: string): void;
}
export interface TooltipProps {}

export const AttachmentActions: React.FC<AttachmentActionsProps>;
export class Audio extends React.PureComponent<AudioProps, any> {}
export const Card: React.FC<CardProps>;
export class ChatAutoComplete extends React.PureComponent<
  ChatAutoCompleteProps,
  any
> {}
export const ChatDown: React.FC<ChatDownProps>;
export const CommandItem: React.FC<CommandItemProps>;
export const UserItem: React.FC<UserItemProps>;
export const DateSeparator: React.FC<DateSeparatorProps>;
export class EditMessageForm extends React.PureComponent<
  EditMessageFormProps,
  any
> {}
export const EmoticonItem: React.FC<EmoticonItemProps>;
export const EmptyStateIndicator: React.FC<EmptyStateIndicatorProps>;
export const EventComponent: React.FC<EventComponentProps>;
export class Gallery extends React.PureComponent<GalleryProps, any> {}
export class Image extends React.PureComponent<ImageProps, any> {}
export class InfiniteScroll extends React.PureComponent<
  InfiniteScrollProps,
  any
> {}

export const LoadMoreButton: React.FC<LoadMoreButtonProps>;
export const LoadingChannels: React.FC<LoadingChannelsProps>;
export const LoadingErrorIndicator: React.FC<LoadingErrorIndicatorProps>;

export class MessageActionsBox extends React.PureComponent<
  MessageActionsBoxProps,
  any
> {}
export const MessageNotification: React.FC<MessageNotificationProps>;
export const MessageRepliesCountButton: React.FC<MessageRepliesCountButtonProps>;
export class Modal extends React.PureComponent<ModalProps, any> {}
export class ReverseInfiniteScroll extends React.PureComponent<
  InfiniteScrollProps,
  any
> {}
export class SafeAnchor extends React.PureComponent<SafeAnchorProps, any> {}
export const SendButton: React.FC<SendButtonProps>;
export class SimpleReactionsList extends React.PureComponent<
  SimpleReactionsListProps,
  any
> {}
export const Tooltip: React.FC<TooltipProps>;
export const Chat: React.FC<ChatProps>;
export class Channel extends React.PureComponent<ChannelProps, any> {}
export class Avatar extends React.PureComponent<AvatarProps, any> {}
export class Message extends React.PureComponent<MessageComponentProps, any> {}
export class MessageList extends React.PureComponent<MessageListProps, any> {}
export const ChannelHeader: React.FC<ChannelHeaderProps>;
export class MessageInput extends React.PureComponent<MessageInputProps, any> {}
export class MessageInputLarge extends React.PureComponent<
  MessageInputProps,
  any
> {}
export class MessageInputFlat extends React.PureComponent<
  MessageInputProps,
  any
> {}
export class MessageInputSmall extends React.PureComponent<
  MessageInputProps,
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
export const ChannelPreviewCountOnly: React.FC<ChannelPreviewUIComponentProps>;
export class ChannelPreviewLastMessage extends React.PureComponent<
  ChannelPreviewUIComponentProps,
  any
> {}
export const ChannelSearch: React.FC<any>;
export const LoadMorePaginator: React.FC<LoadMorePaginatorProps>;
export const InfiniteScrollPaginator: React.FC<InfiniteScrollPaginatorProps>;
export const LoadingIndicator: React.FC<LoadingIndicatorProps>;

export interface MessageCommerceProps extends MessageUIComponentProps {}
export type MessageCommerceState = {
  isFocused: boolean;
  showDetailedReactions: boolean;
};
export class MessageCommerce extends React.PureComponent<
  MessageCommerceProps,
  MessageCommerceState
> {}

export interface MessageLivestreamProps extends MessageUIComponentProps {}
export type MessageLivestreamState = {
  actionsBoxOpen: boolean;
  reactionSelectorOpen: boolean;
};
export class MessageLivestream extends React.PureComponent<
  MessageLivestreamProps,
  MessageLivestreamState
> {}
export type MessageTeamState = {
  actionsBoxOpen: boolean;
  reactionSelectorOpen: boolean;
};
export interface MessageTeamProps extends MessageUIComponentProps {}
export class MessageTeam extends React.PureComponent<
  MessageUIComponentProps,
  MessageTeamState
> {}

export interface MessageSimpleProps extends MessageUIComponentProps {}
export interface MessageSimpleTextProps extends MessageSimpleProps {
  actionsBoxOpen: boolean;
  onReactionListClick: () => void;
  showDetailedReactions: boolean;
  reactionSelectorRef: React.RefObject<ReactionSelector>;
  setActionsBoxOpen: (state: boolean) => void;
  hideOptions: () => void;
}
export interface MessageSimpleOptionsProps extends MessageSimpleProps {
  actionsBoxOpen: boolean;
  hideOptions: () => void;
  setActionsBoxOpen: (state: boolean) => void;
  onReactionListClick: () => void;
}
export interface MessageSimpleActionsProps extends MessageSimpleProps {
  addNotification?(notificationText: string, type: string): any;
  actionsBoxOpen: boolean;
  hideOptions: () => void;
  setActionsBoxOpen: (state: boolean) => void;
}

export const MessageSimple: React.FC<MessageSimpleProps>;

export class MessageDeleted extends React.PureComponent<
  MessageDeletedProps,
  any
> {}

export class Thread extends React.PureComponent<ThreadProps, any> {}
export const TypingIndicator: React.FC<TypingIndicatorProps>;
export class ReactionSelector extends React.PureComponent<
  ReactionSelectorProps,
  any
> {}
export class ReactionsList extends React.PureComponent<
  ReactionsListProps,
  any
> {}
export const Window: React.FC<WindowProps>;

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

declare function withTranslationContext<T>(
  OriginalComponent: React.ElementType<T>,
): React.ElementType<T>;
export interface TranslationContext
  extends React.Context<TranslationContextValue> {}
export interface TranslationContextValue {
  t?: i18next.TFunction;
  tDateTimeParser?(datetime: string | number): Dayjs.Dayjs;
}

export interface Streami18nOptions {
  language: string;
  disableDateTimeTranslations?: boolean;
  translationsForLanguage?: object;
  debug?: boolean;
  logger?(msg: string): any;
  dayjsLocaleConfigForLanguage?: object;
  DateTimeParser?(): object;
}

export interface Streami18nTranslators {
  t: i18next.TFunction;
  tDateTimeParser?(datetime?: string | number): object;
}

export class Streami18n {
  constructor(options?: Streami18nOptions);

  init(): Promise<Streami18nTranslators>;
  validateCurrentLanguage(): void;
  geti18Instance(): i18next.i18n;
  getAvailableLanguages(): Array<string>;
  getTranslations(): Array<string>;
  getTranslators(): Promise<Streami18nTranslators>;
  registerTranslation(
    key: string,
    translation: object,
    customDayjsLocale?: Partial<ILocale>,
  ): void;
  addOrUpdateLocale(key: string, config: Partial<ILocale>): void;
  setLanguage(language: string): Promise<void>;
  localeExists(language: string): boolean;
  registerSetLanguageCallback(callback: (t: i18next.TFunction) => void): void;
}

export const enTranslations: object;
export const nlTranslations: object;
export const ruTranslations: object;
export const trTranslations: object;
export const frTranslations: object;
export const hiTranslations: object;
export const itTranslations: object;
