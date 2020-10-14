import React, { useContext } from 'react';
import { ChannelContext } from 'stream-chat-react';
import './TeamTypingIndicator.css';

export const TeamTypingIndicator = () => {
  const { typing, client } = useContext(ChannelContext);

  if (!typing || !client) return null;

  const users = Object.values(typing)
    .filter(({ user }) => user?.id !== client.user?.id)
    .map(({ user }) => user.name || user.id);

  let text = '';

  if (users.length === 1) {
    text = `${users[0]} is typing`;
  } else if (users.length === 2) {
    text = `${users[0]} and ${users[1]} are typing`;
  } else if (users.length > 2) {
    text = `${users[0]} and ${users.length - 1} more are typing`;
  } else {
    text = '';
  }
  return (
    <div className="team__typing-indicator">
      {text && (
        <div className="dots">
          <span className="dot" />
          <span className="dot" />
          <span className="dot" />
        </div>
      )}
      <div>{text}</div>
    </div>
  );
};
