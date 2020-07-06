// @ts-check
import React, { useContext } from 'react';
import { useUserRole, useOpenThreadHandler } from './hooks';
import { ChannelContext } from '../../context';
import { MessageActions } from '../MessageActions';

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
  const shouldShowReplies =
    displayReplies && !threadList && channelConfig && channelConfig.replies;
  const shouldShowReactions = channelConfig && channelConfig.reactions;
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
            className={`str-chat__message-${theme} str-chat__message-${theme}__actions__action--thread`}
          >
            <svg width="14" height="10" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M8.516 3c4.78 0 4.972 6.5 4.972 6.5-1.6-2.906-2.847-3.184-4.972-3.184v2.872L3.772 4.994 8.516.5V3zM.484 5l4.5-4.237v1.78L2.416 5l2.568 2.125v1.828L.484 5z"
                fillRule="evenodd"
              />
            </svg>
          </div>
        )}
        {shouldShowReactions && (
          <div
            data-testid="message-reaction-action"
            className={`str-chat__message-${theme}__actions__action str-chat__message-${theme}__actions__action--reactions`}
            onClick={onReactionListClick}
          >
            <svg
              width="16"
              height="14"
              viewBox="0 0 16 14"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M11.108 8.05a.496.496 0 0 1 .212.667C10.581 10.147 8.886 11 7 11c-1.933 0-3.673-.882-4.33-2.302a.497.497 0 0 1 .9-.417C4.068 9.357 5.446 10 7 10c1.519 0 2.869-.633 3.44-1.738a.495.495 0 0 1 .668-.212zm.792-1.826a.477.477 0 0 1-.119.692.541.541 0 0 1-.31.084.534.534 0 0 1-.428-.194c-.106-.138-.238-.306-.539-.306-.298 0-.431.168-.54.307A.534.534 0 0 1 9.538 7a.544.544 0 0 1-.31-.084.463.463 0 0 1-.117-.694c.33-.423.742-.722 1.394-.722.653 0 1.068.3 1.396.724zm-7 0a.477.477 0 0 1-.119.692.541.541 0 0 1-.31.084.534.534 0 0 1-.428-.194c-.106-.138-.238-.306-.539-.306-.299 0-.432.168-.54.307A.533.533 0 0 1 2.538 7a.544.544 0 0 1-.31-.084.463.463 0 0 1-.117-.694c.33-.423.742-.722 1.394-.722.653 0 1.068.3 1.396.724zM7 0a7 7 0 1 1 0 14A7 7 0 0 1 7 0zm4.243 11.243A5.96 5.96 0 0 0 13 7a5.96 5.96 0 0 0-1.757-4.243A5.96 5.96 0 0 0 7 1a5.96 5.96 0 0 0-4.243 1.757A5.96 5.96 0 0 0 1 7a5.96 5.96 0 0 0 1.757 4.243A5.96 5.96 0 0 0 7 13a5.96 5.96 0 0 0 4.243-1.757z"
                fillRule="evenodd"
              />
            </svg>
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
          <svg width="14" height="14" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M11.108 8.05a.496.496 0 0 1 .212.667C10.581 10.147 8.886 11 7 11c-1.933 0-3.673-.882-4.33-2.302a.497.497 0 0 1 .9-.417C4.068 9.357 5.446 10 7 10c1.519 0 2.869-.633 3.44-1.738a.495.495 0 0 1 .668-.212zm.792-1.826a.477.477 0 0 1-.119.692.541.541 0 0 1-.31.084.534.534 0 0 1-.428-.194c-.106-.138-.238-.306-.539-.306-.298 0-.431.168-.54.307A.534.534 0 0 1 9.538 7a.544.544 0 0 1-.31-.084.463.463 0 0 1-.117-.694c.33-.423.742-.722 1.394-.722.653 0 1.068.3 1.396.724zm-7 0a.477.477 0 0 1-.119.692.541.541 0 0 1-.31.084.534.534 0 0 1-.428-.194c-.106-.138-.238-.306-.539-.306-.299 0-.432.168-.54.307A.533.533 0 0 1 2.538 7a.544.544 0 0 1-.31-.084.463.463 0 0 1-.117-.694c.33-.423.742-.722 1.394-.722.653 0 1.068.3 1.396.724zM7 0a7 7 0 1 1 0 14A7 7 0 0 1 7 0zm4.243 11.243A5.96 5.96 0 0 0 13 7a5.96 5.96 0 0 0-1.757-4.243A5.96 5.96 0 0 0 7 1a5.96 5.96 0 0 0-4.243 1.757A5.96 5.96 0 0 0 1 7a5.96 5.96 0 0 0 1.757 4.243A5.96 5.96 0 0 0 7 13a5.96 5.96 0 0 0 4.243-1.757z"
              fillRule="evenodd"
            />
          </svg>
        </div>
      )}
      {shouldShowReplies && (
        <div
          onClick={propHandleOpenThread || handleOpenThread}
          data-testid="thread-action"
          className={`str-chat__message-${theme}__actions__action str-chat__message-${theme}__actions__action--thread`}
        >
          <svg width="14" height="10" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M8.516 3c4.78 0 4.972 6.5 4.972 6.5-1.6-2.906-2.847-3.184-4.972-3.184v2.872L3.772 4.994 8.516.5V3zM.484 5l4.5-4.237v1.78L2.416 5l2.568 2.125v1.828L.484 5z"
              fillRule="evenodd"
            />
          </svg>
        </div>
      )}
      {displayActions && (
        <MessageActions {...props} messageWrapperRef={messageWrapperRef} />
      )}
    </div>
  );
};

export const MessageOptions = React.memo(MessageOptionsComponent);
