import React from 'react';

import { useOpenThreadHandler, useUserRole } from './hooks';
import { ReactionIcon, ThreadIcon } from './icons';
import { MESSAGE_ACTIONS } from './utils';

import { MessageActions } from '../MessageActions';

import { useChannelContext } from '../../context/ChannelContext';

import type { MessageUIComponentProps, MouseEventHandler } from './types';

import type {
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
} from '../../../types/types';

export type MessageOptionsProps<
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends DefaultChannelType = DefaultChannelType,
  Co extends DefaultCommandType = DefaultCommandType,
  Ev extends DefaultEventType = DefaultEventType,
  Me extends DefaultMessageType = DefaultMessageType,
  Re extends DefaultReactionType = DefaultReactionType,
  Us extends DefaultUserType<Us> = DefaultUserType
> = MessageUIComponentProps<At, Ch, Co, Ev, Me, Re, Us> & {
  onReactionListClick: MouseEventHandler;
  displayActions?: boolean;
  displayLeft?: boolean;
  displayReplies?: boolean;
  messageWrapperRef?: React.RefObject<HTMLDivElement>;
  theme?: string;
};

const UnMemoizedMessageOptions = <
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends DefaultChannelType = DefaultChannelType,
  Co extends DefaultCommandType = DefaultCommandType,
  Ev extends DefaultEventType = DefaultEventType,
  Me extends DefaultMessageType = DefaultMessageType,
  Re extends DefaultReactionType = DefaultReactionType,
  Us extends DefaultUserType<Us> = DefaultUserType
>(
  props: MessageOptionsProps<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const {
    displayActions = true,
    displayLeft = true,
    displayReplies = true,
    getMessageActions,
    handleOpenThread: propHandleOpenThread,
    initialMessage,
    message,
    messageWrapperRef,
    onReactionListClick,
    theme = 'simple',
    threadList,
  } = props;

  const { channel } = useChannelContext<At, Ch, Co, Ev, Me, Re, Us>();

  const handleOpenThread = useOpenThreadHandler(message);
  const { isMyMessage } = useUserRole(message);

  const channelConfig = channel?.getConfig?.();
  const messageActions = getMessageActions();

  const shouldShowReactions =
    messageActions.indexOf(MESSAGE_ACTIONS.react) > -1 && channelConfig && channelConfig.reactions;

  const shouldShowReplies =
    messageActions.indexOf(MESSAGE_ACTIONS.reply) > -1 &&
    displayReplies &&
    !threadList &&
    channelConfig &&
    channelConfig.replies;

  if (
    !message ||
    message.type === 'error' ||
    message.type === 'system' ||
    message.type === 'ephemeral' ||
    message.status === 'failed' ||
    message.status === 'sending' ||
    initialMessage
  ) {
    return null;
  }

  if (isMyMessage && displayLeft) {
    return (
      <div className={`str-chat__message-${theme}__actions`} data-testid='message-options-left'>
        {displayActions && <MessageActions {...props} messageWrapperRef={messageWrapperRef} />}
        {shouldShowReplies && (
          <div
            className={`str-chat__message-${theme}__actions__action str-chat__message-${theme}__actions__action--thread`}
            data-testid='thread-action'
            onClick={propHandleOpenThread || handleOpenThread}
          >
            <ThreadIcon />
          </div>
        )}
        {shouldShowReactions && (
          <div
            className={`str-chat__message-${theme}__actions__action str-chat__message-${theme}__actions__action--reactions`}
            data-testid='message-reaction-action'
            onClick={onReactionListClick}
          >
            <ReactionIcon />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`str-chat__message-${theme}__actions`} data-testid='message-options'>
      {shouldShowReactions && (
        <div
          className={`str-chat__message-${theme}__actions__action str-chat__message-${theme}__actions__action--reactions`}
          data-testid='message-reaction-action'
          onClick={onReactionListClick}
        >
          <ReactionIcon />
        </div>
      )}
      {shouldShowReplies && (
        <div
          className={`str-chat__message-${theme}__actions__action str-chat__message-${theme}__actions__action--thread`}
          data-testid='thread-action'
          onClick={propHandleOpenThread || handleOpenThread}
        >
          <ThreadIcon />
        </div>
      )}
      {displayActions && <MessageActions {...props} messageWrapperRef={messageWrapperRef} />}
    </div>
  );
};

export const MessageOptions = React.memo(
  UnMemoizedMessageOptions,
) as typeof UnMemoizedMessageOptions;
