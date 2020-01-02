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
      | Client.MemberRemovedEvent)[];
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
  showSidebar: boolean;
}

export interface ChannelPreviewProps {
  channel: Client.StreamChat;
  activeChannel: Client.StreamChat;
  Preview: React.ElementType<ChannelPreviewUIComponentProps>;
  key: string;
  connectionRecoveredCount: number;
  closeMenu(): void;
  setActiveChannel(channel: Client.StreamChat): void;
  channelUpdateCount: number;
}

export interface ChannelPreviewUIComponentProps extends ChannelPreviewProps {
  latestMessage: string;
  active: boolean;

  /** Following props are coming from state of ChannelPreview */
  unread: number;
  lastMessage: Client.MessageResponse;
  lastRead: Date;
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
  onPaste?(event: React.ClipboardEventHandler): void;
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

export class Chat extends React.PureComponent<ChatProps, any> {}
export class Channel extends React.PureComponent<ChannelProps, any> {}
export class Avatar extends React.PureComponent<AvatarProps, any> {}
export class Message extends React.PureComponent<any, any> {}
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

export class ChannelPreviewCompact extends React.PureComponent<
  ChannelPreviewUIComponentProps,
  any
> {}
export class ChannelPreviewMessenger extends React.PureComponent<
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
