// @ts-check
import React, { useContext } from 'react';

import { ChannelContext } from '../../context';
import { Avatar as DefaultAvatar } from '../Avatar';

/**
 * TypingIndicator lists users currently typing, it needs to be a child of Channel component
 * @typedef {import('types').TypingIndicatorProps} Props
 * @type {React.FC<Props>}
 */
const TypingIndicator = ({
  Avatar = DefaultAvatar,
  avatarSize = 32,
  threadList,
}) => {
  const { typing, client, channel, thread } = useContext(ChannelContext);

  if (!typing || !client || channel?.getConfig()?.typing_events === false)
    return null;

  const users = Object.values(typing).filter(
    ({ user, parent_id }) => user?.id !== client.user?.id && parent_id == null,
  );

  const typingInThread = Object.values(typing).some(
    (event) => event?.parent_id === thread?.id,
  );

  if ((threadList && typingInThread) || (!threadList && users.length)) {
    return (
      <div className="str-chat__typing-indicator">
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
  }

  return null;
};

export default React.memo(TypingIndicator);
