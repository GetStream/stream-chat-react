/* eslint-disable sort-keys */
import React from 'react';

import { isUserMuted, useMessageComposer, useMessageReminder } from '../../components';
import {
  ReactionIcon as DefaultReactionIcon,
  ThreadIcon,
} from '../../components/Message/icons';
import { ReactionSelectorWithButton } from '../../components/Reactions/ReactionSelectorWithButton';
import { useChatContext, useMessageContext, useTranslationContext } from '../../context';
import {
  RemindMeActionButton,
  RemindMeSubmenu,
  RemindMeSubmenuHeader,
} from '../../components/MessageActions/RemindMeSubmenu';
import { ContextMenuButton } from '../../components/Dialog';
import type { ContextMenuItemProps } from '../../components/Dialog';
import type { MessageActionSetItem } from './MessageActions';

const msgActionsBoxButtonClassName =
  'str-chat__message-actions-list-item-button' as const;

const DefaultMessageActionComponents = {
  dropdown: {
    Quote({ closeMenu }: ContextMenuItemProps) {
      const { message } = useMessageContext();
      const { t } = useTranslationContext();
      const messageComposer = useMessageComposer();

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

      return (
        <ContextMenuButton
          aria-selected='false'
          className={msgActionsBoxButtonClassName}
          onClick={() => {
            handleQuote();
            closeMenu();
          }}
        >
          {t('Quote')}
        </ContextMenuButton>
      );
    },
    Pin({ closeMenu }: ContextMenuItemProps) {
      const { handlePin, message } = useMessageContext();
      const { t } = useTranslationContext();

      return (
        <ContextMenuButton
          aria-selected='false'
          className={msgActionsBoxButtonClassName}
          onClick={(event) => {
            handlePin(event);
            closeMenu();
          }}
        >
          {!message.pinned ? t('Pin') : t('Unpin')}
        </ContextMenuButton>
      );
    },
    MarkUnread({ closeMenu }: ContextMenuItemProps) {
      const { handleMarkUnread } = useMessageContext();
      const { t } = useTranslationContext();

      return (
        <ContextMenuButton
          className={msgActionsBoxButtonClassName}
          onClick={(event) => {
            handleMarkUnread(event);
            closeMenu();
          }}
        >
          {t('Mark as unread')}
        </ContextMenuButton>
      );
    },
    Flag({ closeMenu }: ContextMenuItemProps) {
      const { handleFlag } = useMessageContext();
      const { t } = useTranslationContext();

      return (
        <ContextMenuButton
          className={msgActionsBoxButtonClassName}
          onClick={(event) => {
            handleFlag(event);
            closeMenu();
          }}
        >
          {t('Flag')}
        </ContextMenuButton>
      );
    },
    Mute({ closeMenu }: ContextMenuItemProps) {
      const { handleMute, message } = useMessageContext();
      const { mutes } = useChatContext();
      const { t } = useTranslationContext();

      return (
        <ContextMenuButton
          className={msgActionsBoxButtonClassName}
          onClick={(event) => {
            handleMute(event);
            closeMenu();
          }}
        >
          {isUserMuted(message, mutes) ? t('Unmute') : t('Mute')}
        </ContextMenuButton>
      );
    },
    Edit({ closeMenu }: ContextMenuItemProps) {
      const messageComposer = useMessageComposer();
      const { message } = useMessageContext();
      const { t } = useTranslationContext();

      return (
        <ContextMenuButton
          className={msgActionsBoxButtonClassName}
          onClick={() => {
            messageComposer.initState({ composition: message });
            closeMenu();
          }}
        >
          {t('Edit Message')}
        </ContextMenuButton>
      );
    },
    Delete({ closeMenu }: ContextMenuItemProps) {
      const { handleDelete } = useMessageContext();
      const { t } = useTranslationContext();

      return (
        <ContextMenuButton
          className={msgActionsBoxButtonClassName}
          onClick={(event) => {
            handleDelete(event);
            closeMenu();
          }}
        >
          {t('Delete')}
        </ContextMenuButton>
      );
    },
    RemindMe({ openSubmenu }: ContextMenuItemProps) {
      const { isMyMessage } = useMessageContext();
      return (
        <RemindMeActionButton
          className={msgActionsBoxButtonClassName}
          hasSubMenu
          isMine={isMyMessage()}
          onClick={() => {
            openSubmenu({
              Header: RemindMeSubmenuHeader,
              Submenu: RemindMeSubmenu,
            });
          }}
        />
      );
    },
    SaveForLater({ closeMenu }: ContextMenuItemProps) {
      const { client } = useChatContext();
      const { message } = useMessageContext();
      const { t } = useTranslationContext();
      const reminder = useMessageReminder(message.id);

      return (
        <ContextMenuButton
          className={msgActionsBoxButtonClassName}
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
    },
  },
  quick: {
    React() {
      return <ReactionSelectorWithButton ReactionIcon={DefaultReactionIcon} />;
    },
    Reply() {
      const { handleOpenThread } = useMessageContext();
      const { t } = useTranslationContext();

      return (
        <button
          aria-label={t('aria/Open Thread')}
          className='str-chat__message-reply-in-thread-button'
          data-testid='thread-action'
          onClick={handleOpenThread}
        >
          <ThreadIcon className='str-chat__message-action-icon' />
        </button>
      );
    },
  },
};

export const defaultMessageActionSet: MessageActionSetItem[] = [
  // { placement: 'dropdown', type: 'block' },
  {
    Component: DefaultMessageActionComponents.quick.Reply,
    placement: 'quick',
    type: 'reply',
  },
  {
    Component: DefaultMessageActionComponents.quick.React,
    placement: 'quick',
    type: 'react',
  },
  {
    Component: DefaultMessageActionComponents.dropdown.Delete,
    placement: 'dropdown',
    type: 'delete',
  },
  {
    Component: DefaultMessageActionComponents.dropdown.Edit,
    placement: 'dropdown',
    type: 'edit',
  },
  {
    Component: DefaultMessageActionComponents.dropdown.Mute,
    placement: 'dropdown',
    type: 'mute',
  },
  {
    Component: DefaultMessageActionComponents.dropdown.Flag,
    placement: 'dropdown',
    type: 'flag',
  },
  {
    Component: DefaultMessageActionComponents.dropdown.Pin,
    placement: 'dropdown',
    type: 'pin',
  },
  {
    Component: DefaultMessageActionComponents.dropdown.Quote,
    placement: 'dropdown',
    type: 'quote',
  },
  {
    Component: DefaultMessageActionComponents.dropdown.MarkUnread,
    placement: 'dropdown',
    type: 'markUnread',
  },
  {
    Component: DefaultMessageActionComponents.dropdown.RemindMe,
    placement: 'dropdown',
    type: 'remindMe',
  },
  {
    Component: DefaultMessageActionComponents.dropdown.SaveForLater,
    placement: 'dropdown',
    type: 'saveForLater',
  },
] as const;
