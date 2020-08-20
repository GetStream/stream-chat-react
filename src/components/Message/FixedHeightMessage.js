import React, { useMemo } from 'react';

import MessageTimestamp from './MessageTimestamp';
import { Avatar } from '../Avatar';
import { renderText } from '../../utils';

const FixedHeightMessage = ({ userID, message }) => {
  const renderedText = useMemo(
    () => renderText(message.text, message.mentioned_users),
    [message.text, message.mentioned_users],
  );

  const isOwner = message.user.id === userID;
  const wrapperClass = isOwner
    ? 'str-chat__virtual-message__wrapper str-chat__virtual-message__wrapper--me'
    : 'str-chat__virtual-message__wrapper';

  return (
    <div key={message.id} className={`${wrapperClass}`}>
      <Avatar
        shape="rounded"
        size={38}
        image={message.user.image}
        name={message.user.name || message.user.id}
      />
      <div className="str-chat__virtual-message__content">
        <div className="str-chat__virtual-message__meta">
          <span className="str-chat__virtual-message__author">
            <strong>{message.user.name ? message.user.name : 'unknown'}</strong>
          </span>
          <span className="str-chat__virtual-message__date">
            <MessageTimestamp
              customClass="str-chat__message-simple-timestamp"
              message={message}
            />
          </span>
        </div>
        <div className="str-chat__virtual-message__text">{renderedText}</div>
      </div>
    </div>
  );
};

export default React.memo(FixedHeightMessage);
