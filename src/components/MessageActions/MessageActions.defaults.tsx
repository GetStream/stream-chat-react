/* eslint-disable sort-keys */
import React, { forwardRef, useState } from 'react';

import { GlobalModal } from '../Modal';
import {
  IconArrowRotateClockwise,
  IconArrowShareLeft,
  IconBellNotification,
  IconBellOff,
  IconBookmark,
  IconBookmarkRemove,
  IconBubbleText6ChatMessage,
  IconBubbleWideNotificationChatMessage,
  IconCircleBanSign,
  IconCloseQuote2,
  IconDotGrid1x3Horizontal,
  IconEditBig,
  IconEmojiSmile,
  IconFlag2,
  IconMute,
  IconPeopleAdded,
  IconPin,
  IconSquareBehindSquare2_Copy,
  IconTrashBin,
  IconUnpin,
  IconVolumeFull,
} from '../Icons';
import { isUserMuted } from '../Message/utils';
import { useMessageComposerController } from '../MessageComposer/hooks/useMessageComposerController';
import { addNotificationTargetTag, useNotificationTarget } from '../Notifications';
import { useMessageReminder } from '../Message/hooks/useMessageReminder';
import { ReactionSelectorWithButton } from '../Reactions/ReactionSelectorWithButton';
import {
  useChatContext,
  useComponentContext,
  useMessageContext,
  useTranslationContext,
} from '../../context';
import { RemindMeSubmenu, RemindMeSubmenuHeader } from './RemindMeSubmenu';
import {
  ContextMenuButton,
  useContextMenuContext,
  useDialogIsOpen,
  useDialogOnNearestManager,
} from '../Dialog';
import { MessageActions, type MessageActionSetItem } from './MessageActions';
import { QuickMessageActionsButton } from './QuickMessageActionButton';
import clsx from 'clsx';
import { DeleteMessageAlert } from './DeleteMessageAlert';

const msgActionsBoxButtonClassName =
  'str-chat__message-actions-list-item-button' as const;

const DefaultMessageActionComponents = {
  dropdown: {
    ThreadReply() {
      const { closeMenu } = useContextMenuContext();
      const { handleOpenThread } = useMessageContext();
      const { t } = useTranslationContext();

      return (
        <ContextMenuButton
          aria-label={t('aria/Open Thread')}
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
    Quote() {
      const { closeMenu } = useContextMenuContext();
      const { message } = useMessageContext();
      const { t } = useTranslationContext();
      const messageComposer = useMessageComposerController();

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
          className={msgActionsBoxButtonClassName}
          Icon={IconCloseQuote2}
          onClick={() => {
            handleQuote();
            closeMenu();
          }}
        >
          {t('Quote Reply')}
        </ContextMenuButton>
      );
    },
    Pin() {
      const { closeMenu } = useContextMenuContext();
      const { handlePin, message } = useMessageContext();
      const { t } = useTranslationContext();
      const isPinned = !!message.pinned;
      return (
        <ContextMenuButton
          aria-label={isPinned ? t('aria/Unpin Message') : t('aria/Pin Message')}
          className={msgActionsBoxButtonClassName}
          Icon={isPinned ? IconUnpin : IconPin}
          onClick={(event) => {
            handlePin(event);
            closeMenu();
          }}
        >
          {isPinned ? t('Unpin') : t('Pin')}
        </ContextMenuButton>
      );
    },
    CopyMessageText() {
      const { closeMenu } = useContextMenuContext();
      const { message } = useMessageContext();
      const { t } = useTranslationContext();

      return (
        <ContextMenuButton
          aria-label={t('aria/Copy Message Text')}
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
    Resend() {
      const { closeMenu } = useContextMenuContext();
      const { handleRetry, message } = useMessageContext();
      const { t } = useTranslationContext();

      return (
        <ContextMenuButton
          aria-label={t('aria/Resend Message')}
          className={msgActionsBoxButtonClassName}
          Icon={IconArrowRotateClockwise}
          onClick={() => {
            handleRetry(message);
            closeMenu();
          }}
        >
          {t('Resend')}
        </ContextMenuButton>
      );
    },
    Edit() {
      const messageComposer = useMessageComposerController();
      const { message } = useMessageContext();
      const { t } = useTranslationContext();
      const { closeMenu } = useContextMenuContext();

      return (
        <ContextMenuButton
          aria-label={t('aria/Edit Message')}
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
    MarkUnread() {
      const { closeMenu } = useContextMenuContext();
      const { handleMarkUnread } = useMessageContext();
      const { t } = useTranslationContext();

      return (
        <ContextMenuButton
          aria-label={t('aria/Mark Message Unread')}
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
    RemindMe() {
      const { closeMenu, openSubmenu } = useContextMenuContext();
      const { client } = useChatContext();
      const { t } = useTranslationContext();
      const { message } = useMessageContext();
      const reminder = useMessageReminder(message.id);
      const messageAlreadyBookmarked = reminder && !reminder?.remindAt;

      if (messageAlreadyBookmarked) return null;

      return (
        <ContextMenuButton
          aria-label={reminder ? t('aria/Remind Me Message') : t('aria/Remove Reminder')}
          className={msgActionsBoxButtonClassName}
          hasSubMenu={!reminder}
          Icon={reminder ? IconBellOff : IconBellNotification}
          onClick={() => {
            if (reminder) {
              client.reminders.deleteReminder(reminder.id);
              closeMenu();
            } else {
              openSubmenu({
                Header: RemindMeSubmenuHeader,
                Submenu: RemindMeSubmenu,
              });
            }
          }}
        >
          {reminder ? t('Remove reminder') : t('Remind me')}
        </ContextMenuButton>
      );
    },
    SaveForLater() {
      const { closeMenu } = useContextMenuContext();
      const { client } = useChatContext();
      const { message } = useMessageContext();
      const { t } = useTranslationContext();
      const reminder = useMessageReminder(message.id);
      const messageAlreadyHasReminderScheduled = Boolean(reminder && reminder?.remindAt);

      if (messageAlreadyHasReminderScheduled) return null;

      return (
        <ContextMenuButton
          aria-label={
            reminder ? t('aria/Remove Save For Later') : t('aria/Bookmark Message')
          }
          className={msgActionsBoxButtonClassName}
          Icon={reminder ? IconBookmarkRemove : IconBookmark}
          onClick={() => {
            if (reminder) client.reminders.deleteReminder(reminder.id);
            else client.reminders.createReminder({ messageId: message.id });
            closeMenu();
          }}
        >
          {reminder ? t('Remove save for later') : t('Save for later')}
        </ContextMenuButton>
      );
    },
    Flag() {
      const { closeMenu } = useContextMenuContext();
      const { handleFlag } = useMessageContext();
      const { t } = useTranslationContext();

      return (
        <ContextMenuButton
          aria-label={t('aria/Flag Message')}
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
    Mute() {
      const { closeMenu } = useContextMenuContext();
      const { handleMute, message } = useMessageContext();
      const { mutes } = useChatContext();
      const { t } = useTranslationContext();

      const isMuted = isUserMuted(message, mutes);
      return (
        <ContextMenuButton
          aria-label={isMuted ? t('aria/Unmute User') : t('aria/Mute User')}
          className={msgActionsBoxButtonClassName}
          Icon={isMuted ? IconVolumeFull : IconMute}
          onClick={(event) => {
            handleMute(event);
            closeMenu();
          }}
        >
          {isMuted ? t('Unmute') : t('Mute')}
        </ContextMenuButton>
      );
    },
    Delete() {
      const { closeMenu } = useContextMenuContext();
      const { client } = useChatContext();
      const { Modal = GlobalModal } = useComponentContext();
      const { handleDelete } = useMessageContext();
      const panel = useNotificationTarget();
      const { t } = useTranslationContext();
      const [openModal, setOpenModal] = useState(false);

      return (
        <>
          <ContextMenuButton
            aria-label={t('aria/Delete Message')}
            className={msgActionsBoxButtonClassName}
            Icon={IconTrashBin}
            onClick={() => {
              setOpenModal(true);
            }}
            variant='destructive'
          >
            {t('Delete message')}
          </ContextMenuButton>
          <Modal open={openModal}>
            <DeleteMessageAlert
              onCancel={() => {
                setOpenModal(false);
                closeMenu();
              }}
              onDelete={async () => {
                try {
                  await handleDelete();
                  client.notifications.addSuccess({
                    message: t('Message deleted'),
                    options: {
                      tags: addNotificationTargetTag(panel),
                    },
                    origin: { emitter: 'MessageActions' },
                  });
                } catch {
                  // Error notification is handled by useDeleteHandler.
                } finally {
                  setOpenModal(false);
                  closeMenu();
                }
              }}
            />
          </Modal>
        </>
      );
    },
    BlockUser() {
      const { closeMenu } = useContextMenuContext();
      const { client } = useChatContext();
      const { message } = useMessageContext();
      const { t } = useTranslationContext();
      const isBlocked =
        !message.user?.id ||
        new Set(client.blockedUsers.getLatestValue().userIds).has(message.user?.id);

      return (
        <ContextMenuButton
          aria-label={isBlocked ? t('aria/Unblock User') : t('aria/Block User')}
          className={clsx(msgActionsBoxButtonClassName)}
          Icon={isBlocked ? IconPeopleAdded : IconCircleBanSign}
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
    // eslint-disable-next-line react/display-name
    DropdownToggle: forwardRef<HTMLButtonElement>((_, ref) => {
      const { t } = useTranslationContext();
      const { message } = useMessageContext();
      const dropdownDialogIsOpen = useDialogIsOpen(
        MessageActions.getDialogId({ messageId: message.id }),
      );
      const { dialog } = useDialogOnNearestManager({
        id: MessageActions.getDialogId({ messageId: message.id }),
      });

      return (
        <QuickMessageActionsButton
          aria-expanded={dropdownDialogIsOpen}
          aria-haspopup='true'
          aria-label={t('aria/Open Message Actions Menu')}
          className='str-chat__message-actions-box-button'
          data-testid='message-actions-toggle-button'
          onClick={() => {
            dialog?.toggle();
          }}
          ref={ref}
        >
          <IconDotGrid1x3Horizontal className='str-chat__message-action-icon' />
        </QuickMessageActionsButton>
      );
    }),
    React() {
      return <ReactionSelectorWithButton ReactionIcon={IconEmojiSmile} />;
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
          <IconArrowShareLeft className='str-chat__message-action-icon' />
        </QuickMessageActionsButton>
      );
    },
  },
};

export const defaultMessageActionSet: MessageActionSetItem[] = [
  {
    Component: DefaultMessageActionComponents.quick.DropdownToggle,
    placement: 'quick-dropdown-toggle',
  },
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
    Component: DefaultMessageActionComponents.dropdown.Resend,
    placement: 'dropdown',
    type: 'resendMessage',
  },
  {
    Component: DefaultMessageActionComponents.dropdown.Edit,
    placement: 'dropdown',
    type: 'edit',
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
