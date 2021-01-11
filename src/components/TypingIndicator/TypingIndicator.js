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
  const { channel, client, thread, typing } = useContext(ChannelContext);

  if (!typing || !client || channel?.getConfig()?.typing_events === false) {
    return null;
  }

  const typingInChannel = Object.values(typing).filter(
    ({ user, parent_id }) => user?.id !== client.user?.id && parent_id == null,
  );

  const typingInThread = Object.values(typing).some(
    (event) => event?.parent_id === thread?.id,
  );

  return (
    <div
      className={`str-chat__typing-indicator ${
        (threadList && typingInThread) ||
        (!threadList && typingInChannel.length)
          ? 'str-chat__typing-indicator--typing'
          : ''
      }`}
    >
      <div className="str-chat__typing-indicator__avatars">
        {typingInChannel.map(({ user }, i) => (
          <Avatar
            image={user?.image}
            size={avatarSize}
            name={user?.name || user?.id}
            key={`${user?.id}-${i}`}
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
