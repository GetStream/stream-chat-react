import clsx from 'clsx';
import type { ComponentProps } from 'react';
import React from 'react';
import { CustomMessageActionsList as DefaultCustomMessageActionsList } from './CustomMessageActionsList';
import { RemindMeActionButton } from './RemindMeSubmenu';
import { useMessageReminder } from '../Message';
import { useMessageComposer } from '../MessageInput';
import {
  useChatContext,
  useComponentContext,
  useMessageContext,
  useTranslationContext,
} from '../../context';
import { MESSAGE_ACTIONS } from '../Message/utils';
import type { MessageContextValue } from '../../context';

type PropsDrilledToMessageActionsBox =
  | 'getMessageActions'
  | 'handleDelete'
  | 'handleEdit'
  | 'handleMarkUnread'
  | 'handleFlag'
  | 'handleMute'
  | 'handlePin';

export type MessageActionsBoxProps = Pick<
  MessageContextValue,
  PropsDrilledToMessageActionsBox
> & {
  isUserMuted: () => boolean;
  mine: boolean;
  open: boolean;
} & ComponentProps<'div'>;

const UnMemoizedMessageActionsBox = (props: MessageActionsBoxProps) => {
  const {
    className,
    getMessageActions,
    handleDelete,
    handleEdit,
    handleFlag,
    handleMarkUnread,
    handleMute,
    handlePin,
    isUserMuted,
    mine,
    open,
    ...restDivProps
  } = props;

  const { client } = useChatContext();
  const { CustomMessageActionsList = DefaultCustomMessageActionsList } =
    useComponentContext('MessageActionsBox');
  const { customMessageActions, message, threadList } =
    useMessageContext('MessageActionsBox');
  const { t } = useTranslationContext('MessageActionsBox');
  const messageComposer = useMessageComposer();
  const reminder = useMessageReminder(message.id);

  const messageActions = getMessageActions();

  const handleQuote = () => {
    messageComposer.setQuotedMessage(message);

    const elements = message.parent_id
      ? document.querySelectorAll('.str-chat__thread .str-chat__textarea__textarea')
      : document.getElementsByClassName('str-chat__textarea__textarea');
    const textarea = elements.item(0);

    if (textarea instanceof HTMLTextAreaElement) {
      textarea.focus();
    }
  };

  const rootClassName = clsx('str-chat__message-actions-box', className, {
    'str-chat__message-actions-box--open': open,
  });

  const buttonClassName =
    'str-chat__message-actions-list-item str-chat__message-actions-list-item-button';

  return (
    <div {...restDivProps} className={rootClassName} data-testid='message-actions-box'>
      <div
        aria-label={t('aria/Message Options')}
        className='str-chat__message-actions-list'
        role='listbox'
      >
        <CustomMessageActionsList
          customMessageActions={customMessageActions}
          message={message}
        />
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
        {messageActions.indexOf(MESSAGE_ACTIONS.markUnread) > -1 &&
          !threadList &&
          !!message.id && (
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
        {messageActions.indexOf(MESSAGE_ACTIONS.remindMe) > -1 && (
          <RemindMeActionButton className={buttonClassName} isMine={mine} />
        )}
        {messageActions.indexOf(MESSAGE_ACTIONS.saveForLater) > -1 && (
          <button
            aria-selected='false'
            className={buttonClassName}
            onClick={() =>
              reminder
                ? client.reminders.deleteReminder(reminder.id)
                : client.reminders.createReminder({ messageId: message.id })
            }
            role='option'
          >
            {reminder ? t<string>('Remove reminder') : t<string>('Save for later')}
          </button>
        )}
      </div>
    </div>
  );
};

/**
 * A popup box that displays the available actions on a message, such as edit, delete, pin, etc.
 */
export const MessageActionsBox = React.memo(
  UnMemoizedMessageActionsBox,
) as typeof UnMemoizedMessageActionsBox;
