import React, { useContext } from 'react';
import { useOpenThreadHandler, useUserRole } from './hooks';
import { ChannelContext } from '../../context';
import { MessageActions } from '../MessageActions';
import { MESSAGE_ACTIONS } from './utils';
import { ReactionIcon, ThreadIcon } from './icons';

import type {
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
  UnknownType,
} from '../../../types/types';
import type { MessageOptionsProps } from 'types';

const UnMemoizedMessageOptions = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>(
  props: MessageOptionsProps<At, Ch, Co, Me, Re, Us>,
) => {
  const {
    displayActions = true,
    displayLeft = true,
    displayReplies = true,
    handleOpenThread: propHandleOpenThread,
    initialMessage,
    message,
    messageWrapperRef,
    onReactionListClick,
    theme = 'simple',
    threadList,
  } = props;
  const { channel } = useContext(ChannelContext);

  const handleOpenThread = useOpenThreadHandler(message);
  const { isMyMessage } = useUserRole(message);

  const channelConfig = channel?.getConfig();
  const messageActions = props.getMessageActions();
  const shouldShowReactions =
    messageActions.indexOf(MESSAGE_ACTIONS.react) > -1 &&
    channelConfig &&
    channelConfig.reactions;

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
      <div
        className={`str-chat__message-${theme}__actions`}
        data-testid='message-options-left'
      >
        {displayActions && (
          <MessageActions {...props} messageWrapperRef={messageWrapperRef} />
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
    <div
      className={`str-chat__message-${theme}__actions`}
      data-testid='message-options'
    >
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
      {displayActions && (
        <MessageActions {...props} messageWrapperRef={messageWrapperRef} />
      )}
    </div>
  );
};

export const MessageOptions = React.memo(UnMemoizedMessageOptions);
