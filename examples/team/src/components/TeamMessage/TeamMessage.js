import React, { useState } from 'react';
import { MessageTeam } from 'stream-chat-react';

import './TeamMessage.css';

import { PinIconSmall } from '../../assets';

export const TeamMessage = (props) => {
  const { message, pinnedMessages, setPinnedMessages } = props;

  const messages = Object.values(pinnedMessages);
  const isMessagePinned = messages.find((pin) => pin.id === message.id);

  const [isPinned, setIsPinned] = useState(isMessagePinned);

  const handleFlag = () => {
    setPinnedMessages((prevState) => {
      setIsPinned(true);
      return {
        ...prevState,
        [message.id]: message,
      };
    });
  };

  const getMessageActions = () => {
    if (props.isMyMessage()) {
      return ['edit', 'delete', 'react', 'reply', 'flag'];
    }
    return ['react', 'reply', 'flag', 'mute'];
  };

  return (
    <div className={isPinned && 'pinned-message'}>
      {isPinned && (
        <div className="pin-icon__wrapper">
          <PinIconSmall />
          <p className="pin-icon__text">Pinned</p>
        </div>
      )}
      <MessageTeam {...props} {...{ handleFlag, getMessageActions }} />
      {/** potentially add replies component here */}
    </div>
  );
};
