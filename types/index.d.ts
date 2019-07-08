// TypeScript Version: 3.5
import * as React from 'react';
import * as Client from 'stream-chat';
import SeamlessImmutable from 'seamless-immutable';

export interface ChatProps {
  client: Client.StreamChat;
  theme?: Theme;
}

export type Theme = 'messaging light' | 'messaging dark';

interface ChannelProps {
  /** Which channel to connect to, will initialize the channel if it's not initialized yet */
  channel?: Client.Channel;
  /** Client is passed automatically via the Chat Context */
  client?: Client.StreamChat;
  /** The loading indicator to use */
  LoadingIndicator?: React.ElementType;
  Message?: React.ElementType;
  Attachment?: React.ElementType;

  /** Function to be called when a @mention is clicked. Function has access to the DOM event and the target user object */
  onMentionsClick?(e: React.MouseEvent, user: Client.User): void;
  /** Function to be called when hovering over a @mention. Function has access to the DOM event and the target user object */
  onMentionsHover?(e: React.MouseEvent, user: Client.User): void;
  reactionCounts?: Object;
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

interface MessageListProps {
  /** Date separator component to render  */
  dateSeparator?: React.ElementType;
  /** The attachment component to render, defaults to Attachment */
  Attachment?: React.ElementType;
  /** Typing indicator component to render  */
  TypingIndicator?: React.ElementType;
  /** Turn off grouping of messages by user */
  noGroupByUser?: boolean;
  /** Weather its a thread of no. Default - false  */
  threadList?: boolean;

  /**
   * =======================================
   *    Props provided by Channel component
   * =======================================
   */
  /** A list of immutable messages */
  messages?: Client.Message[];
  /** render HTML instead of markdown. Posting HTML is only allowed server-side */
  unsafeHTML?: boolean;
  Message?: React.ElementType;
  /**
   * =====================================
   *     Props available via context
   * =====================================
   */

  /** Via Context: The channel object */
  channel?: Client.StreamChat;
  /** Via Context: The function to update a message, handled by the Channel component */
  updateMessage?(updatedMessage: Client.Message, extraState: object): void;
  removeMessage?(updatedMessage: Client.Message): void;
  openThread?(message: Client.Message, event: React.SyntheticEvent): void;
  /** Function executed when user clicks on link to open thread */
  retrySendMessage?(message: Client.Message): void;
  /** Via Context: The function is called when the list scrolls */
  listenToScroll?(offset: number): void;
  /** Function to be called when a @mention is clicked. Function has access to the DOM event and the target user object */
  onMentionsClick?(e: React.MouseEvent, user: Client.User): void;
  /** Function to be called when hovering over a @mention. Function has access to the DOM event and the target user object */
  onMentionsHover?(e: React.MouseEvent, user: Client.User): void;
}

interface ChannelHeaderProps {
  /** Set title manually */
  title?: string;
  /** Show a little indicator that the channel is live right now */
  live?: boolean;

  /**
   * ===================================
   *     Props available via context
   * ===================================
   */

  // the channel to render */
  channel?: Client.Channel;
  // the number of users watching users
  watcher_count?: Number;
}

interface MessageInputProps {
  /** Set focus to the text input if this is enabled */
  focus?: boolean;
  /** Disable input */
  disabled?: boolean;
  /** Grow the textarea while you're typing */
  grow?: boolean;

  /** The parent message object when replying on a thread */
  parent?: Client.Message | null;

  /** The component handling how the input is rendered */
  Input?: React.ElementType;

  /** Override image upload request */
  doImageUploadRequest?(file: object, channel: Client.Channel): void;

  /** Override file upload request */
  doFileUploadRequest?(file: object, channel: Client.Channel): void;

  /**
   * ===================================
   *     Props available via context
   * ===================================
   */

  /** Via Context: the channel that we're sending the message to */
  channel?: Client.Channel;
  /** Via Context: the users currently typing, passed from the Channel component */
  typing?: Object;
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

interface MessageInputUIComponentProps extends MessageInputProps {
  /** Set focus to the text input if this is enabled */
  focus?: boolean;
  /** Disable input */
  disabled?: boolean;
  /** Grow the textarea while you're typing */
  grow?: boolean;

  /**
   * ======================================================================
   *     Props provided by parent MessageInput component
   * ======================================================================
   */

  // TODO: Create file interface
  uploadNewFiles?(files: []): void;
  removeImage?(id: string): void;
  uploadImage?(id: string): void;
  removeFile?(id: string): void;
  uploadFile?(id: string): void;
  emojiPickerRef?: React.RefObject<any>;
  panelRef?: React.RefObject<any>;
  textareaRef?: React.RefObject<any>;
  onSelectEmoji?(emoji: object): void;
  getUsers?(): Client.User[];
  getCommands?: [];
  handleSubmit?(event: React.FormEvent): void;
  handleChange?(event: React.ChangeEventHandler): void;
  onPaste?(event: React.ClipboardEventHandler): void;
  onSelectItem?(item: { id: string }): void;
  openEmojiPicker?(): void;

  /**
   * =============================================================================
   *     Props provided by parent MessageInput component via its state object
   * =============================================================================
   */
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

interface AttachmentProps {
  /** The attachment to render */
  attachment: Client.Attachment;
  /**
		The handler function to call when an action is selected on an attachment.
		Examples include canceling a \/giphy command or shuffling the results.
		*/
  actionHandler(): void;
}
interface ChannelListProps {
  /** The Preview to use, defaults to ChannelPreviewLastMessage */
  Preview?: React.ElementType;

  /** The loading indicator to use */
  LoadingIndicator?: React.ElementType;
  List?: React.ElementType;
  Paginator?: React.ElementType;

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

interface ChannelListMessengerProps {
  /** The loading indicator to use */
  LoadingIndicator: React.ElementType;
  /** If channel list ran into error */
  error: boolean;
  /** If channel list is in loading state */
  loading: boolean;
}

interface ChannelListTeamProps {
  /** The loading indicator to use */
  LoadingIndicator: React.ElementType;
  /** If channel list ran into error */
  error: boolean;
  /** If channel list is in loading state */
  loading: boolean;
}

interface ChannelPreviewProps {
  channel: Client.StreamChat;
  activeChannel: Client.StreamChat;
  closeMenu(): void;
  Preview: React.ElementType;
  setActiveChannel(channel: Client.StreamChat): void;
  key: string;
  connectionRecoveredCount: number;
}

interface ChannelPreviewUIComponentProps extends ChannelPreviewProps {
  unread: number;
  lastMessage: Client.Message;
  lastRead: Date;
  latestMessage: string;
  active: boolean;
}

interface PaginatorProps {
  /** callback to load the next page */
  loadNextPage: () => void;
  /** indicates if there there's currently any refreshing taking place */
  refreshing: boolean;
}

interface LoadMorePaginatorProps extends PaginatorProps {
  LoadMoreButton: React.ElementType;
}

interface InfiniteScrollPaginatorProps extends PaginatorProps {
  /** callback to load the next page */
  loadNextPage(): void;
  /** indicates if there there's currently any refreshing taking place */
  refreshing: boolean;
  /** indicates if there is a next page to load */
  hasNextPage: boolean;
  /** display the items in opposite order */
  reverse: boolean;
  /** Offset from when to start the loadNextPage call */
  threshold: number;
  /** The loading indicator to use */
  LoadingIndicator: React.ElementType;
}

interface LoadingIndicatorProps {
  /** The size of the loading icon */
  size: number;
  /** Set the color of the LoadingIndicator */
  color: string;
}

interface MessageProps {
  /** The message object */
  message: Client.Message;
  /** The client connection object for connecting to Stream */
  client: Client.StreamChat;
  /** The current channel this message is displayed in */
  channel: Client.Channel;
  /** A list of users that have read this message **/
  readBy: Array<Client.User>;
  /** groupStyles, a list of styles to apply to this message. ie. top, bottom, single etc */
  groupStyles: Array<string>;
  /** Editing, if the message is currently being edited */
  editing: boolean;
  /** The message rendering component, the Message component delegates its rendering logic to this component */
  Message: React.ElementType;
  /** Allows you to overwrite the attachment component */
  Attachment: React.ElementType;
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
  isMyMessage(message: Client.Message): boolean;
  openThread(message: Client.Message, event: React.BaseSyntheticEvent): void;
  onMentionsClickMessage(event: React.MouseEvent, user: Client.User): void;
  onMentionsHoverMessage(event: React.MouseEvent, user: Client.User): void;
  // TODO: Create proper type for following config
  channelConfig: object;
}

interface ThreadProps {
  /** Channel is passed via the Channel Context */
  channel?: Client.Channel;
  /** the thread (the parent message object) */
  thread?: Client.Message | boolean;

  /** The message component to use for rendering messages */
  Message?: React.ElementType;

  /** The list of messages to render, state is handled by the parent channel component */
  threadMessages?: Client.Message[];

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

export class Attachment extends React.PureComponent<AttachmentProps, any> {}

export class ChannelList extends React.PureComponent<ChannelListProps, any> {}
export class ChannelListMessenger extends React.PureComponent<
  ChannelListMessengerProps,
  any
> {}
export class ChannelListTeam extends React.PureComponent<
  ChannelListTeamProps,
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
