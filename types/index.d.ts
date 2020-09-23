// TypeScript Version: 2.8

/** Components */
import * as React from 'react';
import * as Client from 'stream-chat';
import SeamlessImmutable from 'seamless-immutable';
import { MessageResponse, UnknownType } from 'stream-chat';
import ReactMarkdown from 'react-markdown';
import * as i18next from 'i18next';
import * as Dayjs from 'dayjs';
import { ReactPlayerProps } from 'react-player';
import { ScrollSeekConfiguration } from 'react-virtuoso/dist/engines/scrollSeekEngine';

export type Mute = Client.Mute<StreamChatReactUserType>;
export type AnyType = Record<string, any>;
export type StreamChatReactUserType = {
  status?: string;
  image?: string;
  mutes?: Array<Mute>;
};
export type StreamChatReactChannelType = {
  image?: string;
  subtitle?: string;
  member_count?: number;
};
export type StreamChatMessageType = {
  event?: Client.Event<
    AnyType,
    StreamChatReactChannelType,
    string & {},
    AnyType,
    StreamChatMessageType,
    AnyType,
    StreamChatReactUserType
  >;
};
export type StreamChatReactMessage = Client.Message<
  AnyType,
  StreamChatMessageType,
  StreamChatReactUserType
>;
export type StreamChatReactMessageResponse = Client.MessageResponse<
  AnyType,
  StreamChatReactChannelType,
  string & {},
  StreamChatMessageType,
  AnyType,
  StreamChatReactUserType
>;
export type StreamChatReactClient = Client.StreamChat<
  AnyType,
  StreamChatReactChannelType,
  string & {},
  AnyType,
  StreamChatMessageType,
  AnyType,
  StreamChatReactUserType
>;
export type StreamChatChannelState = Client.ChannelState<
  AnyType,
  StreamChatReactChannelType,
  string & {},
  AnyType,
  StreamChatMessageType,
  AnyType,
  StreamChatReactUserType
>;

export interface ChatContextValue {
  client: StreamChatReactClient;
  channel?: ReturnType<StreamChatReactClient['channel']>;
  setActiveChannel?(
    channel?: ReturnType<StreamChatReactClient['channel']>,
    watchers?: { limit?: number; offset?: number },
    event?: React.SyntheticEvent,
  ): void;
  navOpen?: boolean;
  openMobileNav?(): void;
  closeMobileNav?(): void;
  theme?: string;
  mutes?: Mute[];
}

export interface ChannelContextValue extends ChatContextValue {
  Message?: React.ElementType<MessageUIComponentProps>;
  Attachment?: React.ElementType<WrapperAttachmentUIComponentProps>;
  messages?: StreamChatChannelState['messages'];
  typing?: StreamChatChannelState['typing'];
  watchers?: StreamChatChannelState['watchers'];
  members?: StreamChatChannelState['members'];
  read?: Client.ChannelState['read'];
  thread?: ReturnType<StreamChatChannelState['messageToImmutable']> | null;
  online?: boolean;
  watcher_count?: number;
  error?: Error | null;
  // Loading the initial content of the channel
  loading?: boolean;
  // Loading more messages
  loadingMore?: boolean;
  hasMore?: boolean;
  threadLoadingMore?: boolean;
  threadHasMore?: boolean;
  threadMessages?: SeamlessImmutable.ImmutableArray<
    ReturnType<StreamChatChannelState['messageToImmutable']>
  >;

  multipleUploads?: boolean;
  acceptedFiles?: string[];
  maxNumberOfFiles?: number;
  sendMessage?(message: {
    text: string;
    attachments?: (
      | Client.Attachment<Record<string, unknown>>
      | {
          type: string;
          image_url: string | undefined;
          fallback: string;
        }
      | {
          type: string;
          asset_url: string;
          title: string;
          mime_type: string;
          file_size: number;
        }
    )[];
    mentioned_users?: string[];
    parent?: StreamChatReactMessageResponse;
    id?: string;
  }): Promise<any>;
  editMessage?(
    updatedMessage: StreamChatReactMessage,
  ): Promise<Client.UpdateMessageAPIResponse | void>;
  /** Via Context: The function to update a message, handled by the Channel component */
  updateMessage?(
    updatedMessage: StreamChatReactMessageResponse,
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

  loadMore?(messageLimit?: number): Promise<number>;
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

export interface ChannelProps {
  channel?: Client.Channel;

  /** The loading indicator to use */
  LoadingIndicator?: React.ElementType<LoadingIndicatorProps>;
  LoadingErrorIndicator?: React.ElementType<LoadingErrorIndicatorProps>;
  Message?: React.ElementType<MessageUIComponentProps>;
  Attachment?: React.ElementType<WrapperAttachmentUIComponentProps>;
  EmptyPlaceholder?: React.ReactElement;
  mutes?: Client.Mute[];
  multipleUploads?: boolean;
  acceptedFiles?: string[];
  maxNumberOfFiles?: number;

  /** Function to be called when a @mention is clicked. Function has access to the DOM event and the target user object */
  onMentionsClick?(e: React.MouseEvent, user?: Client.UserResponse): void;
  /** Function to be called when hovering over a @mention. Function has access to the DOM event and the target user object */
  onMentionsHover?(e: React.MouseEvent, user?: Client.UserResponse): void;

  /** Override send message request (Advanced usage only) */
  doSendMessageRequest?(
    channelId: string,
    message: Client.Message,
  ): ReturnType<Client.Channel['sendMessage']> | void;
  doMarkReadRequest?(
    channel: Client.Channel,
  ): Promise<Client.MessageResponse> | void;
  /** Override update(edit) message request (Advanced usage only) */
  doUpdateMessageRequest?(
    channelId: string,
    updatedMessage: Client.Message,
  ): Promise<Client.UpdateMessageAPIResponse>;
}

export type ArrayTwoOrMore<T> = {
  0: T;
  1: T;
} & Array<T>;

export type RequireAtLeastOne<T, Keys extends keyof T = keyof T> = Pick<
  T,
  Exclude<keyof T, Keys>
> &
  {
    [K in Keys]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<Keys, K>>>;
  }[Keys];

export type PrimitiveFilter = string | number | boolean;

export interface ChannelFilter {
  $and?: ArrayTwoOrMore<RequireAtLeastOne<ChannelFilter>>;
  $eq?: PrimitiveFilter;
  $gt?: PrimitiveFilter;
  $gte?: PrimitiveFilter;
  $in?: PrimitiveFilter[];
  $lt?: PrimitiveFilter;
  $lte?: PrimitiveFilter;
  $ne?: PrimitiveFilter;
  $nin?: PrimitiveFilter[];
  $nor?: ArrayTwoOrMore<RequireAtLeastOne<ChannelFilter>>;
  $or?: ArrayTwoOrMore<RequireAtLeastOne<ChannelFilter>>;
}

export interface ChannelFilters {
  [key: string]: PrimitiveFilter | RequireAtLeastOne<ChannelFilter>;
}

export type AscDesc = 1 | -1;

export interface ChannelSort {
  last_updated?: AscDesc;
  last_message_at?: AscDesc;
  updated_at?: AscDesc;
  created_at?: AscDesc;
  member_count?: AscDesc;
  unread_count?: AscDesc;
  has_unread?: AscDesc;
  [key: string]: AscDesc | undefined;
}

export interface ChannelOptions {
  state?: boolean;
  watch?: boolean;
  limit?: number;
  offset?: number;
  message_limit?: number;
  presence?: boolean;
}

export interface ChannelListProps {
  EmptyStateIndicator?: React.ElementType<EmptyStateIndicatorProps>;
  /** The Preview to use, defaults to ChannelPreviewLastMessage */
  Preview?: React.ElementType<ChannelPreviewUIComponentProps>;

  /** The loading indicator to use */
  LoadingIndicator?: React.ElementType<LoadingIndicatorProps>;
  LoadingErrorIndicator?: React.ElementType<ChatDownProps>;
  List?: React.ElementType<ChannelListUIComponentProps>;
  Paginator?: React.ElementType<PaginatorProps>;
  lockChannelOrder?: boolean;
  onMessageNew?(
    thisArg: React.Dispatch<React.SetStateAction<Client.Channel[]>>,
    e: Client.Event,
  ): void;
  /** Function that overrides default behaviour when users gets added to a channel */
  onAddedToChannel?(
    thisArg: React.Dispatch<React.SetStateAction<Client.Channel[]>>,
    e: Client.Event,
  ): void;
  /** Function that overrides default behaviour when users gets removed from a channel */
  onRemovedFromChannel?(
    thisArg: React.Dispatch<React.SetStateAction<Client.Channel[]>>,
    e: Client.Event,
  ): void;
  onChannelHidden?(
    thisArg: React.Dispatch<React.SetStateAction<Client.Channel[]>>,
    e: Client.Event,
  ): void;
  onChannelVisible?(
    thisArg: React.Dispatch<React.SetStateAction<Client.Channel[]>>,
    e: Client.Event,
  ): void;
  onChannelUpdated?(
    thisArg: React.Dispatch<React.SetStateAction<Client.Channel[]>>,
    e: Client.Event,
  ): void;
  onChannelDeleted?(
    thisArg: React.Dispatch<React.SetStateAction<Client.Channel[]>>,
    e: Client.Event,
  ): void;
  onChannelTruncated?(
    thisArg: React.Dispatch<React.SetStateAction<Client.Channel[]>>,
    e: Client.Event,
  ): void;
  setActiveChannelOnMount?: boolean;
  /** Object containing query filters */
  filters?: Client.ChannelFilters;
  /** Object containing query options */
  options?: Client.ChannelOptions;
  /** Object containing sort parameters */
  sort?: Client.ChannelSort;
  showSidebar?: boolean;
  watchers?: { limit?: number; offset?: number };
  customActiveChannel?: string;
}

export interface ChannelListUIComponentProps {
  /** If channel list ran into error */
  error?: boolean;
  /** If channel list is in loading state */
  loading?: boolean;
  sidebarImage?: string | null;
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
  Preview?: React.ComponentType<ChannelPreviewUIComponentProps>;
  key: string;
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
  setActiveChannel?(
    channel?: Client.Channel,
    watchers?: { limit?: number; offset?: number },
    event?: React.SyntheticEvent,
  ): void;

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
  error?: Error | null;
}

export interface AvatarProps {
  /** image url */
  image?: string | null;
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

export interface FixedHeightMessageProps {
  message: Client.MessageResponse;
}

export interface VirtualizedMessageListInternalProps {
  /** **Available from [chat context](https://getstream.github.io/stream-chat-react/#chat)** */
  client: StreamChatReactClient;
  /** **Available from [channel context](https://getstream.github.io/stream-chat-react/#channel)** */
  messages: SeamlessImmutable.ImmutableArray<Client.MessageResponse>;
  /** **Available from [channel context](https://getstream.github.io/stream-chat-react/#channel)** */
  loadMore(messageLimit?: number): Promise<number>;
  /** **Available from [channel context](https://getstream.github.io/stream-chat-react/#channel)** */
  hasMore: boolean;
  /** **Available from [channel context](https://getstream.github.io/stream-chat-react/#channel)** */
  loadingMore: boolean;
  /** Set the limit to use when paginating messages */
  messageLimit: number;
  /** Custom UI component to display messages. */
  Message: React.ElementType<FixedHeightMessageProps>;
  /** Custom UI component to display deleted messages. */
  MessageDeleted: React.ElementType<MessageDeletedProps>;
  /** Custom UI component to display system messages */
  MessageSystem: React.ElementType<EventComponentProps>;
  /** The UI Indicator to use when MessagerList or ChannelList is empty */
  EmptyStateIndicator: React.ElementType<EmptyStateIndicatorProps>;
  /** Component to render at the top of the MessageList while loading new messages */
  LoadingIndicator: React.ElementType<LoadingIndicatorProps>;
  /** Causes the underlying list to render extra content in addition to the necessary one to fill in the visible viewport. */
  overscan: number;
  /** Performance improvement by showing placeholders if user scrolls fast through list
   * it can be used like this:
   *  {
   *    enter: (velocity) => Math.abs(velocity) > 120,
   *    exit: (velocity) => Math.abs(velocity) < 40,
   *    change: () => null,
   *    placeholder: ({index, height})=> <div style={{height: height + "px"}}>{index}</div>,
   *  }
   */
  scrollSeekPlaceHolder?: ScrollSeekConfiguration;
}

export interface VirtualizedMessageListProps
  extends Partial<VirtualizedMessageListInternalProps> {}

export interface MessageListProps {
  /** Typing indicator component to render  */
  TypingIndicator?: React.ElementType<TypingIndicatorProps>;
  /** Component to render at the top of the MessageList */
  HeaderComponent?: React.ElementType;
  /** Component to render at the top of the MessageList */
  EmptyStateIndicator?: React.ElementType<EmptyStateIndicatorProps>;
  LoadingIndicator?: React.ElementType<LoadingIndicatorProps>;
  /** Date separator component to render  */
  dateSeparator?: React.ElementType<DateSeparatorProps>;
  DateSeparator?: React.ElementType<DateSeparatorProps>;
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
  client?: Client.StreamChat;
  loadMore?(messageLimit?: number): Promise<number>;
  MessageSystem?: React.ElementType;
  messages?: SeamlessImmutable.ImmutableArray<Client.MessageResponse>;
  read?: {
    [user_id: string]: SeamlessImmutable.Immutable<{
      last_read: string;
      user: Client.UserResponse;
    }>;
  };
  hasMore?: boolean;
  loadingMore?: boolean;
  openThread?(): void;
  members?: SeamlessImmutable.Immutable<{
    [user_id: string]: Client.ChannelMemberResponse;
  }>;
  watchers?: SeamlessImmutable.Immutable<{
    [user_id: string]: Client.ChannelMemberResponse;
  }>;
  channel?: Client.Channel;
  retrySendMessage?(message: Client.Message): Promise<void>;

  updateMessage?(
    updatedMessage: Client.MessageResponse,
    extraState?: object,
  ): void;
  removeMessage?(updatedMessage: Client.MessageResponse): void;
  Message?: React.ElementType;
  Attachment?: React.ElementType;
  onMentionsClick?(
    e: React.MouseEvent,
    mentioned_users: Client.UserResponse[],
  ): void;
  /** Function to be called when hovering over a @mention. Function has access to the DOM event and the target user object */
  onMentionsHover?(
    e: React.MouseEvent,
    mentioned_users: Client.UserResponse[],
  ): void;
}

export interface ChannelHeaderProps {
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
  /** enable/disable firing the typing event */
  publishTypingEvent?: boolean;
  /** Grow the textarea while you're typing */
  grow?: boolean;
  /** Max number of rows the textarea is allowed to grow */
  maxRows?: number;

  autocompleteTriggers?: object;

  /** The parent message object when replying on a thread */
  parent?: StreamChatReactMessageResponse;

  /** The component handling how the input is rendered */
  Input?: React.ElementType<MessageInputProps>;

  /** Change the SendButton component */
  SendButton?: React.ElementType<SendButtonProps>;

  /** Override image upload request */
  doImageUploadRequest?(
    file: object,
    channel: Client.Channel,
  ): Promise<Client.SendFileAPIResponse>;

  /** Override file upload request */
  doFileUploadRequest?(
    file: File,
    channel: Client.Channel,
  ): Promise<Client.SendFileAPIResponse>;

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

export interface FileAttachmentProps {
  attachment: Client.Attachment & { asset_url?: string };
}

export interface ExtendedAttachment extends Client.Attachment {
  id?: string;
  asset_url?: string;
  mime_type?: string;
  images?: Array;
}

export interface BaseAttachmentUIComponentProps {
  /** The attachment to render */
  /**
		The handler function to call when an action is selected on an attachment.
		Examples include canceling a \/giphy command or shuffling the results.
		*/
  actionHandler?(
    name: string,
    value: string,
    event: React.BaseSyntheticEvent,
  ): void;
  Card?: React.ComponentType<CardProps>;
  File?: React.ComponentType<FileAttachmentProps>;
  Image?: React.ComponentType<ImageProps>;
  Gallery?: React.ComponentType<GalleryProps>;
  Audio?: React.ComponentType<AudioProps>;
  Media?: React.ComponentType<ReactPlayerProps>;
  AttachmentActions?: React.ComponentType<AttachmentActionsProps>;
}

export interface WrapperAttachmentUIComponentProps
  extends BaseAttachmentUIComponentProps {
  attachments: ExtendedAttachment[];
}

export interface InnerAttachmentUIComponentProps
  extends BaseAttachmentUIComponentProps {
  attachment: ExtendedAttachment;
}

// MessageProps are all props shared between the Message component and the Message UI components (e.g. MessageSimple)
export interface MessageProps extends TranslationContextValue {
  addNotification?(notificationText: string, type: string): any;
  /** The message object */
  message?: StreamChatReactMessageResponse;
  /** The client connection object for connecting to Stream */
  client?: StreamChatReactClient;
  /** A list of users that have read this message **/
  readBy?: Array<Client.UserResponse<StreamChatReactUserType>>;
  /** groupStyles, a list of styles to apply to this message. ie. top, bottom, single etc */
  groupStyles?: Array<string>;
  /** The message rendering component, the Message component delegates its rendering logic to this component */
  Message?: React.ElementType<MessageUIComponentProps>;
  /** Message Deleted rendering component. Optional; if left undefined, the default of the Message rendering component is used */
  MessageDeleted?: React.ElementType<MessageDeletedProps>;

  ReactionSelector?: React.ElementType<ReactionSelectorProps>;
  ReactionsList?: React.ElementType<ReactionsListProps>;
  /** Allows you to overwrite the attachment component */
  Attachment?: React.ElementType<WrapperAttachmentUIComponentProps>;
  /** render HTML instead of markdown. Posting HTML is only allowed server-side */
  unsafeHTML?: boolean;
  lastReceivedId?: string | null;
  messageListRect?: DOMRect;
  updateMessage?(
    updatedMessage: StreamChatReactMessageResponse,
    extraState?: object,
  ): void;
  additionalMessageInputProps?: object;
  getFlagMessageSuccessNotification?(
    message: StreamChatReactMessageResponse,
  ): string;
  getFlagMessageErrorNotification?(
    message: StreamChatReactMessageResponse,
  ): string;
  getMuteUserSuccessNotification?(
    message: StreamChatReactMessageResponse,
  ): string;
  getMuteUserErrorNotification?(
    message: StreamChatReactMessageResponse,
  ): string;
  /** Override the default formatting of the date. This is a function that has access to the original date object. Returns a string or Node  */
  formatDate?(date: Date): string;
}

export type MessageComponentState = {
  editing: boolean;
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
  messageActions?: Array<string> | boolean;
  members?: SeamlessImmutable.Immutable<{
    [user_id: string]: Client.ChannelMemberResponse<StreamChatReactUserType>;
  }>;
  retrySendMessage?(message: Client.Message): Promise<void>;
  removeMessage?(updatedMessage: Client.MessageResponse): void;
  mutes?: Client.Mute[];
  openThread?(
    message: Client.MessageResponse,
    event: React.SyntheticEvent,
  ): void;
  initialMessage?: boolean;
  threadList?: boolean;
}

// MessageUIComponentProps defines the props for the Message UI components (e.g. MessageSimple)
export interface MessageUIComponentProps
  extends MessageProps,
    TranslationContextValue {
  actionsEnabled?: boolean;
  editing?: boolean;
  clearEditingState?(event?: React.BaseSyntheticEvent): void;
  setEditingState?(event?: React.BaseSyntheticEvent): void;
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
  channelConfig?: Client.ChannelConfig | Client.ChannelConfigWithInfo;
  threadList?: boolean;
  additionalMessageInputProps?: object;
  initialMessage?: boolean;
}
export interface MessageDeletedProps extends TranslationContextValue {
  /** The message object */
  message: Client.MessageResponse;
  isMyMessage?(message: Client.MessageResponse): boolean;
}

export interface ThreadProps {
  channel?: ReturnType<StreamChatReactClient['channel']>;
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
  rows?: number;
  grow?: boolean;
  maxRows?: number;
  disabled?: boolean;
  value?: string;
  handleSubmit?(event: React.FormEvent): void;
  onChange?(event: React.ChangeEventHandler): void;
  placeholder?: string;
  LoadingIndicator?: React.ElementType<LoadingIndicatorProps>;
  minChar?: number;
  onSelectItem?(item: any): any;
  commands?: Client.CommandResponse[];
  triggers?: object;
  onFocus?: React.FocusEventHandler;
  onPaste?: React.ClipboardEventHandler;
  additionalTextareaProps?: object;
  innerRef: React.MutableRefObject<HTMLTextAreaElement | undefined>;
}

export interface ChatDownProps extends TranslationContextValue {
  image?: string;
  type: string;
  text?: string;
}

export interface CommandItemProps {
  entity: {
    name?: string | null;
    args?: string | null;
    description?: string | null;
  };
}

export interface EditMessageFormProps
  extends MessageInputProps,
    TranslationContextValue {}
export interface EmoticonItemProps {
  entity: {
    name: string;
    native: string;
  };
}

export interface UserItemProps {
  entity: {
    name?: string | null;
    id?: string | null;
    image?: string | null;
  };
}

export interface EventComponentProps {
  message: StreamChatReactMessageResponse;
}

export interface GalleryProps {
  images: Client.Attachment[];
}

export interface ImageProps {
  image_url?: string;
  thumb_url?: string;
  fallback?: string;
}

export interface ModalWrapperProps {
  images: { src: string; source: string }[];
  toggleModal: (selectedIndex?: number) => void;
  index?: number;
  modalIsOpen: boolean;
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
  children?: any;
  listenToScroll?: (offset: number, reverseOffset: number) => void;
}

export interface ModalImageProps {
  data: { src: string };
}

export interface ReverseInfiniteScrollProps {
  loadMore(messageLimit?: number): Promise<number>;
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
  children?: any;
}
export interface MessageRepliesCountButtonProps
  extends TranslationContextValue {
  labelSingle?: string;
  labelPlural?: string;
  reply_count?: number;
  onClick?: React.MouseEventHandler;
}
export interface ModalProps {
  onClose?(): void;
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
export const Gallery: React.FC<GalleryProps>;
export const Image: React.FC<ImageProps>;
export const ImageModal: React.FC<ModalWrapperProps>;
export const EventComponent: React.FC<EventComponentProps>;
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
export const ModalImage: React.FC<ModalImageProps>;

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
  WrapperAttachmentUIComponentProps
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

export const ChannelPreview: React.FC<ChannelPreviewProps>;

export const ChannelPreviewCompact: React.FC<ChannelPreviewUIComponentProps>;
export const ChannelPreviewMessenger: React.FC<ChannelPreviewUIComponentProps>;
export const ChannelPreviewCountOnly: React.FC<ChannelPreviewUIComponentProps>;
export const ChannelPreviewLastMessage: React.FC<ChannelPreviewUIComponentProps>;
export const ChannelSearch: React.FC<any>;
export const LoadMorePaginator: React.FC<LoadMorePaginatorProps>;
export const InfiniteScrollPaginator: React.FC<InfiniteScrollPaginatorProps>;
export const LoadingIndicator: React.FC<LoadingIndicatorProps>;

export interface MessageCommerceProps extends MessageUIComponentProps {}
export const MessageCommerce: React.FC<MessageCommerceProps>;

export interface MessageLivestreamProps extends MessageUIComponentProps {}
export interface MessageLivestreamActionProps {
  initialMessage?: boolean;
  message?: Client.MessageResponse;
  tDateTimeParser?(datetime: string | number): Dayjs.Dayjs;
  channelConfig?: Client.ChannelConfig | Client.ChannelConfigWithInfo;
  threadList?: boolean;
  handleOpenThread?(event: React.BaseSyntheticEvent): void;
  onReactionListClick?: () => void;
  getMessageActions(): Array<string>;
  messageWrapperRef?: React.RefObject<HTMLElement>;
  setEditingState?(event?: React.BaseSyntheticEvent): void;
  formatDate?(date: Date): string;
}
export const MessageLivestream: React.FC<MessageLivestreamProps>;
export type MessageTeamState = {
  actionsBoxOpen: boolean;
  reactionSelectorOpen: boolean;
};
export interface MessageTeamProps extends MessageUIComponentProps {}
export interface MessageTeamAttachmentsProps {
  Attachment?: React.ElementType<WrapperAttachmentUIComponentProps>;
  message?: Client.MessageResponse;
  handleAction?(
    name: string,
    value: string,
    event: React.BaseSyntheticEvent,
  ): void;
}
export interface MessageTeamStatusProps {
  t?: i18next.TFunction;
  threadList?: boolean;
  lastReceivedId?: string | null;
  message?: StreamChatReactMessageResponse;
  readBy?: Array<Client.UserResponse<StreamChatReactUserType>>;
}
export class MessageTeam extends React.PureComponent<
  MessageUIComponentProps,
  MessageTeamState
> {}

export interface MessageSimpleProps extends MessageUIComponentProps {}
export interface MessageTimestampProps {
  customClass?: string;
  message?: Client.MessageResponse;
  calendar?: boolean;
  format?: string;
  tDateTimeParser?(datetime: string | number): Dayjs.Dayjs;
  /** Override the default formatting of the date. This is a function that has access to the original date object. Returns a string or Node  */
  formatDate?(date: Date): string;
}

export interface MessageTextProps extends MessageSimpleProps {
  customOptionProps?: Partial<MessageOptionsProps>;
  customInnerClass?: string;
  customWrapperClass?: string;
  onReactionListClick?: () => void;
  theme?: string;
  showDetailedReactions?: boolean;
  messageWrapperRef?: React.RefObject<HTMLElement>;
}

export interface MessageActionsProps {
  addNotification?(notificationText: string, type: string): any;
  handleEdit?(event?: React.BaseSyntheticEvent): void;
  handleDelete?(event?: React.BaseSyntheticEvent): void;
  handleFlag?(event?: React.BaseSyntheticEvent): void;
  handleMute?(event?: React.BaseSyntheticEvent): void;
  mutes?: Client.Mute[];
  getMessageActions(): Array<string>;
  getFlagMessageSuccessNotification?(message: MessageResponse): string;
  getFlagMessageErrorNotification?(message: MessageResponse): string;
  getMuteUserSuccessNotification?(message: MessageResponse): string;
  getMuteUserErrorNotification?(message: MessageResponse): string;
  setEditingState?(event?: React.BaseSyntheticEvent): void;
  messageListRect?: DOMRect;
  message?: Client.MessageResponse;
  messageWrapperRef?: React.RefObject<HTMLElement>;
  inline?: boolean;
  customWrapperClass?: string;
}
export interface MessageActionsWrapperProps {
  customWrapperClass?: string;
  inline?: boolean;
  setActionsBoxOpen: (actionsBoxOpen: boolean) => void;
}

export interface MessageOptionsProps {
  getMessageActions(): Array<string>;
  handleOpenThread?(event: React.BaseSyntheticEvent): void;
  initialMessage?: boolean;
  message?: Client.MessageResponse;
  messageWrapperRef?: React.RefObject<HTMLElement>;
  onReactionListClick?: () => void;
  threadList?: boolean;
  displayLeft?: boolean;
  displayReplies?: boolean;
  displayActions?: boolean;
  theme?: string;
}

export const MessageSimple: React.FC<MessageSimpleProps>;

export class MessageDeleted extends React.PureComponent<
  MessageDeletedProps,
  any
> {}

export class Thread extends React.PureComponent<
  Omit<ThreadProps & ChannelContextValue & TranslationContextValue, 'client'>,
  any
> {}
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
  messageText?: string,
  mentioned_users?: Client.UserResponse[],
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
