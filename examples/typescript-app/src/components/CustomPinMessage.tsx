import React, { useRef } from 'react';
import {
  MessageOptions,
  MessageRepliesCountButton,
  MessageStatus,
  MessageText,
  useMessageContext,
} from 'stream-chat-react';

import './CustomPinMessage.css';

export const CustomPinMessage = () => {
  const { message } = useMessageContext();

  const messageWrapperRef = useRef<HTMLDivElement>(null);

  return (
    <div className='pin-message-wrapper'>
      <div className='pin-message-wrapper-content'>
        <MessageOptions displayLeft={true} messageWrapperRef={messageWrapperRef} />
        <div className='pin-message-header'>
          <div className='pin-message-header-name'>{message.user?.name}</div>
        </div>
        <MessageText />
        <MessageStatus />
        <MessageRepliesCountButton reply_count={message.reply_count} />
      </div>
    </div>
  );
};
