import React, { PropsWithChildren, useContext } from 'react';

import type {
  Data as EmojiMartData,
  NimbleEmojiIndex,
  NimbleEmojiProps,
  NimblePickerProps,
} from 'emoji-mart';
import type {
  Attachment,
  Channel,
  MessageResponse,
  Mute,
  ChannelState as StreamChannelState,
  StreamChat,
  UpdatedMessage,
  UpdateMessageAPIResponse,
  UserResponse,
} from 'stream-chat';

import type { AttachmentProps } from '../components/Attachment/Attachment';
import type { ChannelStateReducerAction } from '../components/Channel/channelState';
import type { MessageUIComponentProps } from '../components/Message/types';

import type {
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
  UnknownType,
} from '../../types/types';

export type CommonEmoji = {
  custom: boolean;
  emoticons: [];
  short_names: [];
};

export type EmojiSetDef = {
  sheetColumns: number;
  sheetRows: number;
  sheetSize: number;
  size: number;
  spriteUrl: string;
};

export type MinimalEmoji = CommonEmoji &
  EmojiSetDef & {
    colons: string;
    id: string;
    name: string;
    sheet_x: number;
    sheet_y: number;
  };

export type EmojiConfig = {
  commonEmoji: CommonEmoji;
  defaultMinimalEmojis: MinimalEmoji[];
  Emoji: React.ComponentType<NimbleEmojiProps>;
  emojiData: EmojiMartData;
  EmojiIndex: NimbleEmojiIndex;
  EmojiPicker: React.ComponentType<NimblePickerProps>;
  emojiSetDef: EmojiSetDef;
};

export type MessageAttachments<
  At extends UnknownType = DefaultAttachmentType
> = Array<Attachment<At> & { file_size?: number; mime_type?: string }>;

export type MessageToSend<
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
> = {
  attachments?: MessageAttachments<At>;
  id?: string;
  mentioned_users?: string[];
  parent?: MessageResponse<At, Ch, Co, Me, Re, Us>;
  text?: string;
};

export type RetrySendMessage<
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
> = (message: StreamMessage<At, Ch, Co, Ev, Me, Re, Us>) => Promise<void>;

export type StreamMessage<
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
> =
  | ReturnType<StreamChannelState<At, Ch, Co, Ev, Me, Re, Us>['formatMessage']>
  | MessageResponse<At, Ch, Co, Me, Re, Us>;

export type ChannelState<
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
> = {
  error?: Error | null;
  hasMore?: boolean;
  loading?: boolean;
  loadingMore?: boolean;
  members?: StreamChannelState<At, Ch, Co, Ev, Me, Re, Us>['members'];
  messages?: StreamMessage<At, Ch, Co, Ev, Me, Re, Us>[];
  pinnedMessages?: StreamMessage<At, Ch, Co, Ev, Me, Re, Us>[];
  read?: StreamChannelState<At, Ch, Co, Ev, Me, Re, Us>['read'];
  thread?: StreamMessage<At, Ch, Co, Ev, Me, Re, Us> | null;
  threadHasMore?: boolean;
  threadLoadingMore?: boolean;
  threadMessages?: StreamMessage<At, Ch, Co, Ev, Me, Re, Us>[];
  typing?: StreamChannelState<At, Ch, Co, Ev, Me, Re, Us>['typing'];
  watcherCount?: number;
  watchers?: StreamChannelState<At, Ch, Co, Ev, Me, Re, Us>['watchers'];
};

export type ChannelContextValue<
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
> = ChannelState<At, Ch, Co, Ev, Me, Re, Us> & {
  client: StreamChat<At, Ch, Co, Ev, Me, Re, Us>;
  acceptedFiles?: string[];
  Attachment?: React.ComponentType<AttachmentProps<At>>;
  channel?: Channel<At, Ch, Co, Ev, Me, Re, Us>;
  closeThread?: (event: React.SyntheticEvent) => void;
  dispatch?: React.Dispatch<
    ChannelStateReducerAction<At, Ch, Co, Ev, Me, Re, Us>
  >;
  editMessage?: (
    message: UpdatedMessage<At, Ch, Co, Me, Re, Us>,
  ) => Promise<UpdateMessageAPIResponse<At, Ch, Co, Me, Re, Us> | void>;
  emojiConfig?: EmojiConfig;
  loadMore?: (limit: number) => Promise<number>;
  loadMoreThread?: () => Promise<void>;
  maxNumberOfFiles?: number;
  Message?: React.ComponentType<
    MessageUIComponentProps<At, Ch, Co, Ev, Me, Re, Us>
  >;
  multipleUploads?: boolean;
  mutes?: Mute<Us>[];
  onMentionsClick?: (
    event: React.MouseEvent<HTMLElement>,
    user: UserResponse<Us>[],
  ) => void;
  onMentionsHover?: (
    event: React.MouseEvent<HTMLElement>,
    user: UserResponse<Us>[],
  ) => void;
  openThread?: (
    message: StreamMessage<At, Ch, Co, Ev, Me, Re, Us>,
    event: React.SyntheticEvent,
  ) => void;
  removeMessage?: (message: StreamMessage<At, Ch, Co, Ev, Me, Re, Us>) => void;
  retrySendMessage?: RetrySendMessage<At, Ch, Co, Ev, Me, Re, Us>;
  sendMessage?: (
    message: MessageToSend<At, Ch, Co, Me, Re, Us>,
  ) => Promise<void>;
  updateMessage?: (message: StreamMessage<At, Ch, Co, Ev, Me, Re, Us>) => void;
  watcher_count?: number;
};

export const ChannelContext = React.createContext<ChannelContextValue>(
  {} as ChannelContextValue,
);

export const ChannelProvider = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>({
  children,
  value,
}: PropsWithChildren<{
  value: ChannelContextValue<At, Ch, Co, Ev, Me, Re, Us>;
}>) => (
  <ChannelContext.Provider value={(value as unknown) as ChannelContextValue}>
    {children}
  </ChannelContext.Provider>
);

export const useChannelContext = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>() =>
  (useContext(ChannelContext) as unknown) as ChannelContextValue<
    At,
    Ch,
    Co,
    Ev,
    Me,
    Re,
    Us
  >;

/**
 * Typescript currently does not support partial inference, so if ChannelContext
 * typing is desired while using the HOC withChannelContext, the Props for the
 * wrapped component must be provided as the first generic.
 */
export const withChannelContext = <
  P extends UnknownType,
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>(
  Component: React.ComponentType<P>,
): React.FC<Omit<P, keyof ChannelContextValue<At, Ch, Co, Ev, Me, Re, Us>>> => {
  const WithChannelContextComponent = (
    props: Omit<P, keyof ChannelContextValue<At, Ch, Co, Ev, Me, Re, Us>>,
  ) => {
    const channelContext = useChannelContext<At, Ch, Co, Ev, Me, Re, Us>();

    return <Component {...(props as P)} {...channelContext} />;
  };

  WithChannelContextComponent.displayName = (
    Component.displayName ||
    Component.name ||
    'Component'
  ).replace('Base', '');

  return WithChannelContextComponent;
};
