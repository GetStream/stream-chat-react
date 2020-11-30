// @ts-check
import React, { useMemo, useContext, useCallback } from 'react';

import MessageTimestamp from './MessageTimestamp';
import { Avatar } from '../Avatar';
import { renderText } from '../../utils';
import { ChatContext } from '../../context';
import { Gallery } from '../Gallery';
import { MessageActions } from '../MessageActions';
import { useUserRole } from './hooks';
import { getMessageActions } from './utils';

/**
 * @param { number } number
 * @param { boolean } dark
 */
const selectColor = (number, dark) => {
  const hue = number * 137.508; // use golden angle approximation
  return `hsl(${hue},${dark ? '50%' : '85%'}, ${dark ? '75%' : '55%'})`;
};

/**
 * @param { string } userId
 */
const hashUserId = (userId) => {
  const hash = userId.split('').reduce((acc, c) => {
    acc = (acc << 5) - acc + c.charCodeAt(0); // eslint-disable-line
    return acc & acc; // eslint-disable-line no-bitwise
  }, 0);
  return Math.abs(hash) / 10 ** Math.ceil(Math.log10(Math.abs(hash) + 1));
};

/**
 * @param { string } theme
 * @param { string } userId
 */
const getUserColor = (theme, userId) => {
  return selectColor(hashUserId(userId), theme.includes('dark'));
};

/**
 * FixedHeightMessage - This component renders a single message.
 * It uses fixed height elements to make sure it works well in VirtualizedMessageList
 * @type {React.FC<import('types').FixedHeightMessageProps>}
 */
const FixedHeightMessage = ({ message, groupedByUser }) => {
  const { theme } = useContext(ChatContext);
  const role = useUserRole(message);

  const renderedText = useMemo(
    () => renderText(message.text, message.mentioned_users),
    [message.text, message.mentioned_users],
  );
  const userId = message.user?.id;
  // @ts-ignore
  const userColor = useMemo(() => getUserColor(theme, userId), [userId, theme]);

  const messageActionsHandler = useCallback(
    () => getMessageActions(['delete'], { canDelete: role.canDeleteMessage }),
    [role],
  );

  const images = message?.attachments?.filter(({ type }) => type === 'image');

  return (
    <div
      key={message.id}
      className={`str-chat__virtual-message__wrapper ${
        role.isMyMessage ? 'str-chat__virtual-message__wrapper--me' : ''
      } ${groupedByUser ? 'str-chat__virtual-message__wrapper--group' : ''}`}
    >
      <Avatar
        shape="rounded"
        size={38}
        // @ts-ignore
        image={message.user?.image}
        name={message.user?.name || message.user?.id}
      />

      <div className="str-chat__virtual-message__content">
        <div className="str-chat__virtual-message__meta">
          <div
            className="str-chat__virtual-message__author"
            style={{ color: userColor }}
          >
            <strong>{message.user?.name || 'unknown'}</strong>
          </div>
        </div>

        {images && <Gallery images={images} />}

        <div className="str-chat__virtual-message__text" data-testid="msg-text">
          {renderedText}
          <div className="str-chat__virtual-message__data">
            <MessageActions
              message={message}
              customWrapperClass="str-chat__virtual-message__actions"
              getMessageActions={messageActionsHandler}
            />
            <span className="str-chat__virtual-message__date">
              <MessageTimestamp
                customClass="str-chat__message-simple-timestamp"
                message={message}
              />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(FixedHeightMessage);
