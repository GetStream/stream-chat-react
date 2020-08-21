import React, { useMemo, useContext } from 'react';

import MessageTimestamp from './MessageTimestamp';
import { Avatar } from '../Avatar';
import { renderText } from '../../utils';
import { ChatContext } from '../../context';

const selectColor = (number, dark) => {
  const hue = number * 137.508; // use golden angle approximation
  return `hsl(${hue},${dark ? '50%' : '85%'}, ${dark ? '75%' : '55%'})`;
};

const hashUserId = (userId) => {
  const hash = userId.split('').reduce((acc, c) => {
    acc = (acc << 5) - acc + c.charCodeAt(0); // eslint-disable-line
    return acc & acc; // eslint-disable-line no-bitwise
  }, 0);

  return Math.abs(hash) / 10 ** Math.ceil(Math.log10(Math.abs(hash) + 1));
};

const getUserColor = (theme, userId) => {
  return selectColor(hashUserId(userId), theme.includes('dark'));
};

const FixedHeightMessage = ({ userID, message }) => {
  const { theme } = useContext(ChatContext);
  const renderedText = useMemo(
    () => renderText(message.text, message.mentioned_users),
    [message.text, message.mentioned_users],
  );

  const userColor = useMemo(() => getUserColor(theme, message.user.id), [
    message.user.id,
    theme,
  ]);

  return (
    <div
      key={message.id}
      className={`str-chat__virtual-message__wrapper ${
        message.user.id === userID
          ? 'str-chat__virtual-message__wrapper--me'
          : ''
      } `}
    >
      <Avatar
        shape="rounded"
        size={38}
        image={message.user.image}
        name={message.user.name || message.user.id}
      />
      <div className="str-chat__virtual-message__content">
        <div className="str-chat__virtual-message__meta">
          <span
            className="str-chat__virtual-message__author"
            style={{ color: userColor }}
          >
            <strong>{message.user.name || 'unknown'}</strong>
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
