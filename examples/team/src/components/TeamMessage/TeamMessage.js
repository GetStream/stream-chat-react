import React, { useContext, useState } from 'react';
import { ChannelContext, ChatContext, MessageTeam } from 'stream-chat-react';

import './TeamMessage.css';

import { PinIconSmall } from '../../assets';

export const TeamMessage = (props) => {
  const { message, pinnedMessagesIds, setPinnedMessages, setPinsOpen } = props;

  const { openThread } = useContext(ChannelContext);
  const { client } = useContext(ChatContext);

  const isMessagePinned = pinnedMessagesIds?.find((id) => id === message.id);
  const [isPinned, setIsPinned] = useState(isMessagePinned);

  const handleFlag = async () => {
    if (isPinned) {
      setIsPinned(false);
      setPinnedMessages((prevState) => {
        const pinCopy = { ...prevState };
        delete pinCopy[message.id];
        return pinCopy;
      });
    } else {
      setIsPinned(true);
      setPinnedMessages((prevState) => ({
        ...prevState,
        [message.id]: message,
      }));
    }

    await client.updateMessage({ ...message, pinned: Math.random() });
  };

  const getMessageActions = () => {
    if (props.isMyMessage()) {
      return ['edit', 'delete', 'react', 'reply', 'flag'];
    }
    return ['react', 'reply', 'flag', 'mute'];
  };

  const handleOpenThread = () => {
    setPinsOpen(false);
    openThread(message);
  };

  return (
    <div className={isPinned ? 'pinned-message' : 'unpinned-message'}>
      {isPinned && (
        <div className="pin-icon__wrapper">
          <PinIconSmall />
          <p className="pin-icon__text">Pinned</p>
        </div>
      )}
      <MessageTeam
        {...props}
        {...{ handleFlag, handleOpenThread, getMessageActions }}
      />
      {/** potentially add replies component here */}
    </div>
  );
};
