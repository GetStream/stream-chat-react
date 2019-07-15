// TypeScript Version: 3.5
import * as Client from 'stream-chat';
import SeamlessImmutable from 'seamless-immutable';

interface ChatContext {
  client?: Client.StreamChat;
  channel?: Client.Channel;
  setActiveChannel?(channel: Client.Channel, event: React.SyntheticEvent): void;
  theme?: Theme;
}

interface ChannelContext {
  error?: boolean;
  // Loading the intial content of the channel
  loading?: boolean;
  // Loading more messages
  loadingMore?: boolean;
  hasMore?: boolean;
  messages?: Client.MessageResponse[];
  online?: boolean;
  // TODO: fix these to immutable
  typing?: Object;
  watchers?: Object;
  watcher_count?: number;
  members?: Object;
  read?: Object;

  thread?: boolean;
  threadMessages?: Client.MessageResponse[];
  threadLoadingMore?: boolean;
  threadHasMore?: boolean;

  client?: Client.StreamChat;
  Message?: React.ElementType<MessageUIComponentProps>;
  Attachment?: React.ElementType<AttachmentProps>;
  // multipleUploads: this.props.multipleUploads,
  // acceptedFiles: this.props.acceptedFiles,
  maxNumberOfFiles?: number;
  sendMessage?(message: Client.Message): void;

  loadMore?(): void;
  // thread related
  closeThread?(event: React.SyntheticEvent): void;
  loadMoreThread?(): void;

  /** Via Context: The channel object */
  channel?: Client.StreamChat;

  /** Via Context: The function to update a message, handled by the Channel component */
  updateMessage?(
    updatedMessage: Client.MessageResponse,
    extraState: object,
  ): void;
  removeMessage?(updatedMessage: Client.MessageResponse): void;
  openThread?(
    message: Client.MessageResponse,
    event: React.SyntheticEvent,
  ): void;

  /** Function executed when user clicks on link to open thread */
  retrySendMessage?(message: Client.Message): void;

  /** Via Context: The function is called when the list scrolls */
  listenToScroll?(offset: number): void;

  /** Function to be called when a @mention is clicked. Function has access to the DOM event and the target user object */
  onMentionsClick?(e: React.MouseEvent, user: Client.UserResponse): void;
  /** Function to be called when hovering over a @mention. Function has access to the DOM event and the target user object */
  onMentionsHover?(e: React.MouseEvent, user: Client.UserResponse): void;
}

export type Theme =
  | 'messaging light'
  | 'messaging dark'
  | 'team light'
  | 'team dark'
  | 'commerce light'
  | 'commerce dark'
  | 'gaming light'
  | 'gaming dark'
  | 'livestream light'
  | 'livestream dark';

export interface ChatProps {
  client: Client.StreamChat;
  theme?: Theme;
}

interface ChannelProps {
  /** Which channel to connect to, will initialize the channel if it's not initialized yet */
  channel?: Client.Channel;
  /** Client is passed automatically via the Chat Context */
  client?: Client.StreamChat;
  /** The loading indicator to use */
  LoadingIndicator?: React.ElementType<LoadingIndicatorProps>;
  Message?: React.ElementType<MessageUIComponentProps>;
  Attachment?: React.ElementType;

  /** Function to be called when a @mention is clicked. Function has access to the DOM event and the target user object */
  onMentionsClick?(e: React.MouseEvent, user: Client.UserResponse): void;
  /** Function to be called when hovering over a @mention. Function has access to the DOM event and the target user object */
  onMentionsHover?(e: React.MouseEvent, user: Client.UserResponse): void;
  reactionCounts?: Object;
}

interface ChannelListProps extends ChatContext {
  /** The Preview to use, defaults to ChannelPreviewLastMessage */
  Preview?: React.ElementType<ChannelPreviewUIComponentProps>;

  /** The loading indicator to use */
  LoadingIndicator?: React.ElementType<LoadingIndicatorProps>;
  List?: React.ElementType<ChannelListUIComponentProps>;
  Paginator?: React.ElementType<PaginatorProps>;

  /** Function that overrides default behaviour when users gets added to a channel */
  onAddedToChannel?(e: Client.Event): any;
  /** Function that overrides default behaviour when users gets removed from a channel */
  onRemovedFromChannel?(e: Client.Event): any;

  // TODO: Create proper interface for followings in chat js client.
  /** Object containing query filters */
  filters: object;
  /** Object containing query options */
  options?: object;
  /** Object containing sort parameters */
  sort?: object;
}

interface ChannelListUIComponentProps {
  /** If channel list ran into error */
  error: boolean;
  /** If channel list is in loading state */
  loading: boolean;
}

interface ChannelPreviewProps {
  channel: Client.StreamChat;
  activeChannel: Client.StreamChat;
  closeMenu(): void;
  Preview: React.ElementType<ChannelPreviewUIComponentProps>;
  setActiveChannel(channel: Client.StreamChat): void;
  key: string;
  connectionRecoveredCount: number;
}

interface ChannelPreviewUIComponentProps extends ChannelPreviewProps {
  latestMessage: string;
  active: boolean;

  /** Following props are coming from state of ChannelPreview */
  unread: number;
  lastMessage: Client.MessageResponse;
  lastRead: Date;
}

interface PaginatorProps {
  /** callback to load the next page */
  loadNextPage(): void;
  hasNextPage?: boolean;
  /** indicates if there there's currently any refreshing taking place */
  refreshing?: boolean;
}

interface LoadMorePaginatorProps extends PaginatorProps {
  /** display the items in opposite order */
  reverse: boolean;
  LoadMoreButton: React.ElementType;
}

interface InfiniteScrollPaginatorProps extends PaginatorProps {
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
  [any]: any;
}

interface AvatarProps {
  /** image url */
  image?: string;
  /** name of the picture, used for title tag fallback */
  name?: string;
  /** shape of the avatar, circle, rounded or square */
  shape?: 'circle' | 'rounded' | 'square';
  /** size in pixels */
  size?: number;
}

interface DateSeparatorProps {
  /** The date to format */
  date: Date;
  /** Set the position of the date in the separator */
  position?: 'left';
  center;
  right;
  /** Override the default formatting of the date. This is a function that has access to the original date object. Returns a string or Node  */
  formatDate?(date: Date): string;
}

interface MessageListProps extends ChannelContext {
  /** Date separator component to render  */
  dateSeparator?: React.ElementType<DateSeparatorProps>;
  /** The attachment component to render, defaults to Attachment */
  Attachment?: React.ElementType<AttachmentProps>;
  /** Typing indicator component to render  */
  TypingIndicator?: React.ElementType<TypingIndicatorProps>;
  /** Turn off grouping of messages by user */
  noGroupByUser?: boolean;
  /** Weather its a thread of no. Default - false  */
  threadList?: boolean;
  /** render HTML instead of markdown. Posting HTML is only allowed server-side */
  unsafeHTML?: boolean;
}

interface ChannelHeaderProps extends ChannelContext {
  /** Set title manually */
  title?: string;
  /** Show a little indicator that the channel is live right now */
  live?: boolean;
}

interface MessageInputProps {
  /** Set focus to the text input if this is enabled */
  focus?: boolean;
  /** Disable input */
  disabled?: boolean;
  /** Grow the textarea while you're typing */
  grow?: boolean;

  /** The parent message object when replying on a thread */
  parent?: Client.MessageResponse | null;

  /** The component handling how the input is rendered */
  Input?: React.ElementType<MessageInputUIComponentProps>;

  /** Override image upload request */
  doImageUploadRequest?(file: object, channel: Client.Channel): void;

  /** Override file upload request */
  doFileUploadRequest?(file: object, channel: Client.Channel): void;
}

type ImageUpload = {
  id: string;
  url: string;
  state: 'finished' | 'failed' | 'uploading';
  file: { name: string };
};

type FileUpload = {
  id: string;
  url: string;
  state: 'finished' | 'failed' | 'uploading';
  file: {
    name: string;
    type: string;
    size: string;
  };
};

interface MessageInputState {
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
interface MessageInputUIComponentProps
  extends MessageInputProps,
    MessageInputState {
  /**
   * ======================================================================
   *     Props provided by parent MessageInput component
   * ======================================================================
   */

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
  onSelectItem?(item: { id: string }): void;
  openEmojiPicker?(): void;
}

interface AttachmentProps {
  /** The attachment to render */
  attachment: Client.Attachment;
  /**
		The handler function to call when an action is selected on an attachment.
		Examples include canceling a \/giphy command or shuffling the results.
		*/
  actionHandler(): void;
}

interface MessageProps {
  /** The message object */
  message: Client.MessageResponse;
  /** The client connection object for connecting to Stream */
  client: Client.StreamChat;
  /** The current channel this message is displayed in */
  channel: Client.Channel;
  /** A list of users that have read this message **/
  readBy: Array<Client.UserResponse>;
  /** groupStyles, a list of styles to apply to this message. ie. top, bottom, single etc */
  groupStyles: Array<string>;
  /** Editing, if the message is currently being edited */
  editing: boolean;
  /** The message rendering component, the Message component delegates its rendering logic to this component */
  Message: React.ElementType<MessageUIComponentProps>;
  /** Allows you to overwrite the attachment component */
  Attachment: React.ElementType<AttachmentProps>;
  /** render HTML instead of markdown. Posting HTML is only allowed server-side */
  unsafeHTML: boolean;
}

interface MessageUIComponentProps extends MessageProps {
  actionsEnabled: boolean;
  handleReaction(reactionType: string, event?: React.BaseSyntheticEvent): void;
  handleFlag(event?: React.BaseSyntheticEvent): void;
  handleMute(event?: React.BaseSyntheticEvent): void;
  handleAction(
    name: string,
    value: string,
    event: React.BaseSyntheticEvent,
  ): void;
  handleRetry(message: Client.Message): void;
  isMyMessage(message: Client.MessageResponse): boolean;
  openThread(
    message: Client.MessageResponse,
    event: React.BaseSyntheticEvent,
  ): void;
  onMentionsClickMessage(
    event: React.MouseEvent,
    user: Client.UserResponse,
  ): void;
  onMentionsHoverMessage(
    event: React.MouseEvent,
    user: Client.UserResponse,
  ): void;
  // TODO: Create proper type for following config
  channelConfig: object;
}

interface ThreadProps {
  /** Channel is passed via the Channel Context */
  channel?: Client.Channel;
  /** the thread (the parent message object) */
  thread?: Client.MessageResponse | boolean;

  /** The message component to use for rendering messages */
  Message?: React.ElementType<MessageUIComponentProps>;

  /** The list of messages to render, state is handled by the parent channel component */
  threadMessages?: Client.MessageResponse[];

  /** loadMoreThread iss called when infinite scroll wants to load more messages */
  loadMoreThread?(): void;

  /** If there are more messages available, set to false when the end of pagination is reached */
  threadHasMore?: boolean;
  /** If the thread is currently loading more messages */
  threadLoadingMore?: boolean;
  /** Display the thread on 100% width of it's container. Useful for mobile style view */
  fullWidth?: boolean;
  /** Make input focus on mounting thread */
  autoFocus?: boolean;
}

interface TypingIndicatorProps {
  typing: [];
  client: Client.StreamChat;
}

interface WindowProps {
  /** show or hide the window when a thread is active */
  hideOnThread?: boolean;
  /** Flag if thread is open or not */
  thread?: boolean;
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

export class Attachment extends React.PureComponent<AttachmentProps> {}

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
export class Window extends React.PureComponent<WindowProps, any> {}
