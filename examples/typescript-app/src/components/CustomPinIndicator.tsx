import React from 'react';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { PinIndicatorProps } from 'stream-chat-react';

import './customPinIndicator.css';

export const CustomPinIndicator = (props: PinIndicatorProps) => {
  const { message, t } = props;
  console.log({ message });

  if (!message || !t) return null;

  return (
    <div className='pin-wrapper'>
      <h1>NEILBOI</h1>
    </div>
  );
};
