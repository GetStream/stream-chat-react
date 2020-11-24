import React from 'react';
import { MessageTeam } from 'stream-chat-react';

import './PinnedMessageList.css';

import { PinCloseIcon } from '../../assets';

export const PinnedMessageList = (props) => {
  const { pinnedMessages, setPinsOpen } = props;

  const messages = Object.values(pinnedMessages);

  return (
    <div className="pinned-messages__container">
      <div className="pinned-messages__header">
        <p className="pinned-messages__header-text">Pins</p>
        <PinCloseIcon {...{ setPinsOpen }} />
      </div>
      <div className="pinned-messages__list">
        {messages.map((message) => (
          <MessageTeam key={message.id} message={message} />
        ))}
      </div>
    </div>
  );
};
