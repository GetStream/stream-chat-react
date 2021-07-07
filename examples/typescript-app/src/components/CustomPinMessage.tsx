import React, { useRef } from 'react';
import {
  MessageOptions,
  MessageRepliesCountButton,
  MessageStatus,
  MessageText,
  ReactionSelector,
  useMessageContext,
} from 'stream-chat-react';

import './CustomPinMessage.css';

export const CustomPinMessage = () => {
  const {
    message,
    showDetailedReactions,
    isReactionEnabled,
    reactionSelectorRef,
  } = useMessageContext();

  const messageWrapperRef = useRef<HTMLDivElement>(null);

  return (
    <div className='pin-message-wrapper'>
      <div className='pin-message-wrapper-content'>
        <div className='pin-message-header'>
          <div className='pin-message-header-name'>{message.user?.name || message.user?.id}</div>
        </div>
        {showDetailedReactions && isReactionEnabled && (
          <ReactionSelector ref={reactionSelectorRef} />
        )}
        <MessageText />
        <MessageStatus />
        <MessageRepliesCountButton reply_count={message.reply_count} />
      </div>
      <MessageOptions displayLeft={false} messageWrapperRef={messageWrapperRef} />
    </div>
  );
};
