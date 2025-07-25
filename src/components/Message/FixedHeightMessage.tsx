import React, { useCallback, useMemo } from 'react';

import { useDeleteHandler, useUserRole } from './hooks';
import { MessageDeleted as DefaultMessageDeleted } from './MessageDeleted';
import { MessageTimestamp } from './MessageTimestamp';
import { getMessageActions } from './utils';

import { Avatar } from '../Avatar';
import { Gallery } from '../Gallery';
import { MessageActions } from '../MessageActions';

import { useChatContext } from '../../context/ChatContext';
import { useComponentContext } from '../../context/ComponentContext';
import { useMessageContext } from '../../context/MessageContext';
import { useTranslationContext } from '../../context/TranslationContext';
import { renderText } from './renderText';

import type { LocalMessage, TranslationLanguages } from 'stream-chat';

const selectColor = (number: number, dark: boolean) => {
  const hue = number * 137.508; // use golden angle approximation
  return `hsl(${hue},${dark ? '50%' : '85%'}, ${dark ? '75%' : '55%'})`;
};

const hashUserId = (userId: string) => {
  const hash = userId.split('').reduce((acc, c) => {
    acc = (acc << 5) - acc + c.charCodeAt(0);
    return acc & acc;
  }, 0);
  return Math.abs(hash) / 10 ** Math.ceil(Math.log10(Math.abs(hash) + 1));
};

const getUserColor = (theme: string, userId: string) =>
  selectColor(hashUserId(userId), theme.includes('dark'));

export type FixedHeightMessageProps = {
  groupedByUser?: boolean;
  message?: LocalMessage;
};

const UnMemoizedFixedHeightMessage = (props: FixedHeightMessageProps) => {
  const { groupedByUser: propGroupedByUser, message: propMessage } = props;

  const { theme } = useChatContext('FixedHeightMessage');

  const { groupedByUser: contextGroupedByUser, message: contextMessage } =
    useMessageContext('FixedHeightMessage');

  const { MessageDeleted = DefaultMessageDeleted } =
    useComponentContext('FixedHeightMessage');

  const { userLanguage } = useTranslationContext('FixedHeightMessage');

  const groupedByUser =
    propGroupedByUser !== undefined ? propGroupedByUser : contextGroupedByUser;
  const message = propMessage || contextMessage;

  const handleDelete = useDeleteHandler(message);
  const role = useUserRole(message);

  const messageTextToRender =
    message?.i18n?.[`${userLanguage}_text` as `${TranslationLanguages}_text`] ||
    message?.text;

  const renderedText = useMemo(
    () => renderText(messageTextToRender, message.mentioned_users),
    [message.mentioned_users, messageTextToRender],
  );

  const userId = message.user?.id || '';
  const userColor = useMemo(() => getUserColor(theme, userId), [userId, theme]);

  const messageActionsHandler = useCallback(
    () => getMessageActions(['delete'], { canDelete: role.canDelete }),
    [role],
  );

  const images = message?.attachments?.filter(({ type }) => type === 'image');

  return (
    <div
      className={`str-chat__virtual-message__wrapper ${
        role.isMyMessage ? 'str-chat__virtual-message__wrapper--me' : ''
      } ${groupedByUser ? 'str-chat__virtual-message__wrapper--group' : ''}`}
      key={message.id}
    >
      {message.user && (
        <Avatar
          image={message.user.image}
          name={message.user.name || message.user.id}
          user={message.user}
        />
      )}
      <div className='str-chat__virtual-message__content'>
        <div className='str-chat__virtual-message__meta'>
          <div className='str-chat__virtual-message__author' style={{ color: userColor }}>
            <strong>{message.user?.name || 'unknown'}</strong>
          </div>
        </div>
        {message.deleted_at || message.type === 'deleted' ? (
          <MessageDeleted message={message} />
        ) : (
          <>
            {images && <Gallery images={images} />}
            <div className='str-chat__virtual-message__text' data-testid='msg-text'>
              {renderedText}
              <div className='str-chat__virtual-message__data'>
                <MessageActions
                  customWrapperClass='str-chat__virtual-message__actions'
                  getMessageActions={messageActionsHandler}
                  handleDelete={handleDelete}
                  message={message}
                  mine={() => role.isMyMessage}
                />
                <span className='str-chat__virtual-message__date'>
                  <MessageTimestamp
                    customClass='str-chat__message-simple-timestamp'
                    message={message}
                  />
                </span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

/**
 * @deprecated - This UI component will be removed in the next major release.
 *
 * FixedHeightMessage - This component renders a single message.
 * It uses fixed height elements to make sure it works well in VirtualizedMessageList
 */
export const FixedHeightMessage = React.memo(
  UnMemoizedFixedHeightMessage,
) as typeof UnMemoizedFixedHeightMessage;
