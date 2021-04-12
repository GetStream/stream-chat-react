import React, { PropsWithChildren, useContext } from 'react';

import type { ChannelConfigWithInfo, Mute, UserResponse } from 'stream-chat';

import type { StreamMessage } from './ChannelStateContext';

import type { PinPermissions } from '../components/Message/hooks/usePinHandler';
import type { MessageActionsArray } from '../components/Message/utils';
import type { MessageInputProps } from '../components/MessageInput/MessageInput';
import type { GroupStyle } from '../components/MessageList/utils';

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

export type MessageContextValue<
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends DefaultChannelType = DefaultChannelType,
  Co extends DefaultCommandType = DefaultCommandType,
  Ev extends DefaultEventType = DefaultEventType,
  Me extends DefaultMessageType = DefaultMessageType,
  Re extends DefaultReactionType = DefaultReactionType,
  Us extends DefaultUserType<Us> = DefaultUserType
> = {
  actionsEnabled: boolean;
  clearEditingState: unknown;
  editing: boolean;
  getMessageActions: () => MessageActionsArray<string>;
  handleAction: unknown;
  handleDelete: unknown;
  handleEdit: unknown;
  handleFlag: unknown;
  handleMute: unknown;
  handleOpenThread: unknown;
  handlePin: unknown;
  handleReaction: unknown;
  handleRetry: unknown;
  isMyMessage: () => boolean;
  message: StreamMessage<At, Ch, Co, Ev, Me, Re, Us>;
  onMentionsClickMessage: unknown;
  onMentionsHoverMessage: unknown;
  onUserClick: unknown;
  onUserHover: unknown;
  setEditingState: unknown;
  additionalMessageInputProps?: MessageInputProps<At, Ch, Co, Ev, Me, Re, Us>;
  channelConfig?: ChannelConfigWithInfo<Co>;
  getFlagMessageErrorNotification?: (message: StreamMessage<At, Ch, Co, Ev, Me, Re, Us>) => string;
  getFlagMessageSuccessNotification?: (
    message: StreamMessage<At, Ch, Co, Ev, Me, Re, Us>,
  ) => string;
  getMuteUserErrorNotification?: (user: UserResponse<Us>) => string;
  getMuteUserSuccessNotification?: (user: UserResponse<Us>) => string;
  getPinMessageErrorNotification?: (message: StreamMessage<At, Ch, Co, Ev, Me, Re, Us>) => string;
  groupStyles?: GroupStyle[];
  lastReceivedId?: string | null;
  messageListRect?: DOMRect;
  mutes?: Mute<Us>[];
  pinPermissions?: PinPermissions;
  readBy?: UserResponse<Us>[];
  threadList?: boolean;
  unsafeHTML?: boolean;
};

export const MessageContext = React.createContext<MessageContextValue>({} as MessageContextValue);

export const MessageProvider = <
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends DefaultChannelType = DefaultChannelType,
  Co extends DefaultCommandType = DefaultCommandType,
  Ev extends DefaultEventType = DefaultEventType,
  Me extends DefaultMessageType = DefaultMessageType,
  Re extends DefaultReactionType = DefaultReactionType,
  Us extends DefaultUserType<Us> = DefaultUserType
>({
  children,
  value,
}: PropsWithChildren<{
  value: MessageContextValue<At, Ch, Co, Ev, Me, Re, Us>;
}>) => (
  <MessageContext.Provider value={(value as unknown) as MessageContextValue}>
    {children}
  </MessageContext.Provider>
);

export const useMessageContext = <
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends DefaultChannelType = DefaultChannelType,
  Co extends DefaultCommandType = DefaultCommandType,
  Ev extends DefaultEventType = DefaultEventType,
  Me extends DefaultMessageType = DefaultMessageType,
  Re extends DefaultReactionType = DefaultReactionType,
  Us extends DefaultUserType<Us> = DefaultUserType
>() => (useContext(MessageContext) as unknown) as MessageContextValue<At, Ch, Co, Ev, Me, Re, Us>;

/**
 * Typescript currently does not support partial inference, so if MessageContext
 * typing is desired while using the HOC withMessageContext, the Props for the
 * wrapped component must be provided as the first generic.
 */
export const withMessageContext = <
  P extends UnknownType,
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends DefaultChannelType = DefaultChannelType,
  Co extends DefaultCommandType = DefaultCommandType,
  Ev extends DefaultEventType = DefaultEventType,
  Me extends DefaultMessageType = DefaultMessageType,
  Re extends DefaultReactionType = DefaultReactionType,
  Us extends DefaultUserType<Us> = DefaultUserType
>(
  Component: React.ComponentType<P>,
): React.FC<Omit<P, keyof MessageContextValue<At, Ch, Co, Ev, Me, Re, Us>>> => {
  const WithMessageContextComponent = (
    props: Omit<P, keyof MessageContextValue<At, Ch, Co, Ev, Me, Re, Us>>,
  ) => {
    const messageContext = useMessageContext<At, Ch, Co, Ev, Me, Re, Us>();

    return <Component {...(props as P)} {...messageContext} />;
  };

  WithMessageContextComponent.displayName = (
    Component.displayName ||
    Component.name ||
    'Component'
  ).replace('Base', '');

  return WithMessageContextComponent;
};
