/* eslint-disable sort-keys */
import React, { forwardRef, useState } from 'react';

import { GlobalModal } from '../Modal';
import {
  IconAudio,
  IconBell,
  IconBellOff,
  IconBookmark,
  IconBookmarkRemove,
  IconCopy,
  IconDelete,
  IconEdit,
  IconEmoji,
  IconFlag,
  IconMore,
  IconMute,
  IconNoSign,
  IconNotification,
  IconPin,
  IconQuote,
  IconReply,
  IconRetry,
  IconThread,
  IconUnpin,
  IconUserCheck,
} from '../Icons';
import { isMessageDeleted, isUserMuted } from '../Message/utils';
import { useMessageComposerController } from '../MessageComposer/hooks/useMessageComposerController';
import { savePreEditSnapshot } from '../MessageComposer/preEditSnapshot';
import { useNotificationApi } from '../Notifications';
import { useMessageReminder } from '../Message/hooks/useMessageReminder';
import { ReactionSelector as DefaultReactionSelector } from '../Reactions';
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
  DialogAnchor,
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

const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error && error.message ? error.message : fallback;

const getNotificationError = (error: unknown): Error | undefined => {
  if (error instanceof Error) return error;
  if (typeof error === 'string') return new Error(error);
  if (error && typeof error === 'object' && 'message' in error) {
    const message = error.message;
    if (typeof message === 'string') return new Error(message);
  }
  return undefined;
};

const DefaultMessageActionComponents = {
  dropdown: {
    React() {
      const { ReactionSelector = DefaultReactionSelector } = useComponentContext();
      const { anchorReferenceElement } = useContextMenuContext();
      const { isMyMessage, message, threadList } = useMessageContext();
      const { t } = useTranslationContext();
      const [referenceElement, setReferenceElement] = useState<HTMLElement | null>(null);
      const dialogId = `${DefaultReactionSelector.getDialogId({
        messageId: message.id,
        threadList,
      })}-dropdown`;
      const { dialog, dialogManager } = useDialogOnNearestManager({
        id: dialogId,
      });
      const { dialog: extendedDialog } = useDialogOnNearestManager({
        id: `${dialogId}-extended`,
      });
      const dialogIsOpen = useDialogIsOpen(dialogId, dialogManager?.id);

      return (
        <>
          <DialogAnchor
            dialogManagerId={dialogManager?.id}
            id={dialogId}
            offset={8}
            placement={isMyMessage() ? 'top-end' : 'top-start'}
            referenceElement={referenceElement}
            trapFocus
            updatePositionOnContentResize
          >
            <ReactionSelector dialogId={dialogId} referenceElement={referenceElement} />
          </DialogAnchor>
          <ContextMenuButton
            aria-expanded={dialogIsOpen}
            aria-label={t('aria/Open Reaction Selector')}
            className={clsx(
              msgActionsBoxButtonClassName,
              'str-chat__message-actions-list-item-button--react',
            )}
            data-testid='dropdown-react-action'
            Icon={IconEmoji}
            onClick={(event) => {
              if (dialogIsOpen) {
                extendedDialog.close();
                dialog.close();
                return;
              }
              setReferenceElement(
                anchorReferenceElement instanceof HTMLElement
                  ? anchorReferenceElement
                  : event.currentTarget,
              );
              dialog.open();
            }}
          >
            {t('Add reaction')}
          </ContextMenuButton>
        </>
      );
    },
    ThreadReply() {
      const { closeMenu } = useContextMenuContext();
      const { handleOpenThread } = useMessageContext();
      const { t } = useTranslationContext();

      return (
        <ContextMenuButton
          aria-label={t('aria/Open Thread')}
          className={msgActionsBoxButtonClassName}
          data-testid='thread-action'
          Icon={IconThread}
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
          Icon={IconQuote}
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
      const { addNotification } = useNotificationApi();
      const { t } = useTranslationContext();
      const isPinned = !!message.pinned;
      return (
        <ContextMenuButton
          aria-label={isPinned ? t('aria/Unpin Message') : t('aria/Pin Message')}
          className={msgActionsBoxButtonClassName}
          Icon={isPinned ? IconUnpin : IconPin}
          onClick={async (event) => {
            try {
              await handlePin(event);
              addNotification({
                context: {
                  message,
                },
                emitter: 'MessageActions',
                message: isPinned ? t('Message unpinned') : t('Message pinned'),
                severity: 'success',
                type: isPinned ? 'api:message:unpin:success' : 'api:message:pin:success',
              });
            } catch (error) {
              addNotification({
                context: {
                  message,
                },
                emitter: 'MessageActions',
                error: getNotificationError(error),
                message: getErrorMessage(
                  error,
                  isPinned ? t('Error removing message pin') : t('Error pinning message'),
                ),
                severity: 'error',
                type: isPinned ? 'api:message:unpin:failed' : 'api:message:pin:failed',
              });
            }
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
          Icon={IconCopy}
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
          Icon={IconRetry}
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
          Icon={IconEdit}
          onClick={() => {
            savePreEditSnapshot(messageComposer);
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
      const { handleMarkUnread, message } = useMessageContext();
      const { addNotification } = useNotificationApi();
      const { t } = useTranslationContext();

      return (
        <ContextMenuButton
          aria-label={t('aria/Mark Message Unread')}
          className={msgActionsBoxButtonClassName}
          Icon={IconNotification}
          onClick={async (event) => {
            try {
              await handleMarkUnread(event);
              addNotification({
                context: {
                  message,
                },
                emitter: 'MessageActions',
                message: t('Message marked as unread'),
                severity: 'success',
                type: 'api:message:markUnread:success',
              });
            } catch (error) {
              addNotification({
                context: {
                  message,
                },
                emitter: 'MessageActions',
                error: getNotificationError(error),
                message: getErrorMessage(
                  error,
                  t(
                    'Error marking message unread. Cannot mark unread messages older than the newest 100 channel messages.',
                  ),
                ),
                severity: 'error',
                type: 'api:message:markUnread:failed',
              });
            }
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
      const { addNotification } = useNotificationApi();
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
          Icon={reminder ? IconBellOff : IconBell}
          onClick={async () => {
            if (reminder) {
              try {
                await client.reminders.deleteReminder(reminder.id);
                addNotification({
                  context: {
                    message,
                  },
                  emitter: 'MessageActions',
                  message: t('Remove reminder'),
                  severity: 'success',
                  type: 'api:message:reminder:delete:success',
                });
              } catch (error) {
                addNotification({
                  context: {
                    message,
                  },
                  emitter: 'MessageActions',
                  error: getNotificationError(error),
                  message: getErrorMessage(error, 'Error removing reminder'),
                  severity: 'error',
                  type: 'api:message:reminder:delete:failed',
                });
              } finally {
                closeMenu();
              }
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
      const { addNotification } = useNotificationApi();
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
          onClick={async () => {
            try {
              if (reminder) {
                await client.reminders.deleteReminder(reminder.id);
                addNotification({
                  context: {
                    message,
                  },
                  emitter: 'MessageActions',
                  message: t('Remove save for later'),
                  severity: 'success',
                  type: 'api:message:saveForLater:delete:success',
                });
              } else {
                await client.reminders.createReminder({ messageId: message.id });
                addNotification({
                  context: {
                    message,
                  },
                  emitter: 'MessageActions',
                  message: t('Saved for later'),
                  severity: 'success',
                  type: 'api:message:saveForLater:create:success',
                });
              }
            } catch (error) {
              addNotification({
                context: {
                  message,
                },
                emitter: 'MessageActions',
                error: getNotificationError(error),
                message: getErrorMessage(
                  error,
                  reminder
                    ? 'Error removing message from saved for later'
                    : 'Error saving message for later',
                ),
                severity: 'error',
                type: reminder
                  ? 'api:message:saveForLater:delete:failed'
                  : 'api:message:saveForLater:create:failed',
              });
            } finally {
              closeMenu();
            }
          }}
        >
          {reminder ? t('Remove save for later') : t('Save for later')}
        </ContextMenuButton>
      );
    },
    Flag() {
      const { closeMenu } = useContextMenuContext();
      const { handleFlag, message } = useMessageContext();
      const { addNotification } = useNotificationApi();
      const { t } = useTranslationContext();

      return (
        <ContextMenuButton
          aria-label={t('aria/Flag Message')}
          className={msgActionsBoxButtonClassName}
          Icon={IconFlag}
          onClick={async (event) => {
            try {
              await handleFlag(event);
              addNotification({
                context: {
                  message,
                },
                emitter: 'MessageActions',
                message: t('Message has been successfully flagged'),
                severity: 'success',
                type: 'api:message:flag:success',
              });
            } catch (error) {
              addNotification({
                context: {
                  message,
                },
                emitter: 'MessageActions',
                error: getNotificationError(error),
                message: getErrorMessage(error, t('Error adding flag')),
                severity: 'error',
                type: 'api:message:flag:failed',
              });
            }
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
      const { addNotification } = useNotificationApi();
      const { mutes } = useChatContext();
      const { t } = useTranslationContext();

      const isMuted = isUserMuted(message, mutes);
      return (
        <ContextMenuButton
          aria-label={isMuted ? t('aria/Unmute User') : t('aria/Mute User')}
          className={msgActionsBoxButtonClassName}
          Icon={isMuted ? IconAudio : IconMute}
          onClick={async (event) => {
            try {
              await handleMute(event);
              addNotification({
                context: {
                  message,
                },
                emitter: 'MessageActions',
                message: isMuted
                  ? t('{{ user }} has been unmuted', {
                      user: message.user?.name || message.user?.id,
                    })
                  : t('{{ user }} has been muted', {
                      user: message.user?.name || message.user?.id,
                    }),
                severity: 'success',
                type: isMuted ? 'api:user:unmute:success' : 'api:user:mute:success',
              });
            } catch (error) {
              addNotification({
                context: {
                  message,
                },
                emitter: 'MessageActions',
                error: getNotificationError(error),
                message: getErrorMessage(
                  error,
                  isMuted ? t('Error unmuting a user ...') : t('Error muting a user ...'),
                ),
                severity: 'error',
                type: isMuted ? 'api:user:unmute:failed' : 'api:user:mute:failed',
              });
            }
            closeMenu();
          }}
        >
          {isMuted ? t('Unmute') : t('Mute')}
        </ContextMenuButton>
      );
    },
    Delete() {
      const { closeMenu } = useContextMenuContext();
      const { addNotification } = useNotificationApi();
      const { Modal = GlobalModal } = useComponentContext();
      const { handleDelete, message } = useMessageContext();
      const { t } = useTranslationContext();
      const [openModal, setOpenModal] = useState(false);

      if (isMessageDeleted(message)) return null;

      return (
        <>
          <ContextMenuButton
            aria-label={t('aria/Delete Message')}
            className={msgActionsBoxButtonClassName}
            Icon={IconDelete}
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
                  addNotification({
                    context: {
                      message,
                    },
                    emitter: 'MessageActions',
                    message: t('Message deleted'),
                    severity: 'success',
                    type: 'api:message:delete:success',
                  });
                } catch (error) {
                  addNotification({
                    context: {
                      message,
                    },
                    emitter: 'MessageActions',
                    error: getNotificationError(error),
                    message: getErrorMessage(error, t('Error deleting message')),
                    severity: 'error',
                    type: 'api:message:delete:failed',
                  });
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
          Icon={isBlocked ? IconUserCheck : IconNoSign}
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
      const { message, threadList } = useMessageContext();
      const dropdownDialogIsOpen = useDialogIsOpen(
        MessageActions.getDialogId({ messageId: message.id }),
      );
      const { dialog } = useDialogOnNearestManager({
        id: MessageActions.getDialogId({ messageId: message.id }),
      });
      const reactionSelectorDialogId = DefaultReactionSelector.getDialogId({
        messageId: message.id,
        threadList,
      });
      const { dialog: dropdownReactionSelectorDialog } = useDialogOnNearestManager({
        id: `${reactionSelectorDialogId}-dropdown`,
      });
      const { dialog: dropdownReactionSelectorExtendedDialog } =
        useDialogOnNearestManager({
          id: `${reactionSelectorDialogId}-dropdown-extended`,
        });

      return (
        <QuickMessageActionsButton
          aria-expanded={dropdownDialogIsOpen}
          aria-haspopup='true'
          aria-label={t('aria/Open Message Actions Menu')}
          className='str-chat__message-actions-box-button'
          data-testid='message-actions-toggle-button'
          onClick={() => {
            // Close dropdown-anchored reaction selectors before toggling actions menu
            // to avoid stale selector re-anchoring.
            dropdownReactionSelectorDialog?.close();
            dropdownReactionSelectorExtendedDialog?.close();
            dialog?.toggle();
          }}
          ref={ref}
        >
          <IconMore className='str-chat__message-action-icon' />
        </QuickMessageActionsButton>
      );
    }),
    React() {
      return <ReactionSelectorWithButton ReactionIcon={IconEmoji} />;
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
          <IconReply className='str-chat__message-action-icon' />
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
    Component: DefaultMessageActionComponents.dropdown.React,
    placement: 'dropdown',
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
