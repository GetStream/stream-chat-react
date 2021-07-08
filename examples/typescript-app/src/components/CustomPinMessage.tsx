import React, { useRef } from 'react';
import { useState } from 'react';
import {
  MessageOptions,
  MessageRepliesCountButton,
  MessageStatus,
  MessageText,
  ReactionSelector,
  PinIndicator as DefaultPinIndicator,
  useMessageContext,
  useComponentContext,
} from 'stream-chat-react';

import './CustomPinMessage.css';

export const CustomPinMessage = () => {
  const [hovering, setHovering] = useState(false);

  const {
    message,
    showDetailedReactions,
    isReactionEnabled,
    reactionSelectorRef,
  } = useMessageContext();

  const { PinIndicator = DefaultPinIndicator } = useComponentContext();

  const messageWrapperRef = useRef<HTMLDivElement>(null);

  const { pinned } = message;

  return (
    <div
      className={pinned ? 'pinned-custom-message-wrapper' : 'custom-message-wrapper'}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      <div className='custom-message-wrapper-content'>
        <div className='custom-message-header'>
          <div className='custom-message-header-name'>{message.user?.name || message.user?.id}</div>
        </div>
        {showDetailedReactions && isReactionEnabled && (
          <ReactionSelector ref={reactionSelectorRef} />
        )}
        <MessageText />
        <MessageStatus />
        <MessageRepliesCountButton reply_count={message.reply_count} />
      </div>
      <div className='right-wrapper'>
        <MessageOptions messageWrapperRef={messageWrapperRef} />
      </div>
    </div>
  );
};
