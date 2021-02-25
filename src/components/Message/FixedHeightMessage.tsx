import React, { FC, useCallback, useContext, useMemo } from 'react';

import { MessageTimestamp } from './MessageTimestamp';
import { Avatar } from '../Avatar';
import { MML } from '../MML';
import { renderText } from '../../utils';
import { ChatContext, TranslationContext } from '../../context';
import { Gallery } from '../Gallery';
import { MessageActions } from '../MessageActions';
import { useActionHandler, useUserRole } from './hooks';
import { getMessageActions } from './utils';
import type { FixedHeightMessageProps } from 'types';
import type { TranslationLanguages } from 'stream-chat';

const selectColor = (number: number, dark: boolean) => {
  const hue = number * 137.508; // use golden angle approximation
  return `hsl(${hue},${dark ? '50%' : '85%'}, ${dark ? '75%' : '55%'})`;
};

const hashUserId = (userId: string) => {
  const hash = userId.split('').reduce((acc, c) => {
    acc = (acc << 5) - acc + c.charCodeAt(0); // eslint-disable-line
    return acc & acc; // eslint-disable-line no-bitwise
  }, 0);
  return Math.abs(hash) / 10 ** Math.ceil(Math.log10(Math.abs(hash) + 1));
};

const getUserColor = (theme: string, userId: string) =>
  selectColor(hashUserId(userId), theme.includes('dark'));

/**
 * FixedHeightMessage - This component renders a single message.
 * It uses fixed height elements to make sure it works well in VirtualizedMessageList
 */
const UnmemoizedFixedHeightMessage: FC<FixedHeightMessageProps> = ({
  groupedByUser,
  message,
}) => {
  const { theme } = useContext(ChatContext);
  const { userLanguage } = useContext(TranslationContext);

  const role = useUserRole(message);
  const handleAction = useActionHandler(message);

  const messageTextToRender =
    message?.i18n?.[`${userLanguage}_text` as `${TranslationLanguages}_text`] ||
    message?.text;

  const renderedText = useMemo(
    () => renderText(messageTextToRender, message.mentioned_users),
    [message.mentioned_users, messageTextToRender],
  );

  const userId = message.user?.id;
  // @ts-expect-error
  const userColor = useMemo(() => getUserColor(theme, userId), [userId, theme]);

  const messageActionsHandler = useCallback(
    () => getMessageActions(['delete'], { canDelete: role.canDeleteMessage }),
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
      <Avatar
        // @ts-expect-error
        image={message.user?.image}
        name={message.user?.name || message.user?.id}
        shape='rounded'
        size={38}
      />

      <div className='str-chat__virtual-message__content'>
        <div className='str-chat__virtual-message__meta'>
          <div
            className='str-chat__virtual-message__author'
            style={{ color: userColor }}
          >
            <strong>{message.user?.name || 'unknown'}</strong>
          </div>
        </div>

        {images && <Gallery images={images} />}

        <div className='str-chat__virtual-message__text' data-testid='msg-text'>
          {renderedText}

          {message.mml && (
            <MML
              actionHandler={handleAction}
              align='left'
              source={message.mml}
            />
          )}

          <div className='str-chat__virtual-message__data'>
            <MessageActions
              customWrapperClass='str-chat__virtual-message__actions'
              getMessageActions={messageActionsHandler}
              message={message}
            />
            <span className='str-chat__virtual-message__date'>
              <MessageTimestamp
                customClass='str-chat__message-simple-timestamp'
                message={message}
              />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export const FixedHeightMessage = React.memo(UnmemoizedFixedHeightMessage);
