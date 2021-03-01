import React, { useCallback } from 'react';

import { MessageSimple } from './MessageSimple';
import {
  PinPermissions,
  useActionHandler,
  useDeleteHandler,
  useEditHandler,
  useFlagHandler,
  useMentionsHandler,
  useMuteHandler,
  useOpenThreadHandler,
  usePinHandler,
  useReactionHandler,
  useRetryHandler,
  useUserHandler,
  useUserRole,
} from './hooks';
import {
  areMessagePropsEqual,
  defaultPinPermissions,
  getMessageActions,
  MESSAGE_ACTIONS,
} from './utils';

import { useChannelContext } from '../../context/ChannelContext';

import type { MessageResponse, StreamChat, UserResponse } from 'stream-chat';

import type { GroupStyle } from '../MessageList/MessageListInner';

import type {
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
  UnknownType,
} from '../../../types/types';

export type MessageProps<
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
> = {
  message: MessageResponse<At, Ch, Co, Me, Re, Us>;
  additionalMessageInputProps?: UnknownType; // TODO - add MessageInputProps when typed
  addNotification?: (text: string, type: 'success' | 'error') => void;
  client?: StreamChat<At, Ch, Co, Ev, Me, Re, Us>;
  groupStyles?: GroupStyle[];
  lastReceivedId?: string | null;
  readBy?: UserResponse<Us>[];
  threadList?: boolean;
};

// export interface MessageUIComponentProps<
//   At extends UnknownType = DefaultAttachmentType,
//   Ch extends UnknownType = DefaultChannelType,
//   Co extends string = DefaultCommandType,
//   Ev extends UnknownType = DefaultEventType,
//   Me extends UnknownType = DefaultMessageType,
//   Re extends UnknownType = DefaultReactionType,
//   Us extends UnknownType = DefaultUserType
// > extends MessageProps<At, Ch, Co, Ev, Me, Re, Us>,
//     TranslationContextValue {
//   actionsEnabled?: boolean;
//   editing?: boolean;
//   clearEditingState?(event?: React.BaseSyntheticEvent): void;
//   setEditingState?(event?: React.BaseSyntheticEvent): void;
//   handleReaction?(reactionType: string, event?: React.BaseSyntheticEvent): void;
//   handleEdit?(event?: React.BaseSyntheticEvent): void;
//   handleDelete?(event?: React.BaseSyntheticEvent): void;
//   handleFlag?(event?: React.BaseSyntheticEvent): void;
//   handleMute?(event?: React.BaseSyntheticEvent): void;
//   handlePin?(event?: React.BaseSyntheticEvent): void;
//   handleAction?(
//     name: string,
//     value: string,
//     event: React.BaseSyntheticEvent,
//   ): void;
//   handleRetry?(message: Client.Message<At, Me, Us>): void;
//   isMyMessage?(message: MessageResponse<At, Ch, Co, Me, Re, Us>): boolean;
//   isUserMuted?(): boolean;
//   handleOpenThread?(event: React.BaseSyntheticEvent): void;
//   mutes?: Client.Mute<Us>[];
//   onMentionsClickMessage?(event: React.MouseEvent): void;
//   onMentionsHoverMessage?(event: React.MouseEvent): void;
//   onUserClick?(e: React.MouseEvent): void;
//   onUserHover?(e: React.MouseEvent): void;
//   getMessageActions(): Array<string>;
//   channelConfig?: Client.ChannelConfig<Co> | Client.ChannelConfigWithInfo<Co>;
//   threadList?: boolean;
//   additionalMessageInputProps?: object;
//   initialMessage?: boolean;
//   EditMessageInput?: React.FC<MessageInputProps<At, Ch, Co, Ev, Me, Re, Us>>;
//   PinIndicator?: React.FC<PinIndicatorProps>;
// }

// export interface MessageComponentProps<
//   At extends UnknownType = DefaultAttachmentType,
//   Ch extends UnknownType = DefaultChannelType,
//   Co extends string = DefaultCommandType,
//   Ev extends UnknownType = DefaultEventType,
//   Me extends UnknownType = DefaultMessageType,
//   Re extends UnknownType = DefaultReactionType,
//   Us extends UnknownType = DefaultUserType
// > extends MessageProps<At, Ch, Co, Ev, Me, Re, Us>,
//     TranslationContextValue {
//   /** The current channel this message is displayed in */
//   channel?: Client.Channel<Ch>;
//   /** Function to be called when a @mention is clicked. Function has access to the DOM event and the target user object */
//   onMentionsClick?(
//     e: React.MouseEvent,
//     mentioned_users: UserResponse<Us>[],
//   ): void;
//   /** Function to be called when hovering over a @mention. Function has access to the DOM event and the target user object */
//   onMentionsHover?(
//     e: React.MouseEvent,
//     mentioned_users: UserResponse<Us>[],
//   ): void;
//   /** Function to be called when clicking the user that posted the message. Function has access to the DOM event and the target user object */
//   onUserClick?(e: React.MouseEvent, user: Client.User<Us>): void;
//   /** Function to be called when hovering the user that posted the message. Function has access to the DOM event and the target user object */
//   onUserHover?(e: React.MouseEvent, user: Client.User<Us>): void;
//   messageActions?: Array<string> | boolean;
//   members?: {
//     [user_id: string]: Client.ChannelMemberResponse<Us>;
//   };
//   retrySendMessage?(message: Client.Message<At, Me, Us>): Promise<void>;
//   removeMessage?(
//     updatedMessage: Client.MessageResponse<At, Ch, Co, Me, Re, Us>,
//   ): void;
//   mutes?: Client.Mute<Us>[];
//   openThread?(
//     message: Client.MessageResponse<At, Ch, Co, Me, Re, Us>,
//     event: React.SyntheticEvent,
//   ): void;
//   initialMessage?: boolean;
//   threadList?: boolean;
//   pinPermissions?: PinPermissions;
// }

/**
 * Message - A high level component which implements all the logic required for a message.
 * The actual rendering of the message is delegated via the "Message" property
 *
 * @example ./Message.md
 */
const UnMemoizedMessage = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>(
  props: MessageProps<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const {
    addNotification,
    channel: propChannel,
    formatDate,
    getFlagMessageErrorNotification,
    getFlagMessageSuccessNotification,
    getMuteUserErrorNotification,
    getMuteUserSuccessNotification,
    getPinMessageErrorNotification,
    groupStyles = [],
    Message: MessageUIComponent = MessageSimple,
    message,
    messageActions = Object.keys(MESSAGE_ACTIONS),
    onMentionsClick: propOnMentionsClick,
    onMentionsHover: propOnMentionsHover,
    onUserClick: propOnUserClick,
    onUserHover: propOnUserHover,
    openThread: propOpenThread,
    pinPermissions = defaultPinPermissions,
    retrySendMessage: propRetrySendMessage,
  } = props;

  const { channel: contextChannel } = useChannelContext<
    At,
    Ch,
    Co,
    Ev,
    Me,
    Re,
    Us
  >();

  const channel = propChannel || contextChannel;
  const channelConfig = channel?.getConfig && channel.getConfig();

  const handleAction = useActionHandler<At, Ch, Co, Ev, Me, Re, Us>(message);
  const handleDelete = useDeleteHandler<At, Ch, Co, Ev, Me, Re, Us>(message);
  const { clearEdit, editing, setEdit } = useEditHandler();

  const handleOpenThread = useOpenThreadHandler<At, Ch, Co, Ev, Me, Re, Us>(
    message,
    propOpenThread,
  );

  const handleReaction = useReactionHandler<At, Ch, Co, Ev, Me, Re, Us>(
    message,
  );

  const handleRetry = useRetryHandler<At, Ch, Co, Ev, Me, Re, Us>(
    propRetrySendMessage,
  );

  const handleFlag = useFlagHandler<At, Ch, Co, Ev, Me, Re, Us>(message, {
    getErrorNotification: getFlagMessageErrorNotification,
    getSuccessNotification: getFlagMessageSuccessNotification,
    notify: addNotification,
  });

  const handleMute = useMuteHandler<At, Ch, Co, Ev, Me, Re, Us>(message, {
    getErrorNotification: getMuteUserErrorNotification,
    getSuccessNotification: getMuteUserSuccessNotification,
    notify: addNotification,
  });

  const { onMentionsClick, onMentionsHover } = useMentionsHandler<
    At,
    Ch,
    Co,
    Ev,
    Me,
    Re,
    Us
  >(message, {
    onMentionsClick: propOnMentionsClick,
    onMentionsHover: propOnMentionsHover,
  });

  const { canPin, handlePin } = usePinHandler<At, Ch, Co, Ev, Me, Re, Us>(
    message,
    pinPermissions,
    {
      getErrorNotification: getPinMessageErrorNotification,
      notify: addNotification,
    },
  );

  const { onUserClick, onUserHover } = useUserHandler<At, Ch, Co, Me, Re, Us>(
    message,
    {
      onUserClickHandler: propOnUserClick,
      onUserHoverHandler: propOnUserHover,
    },
  );

  const { isAdmin, isModerator, isMyMessage, isOwner } = useUserRole<
    At,
    Ch,
    Co,
    Ev,
    Me,
    Re,
    Us
  >(message);

  const canEdit = isMyMessage || isModerator || isOwner || isAdmin;
  const canDelete = canEdit;
  const canReact = true;
  const canReply = true;

  const messageActionsHandler = useCallback(() => {
    if (!message || !messageActions) {
      return [];
    }

    return getMessageActions(messageActions, {
      canDelete,
      canEdit,
      canFlag: !isMyMessage,
      canMute: !isMyMessage && !!channelConfig?.mutes,
      canPin,
      canReact,
      canReply,
    });
  }, [
    canDelete,
    canEdit,
    canPin,
    canReply,
    canReact,
    channelConfig?.mutes,
    isMyMessage,
    message,
    messageActions,
  ]);

  const actionsEnabled =
    message && message.type === 'regular' && message.status === 'received';

  return (
    MessageUIComponent && (
      <MessageUIComponent
        {...props}
        actionsEnabled={actionsEnabled}
        //@ts-expect-error
        channelConfig={channelConfig}
        clearEditingState={clearEdit}
        editing={editing}
        formatDate={formatDate}
        getMessageActions={messageActionsHandler}
        groupStyles={groupStyles}
        handleAction={handleAction}
        handleDelete={handleDelete}
        handleEdit={setEdit}
        handleFlag={handleFlag}
        handleMute={handleMute}
        handleOpenThread={handleOpenThread}
        handlePin={handlePin}
        handleReaction={handleReaction}
        handleRetry={handleRetry}
        isMyMessage={() => isMyMessage}
        //@ts-expect-error
        Message={MessageUIComponent}
        onMentionsClickMessage={onMentionsClick}
        onMentionsHoverMessage={onMentionsHover}
        onUserClick={onUserClick}
        onUserHover={onUserHover}
        readBy={props.readBy || []}
        setEditingState={setEdit}
      />
    )
  );
};

export const Message = React.memo(
  UnMemoizedMessage,
  areMessagePropsEqual,
) as typeof UnMemoizedMessage;
