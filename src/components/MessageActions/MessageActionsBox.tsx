import clsx from 'clsx';
import type { ComponentProps } from 'react';
import React from 'react';
import { CustomMessageActionsList as DefaultCustomMessageActionsList } from './CustomMessageActionsList';
import {
  RemindMeActionButton,
  RemindMeSubmenu,
  RemindMeSubmenuHeader,
} from './RemindMeSubmenu';
import { OPTIONAL_MESSAGE_ACTIONS, useMessageReminder } from '../Message';
import { useMessageComposer } from '../MessageInput';
import {
  useChatContext,
  useComponentContext,
  useMessageContext,
  useTranslationContext,
} from '../../context';
import { MESSAGE_ACTIONS } from '../Message/utils';
import type { MessageContextValue } from '../../context';
import { ContextMenu, ContextMenuButton, type ContextMenuItemComponent } from '../Dialog';

type PropsDrilledToMessageActionsBox =
  | 'getMessageActions'
  | 'handleDelete'
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
  onClose?: () => void;
  open: boolean;
} & ComponentProps<'div'>;

const UnMemoizedMessageActionsBox = (props: MessageActionsBoxProps) => {
  const {
    className,
    getMessageActions,
    handleDelete,
    handleFlag,
    handleMarkUnread,
    handleMute,
    handlePin,
    isUserMuted,
    mine,
    onClose,
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

  const handleEdit = () => {
    messageComposer.initState({ composition: message });
  };

  const rootClassName = clsx('str-chat__message-actions-box', className, {
    'str-chat__message-actions-box--open': open,
  });

  const buttonClassName =
    'str-chat__message-actions-list-item str-chat__message-actions-list-item-button';

  const MessageActionsList = ({
    children,
    className,
    ...props
  }: ComponentProps<'div'>) => (
    <div
      {...props}
      aria-label={t('aria/Message Options')}
      className={clsx('str-chat__message-actions-list', className)}
      role='listbox'
    >
      {children}
    </div>
  );

  const contextMenuItems: ContextMenuItemComponent[] = [];

  if (customMessageActions) {
    const CustomActionsItem: ContextMenuItemComponent = ({ closeMenu }) => (
      <CustomMessageActionsList
        closeMenu={closeMenu}
        customMessageActions={customMessageActions}
        message={message}
      />
    );
    contextMenuItems.push(CustomActionsItem);
  }

  if (messageActions.indexOf(MESSAGE_ACTIONS.quote) > -1) {
    const QuoteItem: ContextMenuItemComponent = ({ closeMenu }) => (
      <ContextMenuButton
        className={buttonClassName}
        onClick={() => {
          handleQuote();
          closeMenu();
        }}
      >
        {t('Reply')}
      </ContextMenuButton>
    );
    contextMenuItems.push(QuoteItem);
  }

  if (messageActions.indexOf(MESSAGE_ACTIONS.pin) > -1 && !message.parent_id) {
    const PinItem: ContextMenuItemComponent = ({ closeMenu }) => (
      <ContextMenuButton
        className={buttonClassName}
        onClick={(event) => {
          handlePin(event);
          closeMenu();
        }}
      >
        {!message.pinned ? t('Pin') : t('Unpin')}
      </ContextMenuButton>
    );
    contextMenuItems.push(PinItem);
  }

  if (
    messageActions.indexOf(MESSAGE_ACTIONS.markUnread) > -1 &&
    !threadList &&
    !!message.id
  ) {
    const MarkUnreadItem: ContextMenuItemComponent = ({ closeMenu }) => (
      <ContextMenuButton
        className={buttonClassName}
        onClick={(event) => {
          handleMarkUnread(event);
          closeMenu();
        }}
      >
        {t('Mark as unread')}
      </ContextMenuButton>
    );
    contextMenuItems.push(MarkUnreadItem);
  }

  if (messageActions.indexOf(MESSAGE_ACTIONS.flag) > -1) {
    const FlagItem: ContextMenuItemComponent = ({ closeMenu }) => (
      <ContextMenuButton
        className={buttonClassName}
        onClick={(event) => {
          handleFlag(event);
          closeMenu();
        }}
      >
        {t('Flag')}
      </ContextMenuButton>
    );
    contextMenuItems.push(FlagItem);
  }

  if (messageActions.indexOf(MESSAGE_ACTIONS.mute) > -1) {
    const MuteItem: ContextMenuItemComponent = ({ closeMenu }) => (
      <ContextMenuButton
        className={buttonClassName}
        onClick={(event) => {
          handleMute(event);
          closeMenu();
        }}
      >
        {isUserMuted() ? t('Unmute') : t('Mute')}
      </ContextMenuButton>
    );
    contextMenuItems.push(MuteItem);
  }

  if (messageActions.indexOf(MESSAGE_ACTIONS.edit) > -1) {
    const EditItem: ContextMenuItemComponent = ({ closeMenu }) => (
      <ContextMenuButton
        className={buttonClassName}
        onClick={() => {
          handleEdit();
          closeMenu();
        }}
      >
        {t('Edit Message')}
      </ContextMenuButton>
    );
    contextMenuItems.push(EditItem);
  }

  if (messageActions.indexOf(MESSAGE_ACTIONS.delete) > -1) {
    const DeleteItem: ContextMenuItemComponent = ({ closeMenu }) => (
      <ContextMenuButton
        className={buttonClassName}
        onClick={(event) => {
          handleDelete(event);
          closeMenu();
        }}
      >
        {t('Delete')}
      </ContextMenuButton>
    );
    contextMenuItems.push(DeleteItem);
  }

  if (
    messageActions.indexOf(OPTIONAL_MESSAGE_ACTIONS.deleteForMe) > -1 &&
    !message.deleted_for_me
  ) {
    const DeleteForMeItem: ContextMenuItemComponent = ({ closeMenu }) => (
      <ContextMenuButton
        className={buttonClassName}
        onClick={(event) => {
          handleDelete(event, { deleteForMe: true });
          closeMenu();
        }}
      >
        {t('Delete for me')}
      </ContextMenuButton>
    );
    contextMenuItems.push(DeleteForMeItem);
  }

  if (messageActions.indexOf(MESSAGE_ACTIONS.remindMe) > -1) {
    const RemindMeItem: ContextMenuItemComponent = ({ openSubmenu }) => (
      <RemindMeActionButton
        className={buttonClassName}
        hasSubMenu
        isMine={mine}
        onClick={() => {
          openSubmenu({
            Header: RemindMeSubmenuHeader,
            Submenu: RemindMeSubmenu,
          });
        }}
      />
    );
    contextMenuItems.push(RemindMeItem);
  }

  if (messageActions.indexOf(MESSAGE_ACTIONS.saveForLater) > -1) {
    const SaveForLaterItem: ContextMenuItemComponent = ({ closeMenu }) => (
      <ContextMenuButton
        className={buttonClassName}
        onClick={() => {
          if (reminder) {
            client.reminders.deleteReminder(reminder.id);
          } else {
            client.reminders.createReminder({ messageId: message.id });
          }
          closeMenu();
        }}
      >
        {reminder ? t('Remove reminder') : t('Save for later')}
      </ContextMenuButton>
    );
    contextMenuItems.push(SaveForLaterItem);
  }

  return (
    <ContextMenu
      {...restDivProps}
      backLabel={t('Back')}
      className={clsx(rootClassName, 'str-chat__dialog-menu')}
      data-testid='message-actions-box'
      items={contextMenuItems}
      ItemsWrapper={MessageActionsList}
      onClose={onClose}
    />
  );
};

/**
 * A popup box that displays the available actions on a message, such as edit, delete, pin, etc.
 */
export const MessageActionsBox = React.memo(
  UnMemoizedMessageActionsBox,
) as typeof UnMemoizedMessageActionsBox;
