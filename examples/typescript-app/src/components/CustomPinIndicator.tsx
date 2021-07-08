import React from 'react';

import type { PinIndicatorProps } from 'stream-chat-react';

import './customPinIndicator.css';

export const CustomPinIndicator = (props: PinIndicatorProps) => {
  const { message } = props;

  if (!message) return null;

  return (
    <div className='pin-wrapper'>
      <div className='pin-text'>pinned</div>
    </div>
  );
};
