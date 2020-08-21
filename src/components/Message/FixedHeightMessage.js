import React, { useMemo, useContext } from 'react';

import MessageTimestamp from './MessageTimestamp';
import { Avatar } from '../Avatar';
import { renderText } from '../../utils';
import { ChatContext } from '../../context';

function selectColor(number, theme) {
  const dark = theme.includes('dark');
  const hue = number * 137.508; // use golden angle approximation
  return `hsl(${hue},${dark ? '50%' : '85%'}, ${dark ? '75%' : '55%'})`;
}

const randomColor = (theme) => {
  return selectColor(Math.floor(Math.random() * 30), theme);
};

const setUserColor = (userId, theme) => {
  const userColors = JSON.parse(localStorage.getItem('userColors'));
  const userColor = randomColor(theme);
  userColors[userId] = userColor;
  localStorage.setItem('userColors', JSON.stringify(userColors));

  return userColor;
};

const FixedHeightMessage = ({ userID, message }) => {
  const { theme } = useContext(ChatContext);
  const renderedText = useMemo(
    () => renderText(message.text, message.mentioned_users),
    [message.text, message.mentioned_users],
  );

  const isOwner = message.user.id === userID;
  const wrapperClass = isOwner
    ? 'str-chat__virtual-message__wrapper str-chat__virtual-message__wrapper--me'
    : 'str-chat__virtual-message__wrapper';

  const userColors = JSON.parse(localStorage.getItem('userColors'));
  if (!userColors) localStorage.setItem('userColors', JSON.stringify({}));
  const userColor = userColors?.[message.user.id]
    ? userColors?.[message.user.id]
    : setUserColor(message.user.id, theme);

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
