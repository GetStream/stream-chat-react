import React from 'react';
import { SendArrow } from '../../assets/SendArrow';

import './MessageInput.scss';

export const MessageInput = () => {
  return (
    <div className='message-input-container'>
      <div className='message-input-input'></div>
      <div className='message-input-send'>
        <SendArrow />
        <div>269</div>
      </div>
    </div>
  );
};
