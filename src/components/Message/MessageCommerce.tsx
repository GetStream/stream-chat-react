import React, { useRef } from 'react';

import { MessageDeleted as DefaultMessageDeleted } from './MessageDeleted';
import { MessageOptions } from './MessageOptions';
import { MessageRepliesCountButton } from './MessageRepliesCountButton';
import { MessageText } from './MessageText';
import { MessageTimestamp } from './MessageTimestamp';
import { useReactionClick, useUserHandler } from './hooks';
import { areMessageUIPropsEqual, messageHasAttachments, messageHasReactions } from './utils';

import { Avatar as DefaultAvatar } from '../Avatar';
import { MML } from '../MML';
import {
  ReactionSelector as DefaultReactionSelector,
  ReactionsList as DefaultReactionsList,
} from '../Reactions';

import { useComponentContext } from '../../context/ComponentContext';
import { MessageContextValue, useMessageContext } from '../../context/MessageContext';

import type { MessageUIComponentProps, ReactEventHandler } from './types';

import type {
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
} from '../../../types/types';

type MessageCommerceWithContextProps<
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends DefaultChannelType = DefaultChannelType,
  Co extends DefaultCommandType = DefaultCommandType,
  Ev extends DefaultEventType = DefaultEventType,
  Me extends DefaultMessageType = DefaultMessageType,
  Re extends DefaultReactionType = DefaultReactionType,
  Us extends DefaultUserType<Us> = DefaultUserType
> = MessageContextValue<At, Ch, Co, Ev, Me, Re, Us> & {
  isReactionEnabled: boolean;
  onReactionListClick: ReactEventHandler;
  reactionSelectorRef: React.MutableRefObject<HTMLDivElement | null>;
  showDetailedReactions: boolean;
};

const MessageCommerceWithContext = <
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends DefaultChannelType = DefaultChannelType,
  Co extends DefaultCommandType = DefaultCommandType,
  Ev extends DefaultEventType = DefaultEventType,
  Me extends DefaultMessageType = DefaultMessageType,
  Re extends DefaultReactionType = DefaultReactionType,
  Us extends DefaultUserType<Us> = DefaultUserType
>(
  props: MessageCommerceWithContextProps<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const {
    formatDate,
    groupStyles,
    handleAction,
    handleOpenThread,
    handleReaction,
    isMyMessage,
    isReactionEnabled,
    message,
    onReactionListClick,
    onUserClick: propOnUserClick,
    onUserHover: propOnUserHover,
    reactionSelectorRef,
    showDetailedReactions,
    threadList,
  } = props;

  const {
    Attachment,
    Avatar = DefaultAvatar,
    MessageDeleted = DefaultMessageDeleted,
    ReactionSelector = DefaultReactionSelector,
    ReactionsList = DefaultReactionsList,
  } = useComponentContext<At, Ch, Co, Ev, Me, Re, Us>();

  const { onUserClick, onUserHover } = useUserHandler(message, {
    onUserClickHandler: propOnUserClick,
    onUserHoverHandler: propOnUserHover,
  });

  const hasAttachment = messageHasAttachments(message);
  const hasReactions = messageHasReactions(message);

  const firstGroupStyle = groupStyles ? groupStyles[0] : '';

  const messageClasses = `str-chat__message-commerce str-chat__message-commerce--${
    isMyMessage() ? 'right' : 'left'
  }`;

  if (message.deleted_at) {
    return <MessageDeleted message={message} />;
  }

  if (message.type === 'message.read' || message.type === 'message.date') {
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
          size={32}
        />
      )}
      <div className='str-chat__message-commerce-inner'>
        {message && !message.text && (
          <>
            {
              <MessageOptions
                {...props}
                displayActions={false}
                displayLeft={false}
                displayReplies={false}
                onReactionListClick={onReactionListClick}
                theme='commerce'
              />
            }
            {hasReactions && !showDetailedReactions && isReactionEnabled && (
              <ReactionsList
                onClick={onReactionListClick}
                own_reactions={message.own_reactions}
                reaction_counts={message.reaction_counts || undefined}
                reactions={message.latest_reactions}
              />
            )}
            {showDetailedReactions && isReactionEnabled && (
              <ReactionSelector
                detailedView
                handleReaction={handleReaction}
                latest_reactions={message.latest_reactions}
                own_reactions={message.own_reactions}
                reaction_counts={message.reaction_counts || undefined}
                ref={reactionSelectorRef}
                reverse={false}
              />
            )}
          </>
        )}
        {message.attachments && (
          <Attachment actionHandler={handleAction} attachments={message.attachments} />
        )}
        {message.mml && (
          <MML
            actionHandler={handleAction}
            align={isMyMessage() ? 'right' : 'left'}
            source={message.mml}
          />
        )}
        {message.text && (
          <MessageText
            {...props}
            customInnerClass='str-chat__message-commerce-text-inner'
            customOptionProps={{
              displayActions: false,
              displayLeft: false,
              displayReplies: false,
              theme: 'commerce',
            }}
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
          <MessageTimestamp
            customClass='str-chat__message-commerce-timestamp'
            format='LT'
            formatDate={formatDate}
            message={message}
          />
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
 * MessageCommerce - UI component that renders a message and receives functionality from the Message/MessageList components
 */
export const MessageCommerce = <
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends DefaultChannelType = DefaultChannelType,
  Co extends DefaultCommandType = DefaultCommandType,
  Ev extends DefaultEventType = DefaultEventType,
  Me extends DefaultMessageType = DefaultMessageType,
  Re extends DefaultReactionType = DefaultReactionType,
  Us extends DefaultUserType<Us> = DefaultUserType
>(
  props: MessageUIComponentProps<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const messageContext = useMessageContext<At, Ch, Co, Ev, Me, Re, Us>();

  const reactionSelectorRef = useRef<HTMLDivElement | null>(null);

  const message = props.message || messageContext.message;

  const { isReactionEnabled, onReactionListClick, showDetailedReactions } = useReactionClick(
    message,
    reactionSelectorRef,
  );

  return (
    <MemoizedMessageCommerce
      {...messageContext}
      isReactionEnabled={isReactionEnabled}
      onReactionListClick={onReactionListClick}
      reactionSelectorRef={reactionSelectorRef}
      showDetailedReactions={showDetailedReactions}
      {...props}
    />
  );
};
