import React, { useState } from 'react';

import './ChatContainer.scss';

import { CloseChatButton } from '../../assets';

type Props = {};

export const ChatContainer: React.FC<Props> = (props) => {
  const [isFullScreen, setIsFullScreen] = useState(false);

  return (
    <div className={`chat-container ${isFullScreen ? 'full-screen' : ''}`}>
      <CloseChatButton isFullScreen={isFullScreen} setIsFullScreen={setIsFullScreen} />
    </div>
  );
};
