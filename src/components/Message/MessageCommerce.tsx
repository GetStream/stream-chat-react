import React from 'react';

import { MessageDeleted as DefaultMessageDeleted } from './MessageDeleted';
import { MessageOptions as DefaultMessageOptions } from './MessageOptions';
import { MessageRepliesCountButton as DefaultMessageRepliesCountButton } from './MessageRepliesCountButton';
import { MessageText } from './MessageText';
import { MessageTimestamp as DefaultMessageTimestamp } from './MessageTimestamp';
import { areMessageUIPropsEqual, messageHasAttachments, messageHasReactions } from './utils';

import { Avatar as DefaultAvatar } from '../Avatar';
import { CUSTOM_MESSAGE } from '../../constants/messageTypes';
import { MML } from '../MML';
import {
  ReactionSelector as DefaultReactionSelector,
  ReactionsList as DefaultReactionsList,
} from '../Reactions';

import { useComponentContext } from '../../context/ComponentContext';
import { MessageContextValue, useMessageContext } from '../../context/MessageContext';

import type { MessageUIComponentProps, ReactEventHandler } from './types';

import type { DefaultStreamChatGenerics } from '../../types/types';

type MessageCommerceWithContextProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
> = MessageContextValue<StreamChatGenerics> & {
  isReactionEnabled: boolean;
  onReactionListClick: ReactEventHandler;
  reactionSelectorRef: React.MutableRefObject<HTMLDivElement | null>;
  showDetailedReactions: boolean;
};

const MessageCommerceWithContext = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>(
  props: MessageCommerceWithContextProps<StreamChatGenerics>,
) => {
  const {
    groupStyles,
    handleAction,
    handleOpenThread,
    isMyMessage,
    isReactionEnabled,
    message,
    onUserClick,
    onUserHover,
    reactionSelectorRef,
    showDetailedReactions,
    threadList,
  } = props;

  const {
    Attachment,
    Avatar = DefaultAvatar,
    MessageDeleted = DefaultMessageDeleted,
    MessageRepliesCountButton = DefaultMessageRepliesCountButton,
    MessageOptions = DefaultMessageOptions,
    MessageTimestamp = DefaultMessageTimestamp,
    ReactionSelector = DefaultReactionSelector,
    ReactionsList = DefaultReactionsList,
  } = useComponentContext<StreamChatGenerics>('MessageCommerce');

  const hasAttachment = messageHasAttachments(message);
  const hasReactions = messageHasReactions(message);

  const firstGroupStyle = groupStyles ? groupStyles[0] : 'single';

  const messageClasses = `str-chat__message-commerce str-chat__message-commerce--${
    isMyMessage() ? 'right' : 'left'
  }`;

  if (message.deleted_at) {
    return <MessageDeleted message={message} />;
  }

  if (message.customType === CUSTOM_MESSAGE.date) {
    return null;
  }

  return (
    <div
      className={`
						${messageClasses}
						str-chat__message-commerce--${message.type}
						${message.text ? 'str-chat__message-commerce--has-text' : 'str-chat__message-commerce--has-no-text'}
						${hasAttachment ? 'str-chat__message-commerce--has-attachment' : ''}
            ${hasReactions && isReactionEnabled ? 'str-chat__message-commerce--with-reactions' : ''}
            ${`str-chat__message-commerce--${firstGroupStyle}`}
            ${message.pinned ? 'pinned-message' : ''}
					`.trim()}
      data-testid='message-commerce-wrapper'
      key={message.id}
    >
      {(firstGroupStyle === 'bottom' || firstGroupStyle === 'single') && (
        <Avatar
          image={message.user?.image}
          name={message.user?.name || message.user?.id}
          onClick={onUserClick}
          onMouseOver={onUserHover}
        />
      )}
      <div className='str-chat__message-commerce-inner'>
        <>
          {<MessageOptions displayLeft={false} displayReplies={false} theme='commerce' />}
          {hasReactions && !showDetailedReactions && isReactionEnabled && <ReactionsList />}
          {showDetailedReactions && isReactionEnabled && (
            <ReactionSelector ref={reactionSelectorRef} />
          )}
        </>
        {message.attachments?.length ? (
          <Attachment actionHandler={handleAction} attachments={message.attachments} />
        ) : null}
        {message.mml && (
          <MML
            actionHandler={handleAction}
            align={isMyMessage() ? 'right' : 'left'}
            source={message.mml}
          />
        )}
        {message.text && (
          <MessageText
            customInnerClass='str-chat__message-commerce-text-inner'
            customWrapperClass='str-chat__message-commerce-text'
            theme='commerce'
          />
        )}
        {!threadList && (
          <div className='str-chat__message-commerce-reply-button'>
            <MessageRepliesCountButton
              onClick={handleOpenThread}
              reply_count={message.reply_count}
            />
          </div>
        )}
        <div className='str-chat__message-commerce-data'>
          {!isMyMessage() ? (
            <span className='str-chat__message-commerce-name'>
              {message.user?.name || message.user?.id}
            </span>
          ) : null}
          <MessageTimestamp customClass='str-chat__message-commerce-timestamp' format='LT' />
        </div>
      </div>
    </div>
  );
};

const MemoizedMessageCommerce = React.memo(
  MessageCommerceWithContext,
  areMessageUIPropsEqual,
) as typeof MessageCommerceWithContext;

/**
 * @deprecated - This UI component will be removed in the next major release.
 *
 * UI component that renders a message and receives functionality from the Message/MessageList components
 */
export const MessageCommerce = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>(
  props: MessageUIComponentProps<StreamChatGenerics>,
) => {
  const messageContext = useMessageContext<StreamChatGenerics>('MessageCommerce');

  return <MemoizedMessageCommerce {...messageContext} {...props} />;
};
