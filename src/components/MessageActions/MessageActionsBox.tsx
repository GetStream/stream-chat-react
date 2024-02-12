import React, { ComponentProps } from 'react';
import clsx from 'clsx';

import { MESSAGE_ACTIONS } from '../Message/utils';

import {
  MessageContextValue,
  useChannelActionContext,
  useComponentContext,
  useMessageContext,
  useTranslationContext,
} from '../../context';

import type { DefaultStreamChatGenerics } from '../../types/types';

import { CustomMessageActionsList as DefaultCustomMessageActionsList } from './CustomMessageActionsList';

type PropsDrilledToMessageActionsBox =
  | 'getMessageActions'
  | 'handleDelete'
  | 'handleEdit'
  | 'handleMarkUnread'
  | 'handleFlag'
  | 'handleMute'
  | 'handlePin';

export type MessageActionsBoxProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
> = Pick<MessageContextValue<StreamChatGenerics>, PropsDrilledToMessageActionsBox> & {
  isUserMuted: () => boolean;
  mine: boolean;
  open: boolean;
} & ComponentProps<'div'>;

const UnMemoizedMessageActionsBox = React.forwardRef(
  <StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics>(
    props: MessageActionsBoxProps<StreamChatGenerics>,
    ref: React.ForwardedRef<HTMLDivElement | null>,
  ) => {
    const {
      getMessageActions,
      handleDelete,
      handleEdit,
      handleFlag,
      handleMarkUnread,
      handleMute,
      handlePin,
      isUserMuted,
      mine,
      open = false,
      ...restDivProps
    } = props;

    const {
      CustomMessageActionsList = DefaultCustomMessageActionsList,
    } = useComponentContext<StreamChatGenerics>('MessageActionsBox');
    const { setQuotedMessage } = useChannelActionContext<StreamChatGenerics>('MessageActionsBox');
    const { customMessageActions, message, threadList } = useMessageContext<StreamChatGenerics>(
      'MessageActionsBox',
    );

    const { t } = useTranslationContext('MessageActionsBox');

    const messageActions = getMessageActions();

    const handleQuote = () => {
      setQuotedMessage(message);

      const elements = message.parent_id
        ? document.querySelectorAll('.str-chat__thread .str-chat__textarea__textarea')
        : document.getElementsByClassName('str-chat__textarea__textarea');
      const textarea = elements.item(0);

      if (textarea instanceof HTMLTextAreaElement) {
        textarea.focus();
      }
    };

    const rootClassName = clsx('str-chat__message-actions-box', {
      'str-chat__message-actions-box--open': open,
    });
    const buttonClassName =
      'str-chat__message-actions-list-item str-chat__message-actions-list-item-button';

    return (
      <div {...restDivProps} className={rootClassName} data-testid='message-actions-box' ref={ref}>
        <div aria-label='Message Options' className='str-chat__message-actions-list' role='listbox'>
          <CustomMessageActionsList customMessageActions={customMessageActions} message={message} />
          {messageActions.indexOf(MESSAGE_ACTIONS.quote) > -1 && (
            <button
              aria-selected='false'
              className={buttonClassName}
              onClick={handleQuote}
              role='option'
            >
              {t<string>('Reply')}
            </button>
          )}
          {messageActions.indexOf(MESSAGE_ACTIONS.pin) > -1 && !message.parent_id && (
            <button
              aria-selected='false'
              className={buttonClassName}
              onClick={handlePin}
              role='option'
            >
              {!message.pinned ? t<string>('Pin') : t<string>('Unpin')}
            </button>
          )}
          {messageActions.indexOf(MESSAGE_ACTIONS.markUnread) > -1 && !threadList && !!message.id && (
            <button
              aria-selected='false'
              className={buttonClassName}
              onClick={handleMarkUnread}
              role='option'
            >
              {t<string>('Mark as unread')}
            </button>
          )}
          {messageActions.indexOf(MESSAGE_ACTIONS.flag) > -1 && (
            <button
              aria-selected='false'
              className={buttonClassName}
              onClick={handleFlag}
              role='option'
            >
              {t<string>('Flag')}
            </button>
          )}
          {messageActions.indexOf(MESSAGE_ACTIONS.mute) > -1 && (
            <button
              aria-selected='false'
              className={buttonClassName}
              onClick={handleMute}
              role='option'
            >
              {isUserMuted() ? t<string>('Unmute') : t<string>('Mute')}
            </button>
          )}
          {messageActions.indexOf(MESSAGE_ACTIONS.edit) > -1 && (
            <button
              aria-selected='false'
              className={buttonClassName}
              onClick={handleEdit}
              role='option'
            >
              {t<string>('Edit Message')}
            </button>
          )}
          {messageActions.indexOf(MESSAGE_ACTIONS.delete) > -1 && (
            <button
              aria-selected='false'
              className={buttonClassName}
              onClick={handleDelete}
              role='option'
            >
              {t<string>('Delete')}
            </button>
          )}
        </div>
      </div>
    );
  },
);

/**
 * A popup box that displays the available actions on a message, such as edit, delete, pin, etc.
 */
export const MessageActionsBox = React.memo(
  UnMemoizedMessageActionsBox,
) as typeof UnMemoizedMessageActionsBox;
