import React, { useRef } from 'react';
import {
  Attachment,
  Avatar,
  messageHasReactions,
  MessageOptions,
  MessageRepliesCountButton,
  MessageStatus,
  MessageText,
  MessageTimestamp,
  ReactionSelector,
  SimpleReactionsList,
  useMessageContext,
} from 'stream-chat-react';

import './CustomMessage.scss';

export const CustomMessage = () => {
  const {
    showDetailedReactions,
    isReactionEnabled,
    message,
    reactionSelectorRef,
  } = useMessageContext();

  const messageWrapperRef = useRef<HTMLDivElement>(null);

  const hasReactions = messageHasReactions(message);

  return (
    <div className='message-wrapper'>
      <Avatar image={message.user?.image} />
      <div className='message-wrapper-content'>
        <MessageOptions messageWrapperRef={messageWrapperRef} />
        <div className='message-header'>
          <div className='message-header-name'>{message.user?.name}</div>
          <div className='message-header-timestamp'>
            <MessageTimestamp />
          </div>
        </div>
        {showDetailedReactions && isReactionEnabled && (
          <ReactionSelector ref={reactionSelectorRef} />
        )}
        <MessageText />
        <MessageStatus />
        {message.attachments && <Attachment attachments={message.attachments} />}
        {hasReactions && !showDetailedReactions && isReactionEnabled && <SimpleReactionsList />}
        <MessageRepliesCountButton reply_count={message.reply_count} />
      </div>
    </div>
  );
};
