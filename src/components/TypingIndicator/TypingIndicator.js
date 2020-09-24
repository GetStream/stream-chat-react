// @ts-check
import React, { useContext } from 'react';

import { ChannelContext } from '../../context';
import { Avatar } from '../Avatar';

/**
 * TypingIndicator lists users currently typing, it needs to be a child of Channel component
 * @typedef {import('types').TypingIndicatorProps} Props
 * @type {React.FC<Props>}
 */
const TypingIndicator = ({ avatarSize = 32 }) => {
  const { typing, client } = useContext(ChannelContext);

  if (!typing || !client) return null;

  const users = Object.values(typing).filter(
    ({ user }) => user?.id !== client.user?.id,
  );

  return (
    <div
      className={`str-chat__typing-indicator ${
        users.length ? 'str-chat__typing-indicator--typing' : ''
      }`}
    >
      <div className="str-chat__typing-indicator__avatars">
        {users.map(({ user }) => (
          <Avatar
            image={user?.image}
            size={avatarSize}
            name={user?.name || user?.id}
            key={user?.id}
          />
        ))}
      </div>
      <div className="str-chat__typing-indicator__dots">
        <span className="str-chat__typing-indicator__dot" />
        <span className="str-chat__typing-indicator__dot" />
        <span className="str-chat__typing-indicator__dot" />
      </div>
    </div>
  );
};

export default React.memo(TypingIndicator);
