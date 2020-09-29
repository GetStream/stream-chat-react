// @ts-check
import React, { useContext } from 'react';
import { useUserRole, useOpenThreadHandler } from './hooks';
import { ChannelContext } from '../../context';
import { MessageActions } from '../MessageActions';
import { MESSAGE_ACTIONS } from './utils';
import { ThreadIcon, ReactionIcon } from './icons';

/**
 * @type { React.FC<import('types').MessageOptionsProps> }
 */
const MessageOptionsComponent = (props) => {
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
  const { isMyMessage } = useUserRole(message);
  const handleOpenThread = useOpenThreadHandler(message);
  /**
   * @type {import('types').ChannelContextValue}
   */
  const { channel } = useContext(ChannelContext);
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
        data-testid="message-options-left"
        className={`str-chat__message-${theme}__actions`}
      >
        {<MessageActions {...props} messageWrapperRef={messageWrapperRef} />}
        {shouldShowReplies && (
          <div
            data-testid="thread-action"
            onClick={propHandleOpenThread || handleOpenThread}
            className={`str-chat__message-${theme}__actions__action str-chat__message-${theme}__actions__action--thread`}
          >
            <ThreadIcon />
          </div>
        )}
        {shouldShowReactions && (
          <div
            data-testid="message-reaction-action"
            className={`str-chat__message-${theme}__actions__action str-chat__message-${theme}__actions__action--reactions`}
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
      data-testid="message-options"
      className={`str-chat__message-${theme}__actions`}
    >
      {shouldShowReactions && (
        <div
          data-testid="message-reaction-action"
          className={`str-chat__message-${theme}__actions__action str-chat__message-${theme}__actions__action--reactions`}
          onClick={onReactionListClick}
        >
          <ReactionIcon />
        </div>
      )}
      {shouldShowReplies && (
        <div
          onClick={propHandleOpenThread || handleOpenThread}
          data-testid="thread-action"
          className={`str-chat__message-${theme}__actions__action str-chat__message-${theme}__actions__action--thread`}
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

export default React.memo(MessageOptionsComponent);
