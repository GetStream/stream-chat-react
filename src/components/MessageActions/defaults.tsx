/* eslint-disable sort-keys */
import React from 'react';

import {
  IconArrowRotateClockwise,
  IconBookmark,
  IconBubbleText6ChatMessage,
  IconBubbleWideNotificationChatMessage,
  IconCircleBanSign,
  IconEditBig,
  IconFlag2,
  IconMute,
  IconPin,
  IconSquareBehindSquare2_Copy,
  IconTrashBin,
  isUserMuted,
  useMessageComposer,
  useMessageReminder,
} from '../../components';
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
import type { ContextMenuItemProps } from '../../components/Dialog';
import { ContextMenuButton } from '../../components/Dialog';
import type { MessageActionSetItem } from './MessageActions';
import { QuickMessageActionsButton } from './QuickMessageActionButton';
import clsx from 'clsx';

const msgActionsBoxButtonClassName =
  'str-chat__message-actions-list-item-button' as const;
const msgActionsBoxButtonClassNameDestructive =
  'str-chat__message-actions-list-item-button--destructive' as const;

const DefaultMessageActionComponents = {
  dropdown: {
    ThreadReply({ closeMenu }: ContextMenuItemProps) {
      const { handleOpenThread } = useMessageContext();
      const { t } = useTranslationContext();

      return (
        <ContextMenuButton
          aria-label={t('aria/Open Thread')}
          aria-selected='false'
          className={msgActionsBoxButtonClassName}
          data-testid='thread-action'
          Icon={IconBubbleText6ChatMessage}
          onClick={(e) => {
            handleOpenThread(e);
            closeMenu();
          }}
        >
          {t('Thread Reply')}
        </ContextMenuButton>
      );
    },
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
          aria-label={t('aria/Quote Message')}
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
      const isPinned = !!message.pinned;
      return (
        <ContextMenuButton
          aria-label={isPinned ? t('aria/Unpin Message') : t('aria/Pin Message')}
          aria-selected='false'
          className={msgActionsBoxButtonClassName}
          Icon={IconPin}
          onClick={(event) => {
            handlePin(event);
            closeMenu();
          }}
        >
          {isPinned ? t('Unpin') : t('Pin')}
        </ContextMenuButton>
      );
    },
    CopyMessageText({ closeMenu }: ContextMenuItemProps) {
      const { message } = useMessageContext();
      const { t } = useTranslationContext();

      return (
        <ContextMenuButton
          aria-label={t('aria/Copy Message Text')}
          aria-selected='false'
          className={msgActionsBoxButtonClassName}
          Icon={IconSquareBehindSquare2_Copy}
          onClick={() => {
            if (message.text) navigator.clipboard.writeText(message.text);
            closeMenu();
          }}
        >
          {t('Copy Message')}
        </ContextMenuButton>
      );
    },
    Resend({ closeMenu }: ContextMenuItemProps) {
      const messageComposer = useMessageComposer();
      const { message } = useMessageContext();
      const { t } = useTranslationContext();

      return (
        <ContextMenuButton
          aria-label={t('aria/Resend Message')}
          aria-selected='false'
          className={msgActionsBoxButtonClassName}
          Icon={IconArrowRotateClockwise}
          onClick={() => {
            messageComposer.initState({ composition: message });
            closeMenu();
          }}
        >
          {t('Resend')}
        </ContextMenuButton>
      );
    },
    Edit({ closeMenu }: ContextMenuItemProps) {
      const messageComposer = useMessageComposer();
      const { message } = useMessageContext();
      const { t } = useTranslationContext();

      return (
        <ContextMenuButton
          aria-label={t('aria/Edit Message')}
          aria-selected='false'
          className={msgActionsBoxButtonClassName}
          Icon={IconEditBig}
          onClick={() => {
            messageComposer.initState({ composition: message });
            closeMenu();
          }}
        >
          {t('Edit Message')}
        </ContextMenuButton>
      );
    },
    MarkUnread({ closeMenu }: ContextMenuItemProps) {
      const { handleMarkUnread } = useMessageContext();
      const { t } = useTranslationContext();

      return (
        <ContextMenuButton
          aria-label={t('aria/Mark Message Unread')}
          aria-selected='false'
          className={msgActionsBoxButtonClassName}
          Icon={IconBubbleWideNotificationChatMessage}
          onClick={(event) => {
            handleMarkUnread(event);
            closeMenu();
          }}
        >
          {t('Mark as unread')}
        </ContextMenuButton>
      );
    },
    RemindMe({ openSubmenu }: ContextMenuItemProps) {
      const { isMyMessage } = useMessageContext();
      const { t } = useTranslationContext();

      return (
        <RemindMeActionButton
          aria-label={t('aria/Remind Me Message')}
          aria-selected='false'
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
          aria-label={t('aria/Bookmark Message')}
          aria-selected='false'
          className={msgActionsBoxButtonClassName}
          Icon={reminder ? IconBookmark : IconBookmark} // todo: what Icon for "Remove reminder" action
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
    Flag({ closeMenu }: ContextMenuItemProps) {
      const { handleFlag } = useMessageContext();
      const { t } = useTranslationContext();

      return (
        <ContextMenuButton
          aria-label={t('aria/Flag Message')}
          aria-selected='false'
          className={msgActionsBoxButtonClassName}
          Icon={IconFlag2}
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

      const isMuted = isUserMuted(message, mutes);
      return (
        <ContextMenuButton
          aria-label={isMuted ? t('aria/Unmute User') : t('aria/Mute User')}
          aria-selected='false'
          className={msgActionsBoxButtonClassName}
          Icon={isMuted ? IconMute : IconMute} // todo: what icon for "Unmute" action
          onClick={(event) => {
            handleMute(event);
            closeMenu();
          }}
        >
          {isMuted ? t('Unmute') : t('Mute')}
        </ContextMenuButton>
      );
    },
    Delete({ closeMenu }: ContextMenuItemProps) {
      const { handleDelete } = useMessageContext();
      const { t } = useTranslationContext();

      return (
        <ContextMenuButton
          aria-label={t('aria/Delete Message')}
          aria-selected='false'
          className={clsx(
            msgActionsBoxButtonClassName,
            msgActionsBoxButtonClassNameDestructive,
          )}
          Icon={IconTrashBin}
          onClick={(event) => {
            handleDelete(event);
            closeMenu();
          }}
        >
          {t('Delete')}
        </ContextMenuButton>
      );
    },
    BlockUser({ closeMenu }: ContextMenuItemProps) {
      const { client } = useChatContext();
      const { message } = useMessageContext();
      const { t } = useTranslationContext();
      const isBlocked = false; // !!client.blockedUsers[targetId]
      return (
        <ContextMenuButton
          aria-label={isBlocked ? t('aria/Unblock User') : t('aria/Block User')}
          aria-selected='false'
          className={clsx(
            msgActionsBoxButtonClassName,
            msgActionsBoxButtonClassNameDestructive,
          )}
          Icon={isBlocked ? IconCircleBanSign : IconCircleBanSign} // todo: what icon for "Unblock User" action
          onClick={() => {
            const targetId = message.user?.id;
            if (targetId) {
              if (isBlocked) client.unBlockUser(targetId);
              else client.blockUser(targetId);
            }
            closeMenu();
          }}
        >
          {isBlocked ? t('Unblock User') : t('Block User')}
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
        <QuickMessageActionsButton
          aria-label={t('aria/Open Thread')}
          className='str-chat__message-reply-in-thread-button'
          data-testid='thread-action'
          onClick={handleOpenThread}
        >
          <ThreadIcon className='str-chat__message-action-icon' />
        </QuickMessageActionsButton>
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
    Component: DefaultMessageActionComponents.dropdown.ThreadReply,
    placement: 'dropdown',
    type: 'reply',
  },
  {
    Component: DefaultMessageActionComponents.dropdown.Quote,
    placement: 'dropdown',
    type: 'quote',
  },
  {
    Component: DefaultMessageActionComponents.dropdown.Pin,
    placement: 'dropdown',
    type: 'pin',
  },
  {
    Component: DefaultMessageActionComponents.dropdown.CopyMessageText,
    placement: 'dropdown',
    type: 'copyMessageText',
  },
  {
    Component: DefaultMessageActionComponents.dropdown.MarkUnread,
    placement: 'dropdown',
    type: 'markUnread',
  },
  {
    Component: DefaultMessageActionComponents.dropdown.Edit,
    placement: 'dropdown',
    type: 'edit',
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
  {
    Component: DefaultMessageActionComponents.dropdown.Flag,
    placement: 'dropdown',
    type: 'flag',
  },
  {
    Component: DefaultMessageActionComponents.dropdown.Mute,
    placement: 'dropdown',
    type: 'mute',
  },
  {
    Component: DefaultMessageActionComponents.dropdown.Delete,
    placement: 'dropdown',
    type: 'delete',
  },
  {
    Component: DefaultMessageActionComponents.dropdown.BlockUser,
    placement: 'dropdown',
    type: 'blockUser',
  },
] as const;
