import React, { useCallback, useRef, useState } from 'react';
import {
  CORE_NOTIFICATION_TYPE,
  dateToNs,
  getScheduledMessageErrorReason,
  ScheduledMessageErrorReason,
  toScheduledMessagePreview,
} from 'stream-chat';
import type { LocalMessage, MessageComposer, UserResponse } from 'stream-chat';

import {
  useChatContext,
  useComponentContext,
  useComponentContextIcons,
  useTranslationContext,
} from '../../context';
import { Button } from '../Button';
import { CHANNEL_CONTAINER_ID } from '../Channel/constants';
import {
  ContextMenu,
  ContextMenuButton,
  ContextMenuHeader,
  useDialogIsOpen,
  useDialogOnNearestManager,
} from '../Dialog';
import { useMessageComposerHasSendableData } from '../MessageComposer/hooks';
import { useMessageComposerController } from '../MessageComposer/hooks/useMessageComposerController';
import { GlobalModal } from '../Modal';
import { useNotificationApi } from '../Notifications';
import { Portal } from '../Portal/Portal';
import { useChannelScheduledMessageLimit } from './hooks/useChannelScheduledMessageLimit';
import { ScheduleTimeDialog as DefaultScheduleTimeDialog } from './ScheduleTimeDialog';
import {
  getSchedulePresets,
  getScheduleTimeBounds,
  getScheduleTimeDialogId,
  SCHEDULED_MESSAGE_NOTIFICATION_TYPE,
  SCHEDULED_MESSAGES_EMITTER,
} from './utils';

const getChannelContainer = () => document.getElementById(CHANNEL_CONTAINER_ID);

/** The composer's notifications of a failed schedule, which the dialog reports itself. */
const SCHEDULING_FAILURE_NOTIFICATION_TYPES: ReadonlySet<string> = new Set([
  CORE_NOTIFICATION_TYPE.scheduledMessageBlocked,
  CORE_NOTIFICATION_TYPE.scheduledMessageCreateFailed,
]);

const getScheduleMessageMenuId = ({ threadId }: Pick<MessageComposer, 'threadId'>) =>
  `schedule-message-menu${threadId ? '-thread' : ''}`;

const getScheduleMessageMenuHeaderId = (
  messageComposer: Pick<MessageComposer, 'threadId'>,
) => `${getScheduleMessageMenuId(messageComposer)}-header`;

const ScheduleMessageMenuHeader = () => {
  const { t } = useTranslationContext();
  const messageComposer = useMessageComposerController();
  const { reachedLimit } = useChannelScheduledMessageLimit(messageComposer.channel);

  const title =
    reachedLimit !== undefined
      ? t('scheduledMessages.limitReachedMax', 'Limit reached ({{ max }} max)', {
          max: reachedLimit,
        })
      : t('scheduledMessages.scheduleMessage', 'Schedule message');

  return (
    <ContextMenuHeader
      className='str-chat__schedule-message-menu__header'
      id={getScheduleMessageMenuHeaderId(messageComposer)}
    >
      {title}
    </ContextMenuHeader>
  );
};

/**
 * The chevron next to the send button: schedules the composition at a preset time or opens a
 * dialog to pick one.
 */
export const ScheduleMessageButton = () => {
  const { t } = useTranslationContext();
  const { client } = useChatContext();
  const { IconChevronUp, IconClock } = useComponentContextIcons();
  const {
    ContextMenu: ContextMenuComponent = ContextMenu,
    Modal = GlobalModal,
    ScheduleTimeDialog = DefaultScheduleTimeDialog,
  } = useComponentContext();
  const { addNotification } = useNotificationApi();
  const messageComposer = useMessageComposerController();
  const hasSendableData = useMessageComposerHasSendableData();

  const { reachedLimit } = useChannelScheduledMessageLimit(messageComposer.channel);
  const isLimitReached = reachedLimit !== undefined;
  const menuId = getScheduleMessageMenuId(messageComposer);
  const limitReachedProps = isLimitReached
    ? {
        'aria-describedby': getScheduleMessageMenuHeaderId(messageComposer),
        'aria-disabled': true as const,
      }
    : undefined;
  const { dialog: menu, dialogManager } = useDialogOnNearestManager({ id: menuId });
  const isMenuOpen = useDialogIsOpen(menuId, dialogManager?.id);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [dialogPreview, setDialogPreview] = useState<LocalMessage>();

  // the banner confirms a scheduled message, so success needs no notification
  const scheduleMessage = useCallback(
    async (scheduledAt: Date) => {
      const { error, status } = await messageComposer.scheduleMessage(scheduledAt);
      if (status === 'sent') {
        addNotification({
          emitter: SCHEDULED_MESSAGES_EMITTER,
          message: t(
            'scheduledMessages.notification.sentNow',
            'Time passed. Message sent now',
          ),
          severity: 'success',
          type: SCHEDULED_MESSAGE_NOTIFICATION_TYPE.sentNow,
        });
        return;
      }
      if (status === 'scheduled') return;
      // the server keeps the ID of a message it scheduled; the next attempt needs a new one
      if (getScheduledMessageErrorReason(error) === ScheduledMessageErrorReason.IdTaken) {
        messageComposer.refreshId();
      }
      throw error ?? new Error(`Message not scheduled: ${status}`);
    },
    [addNotification, messageComposer, t],
  );

  // the dialog shows the failure itself, so the composer's notification of it is dropped
  const scheduleMessageFromDialog = useCallback(
    async (scheduledAt: Date) => {
      const { notifications } = client;
      const shownBefore = new Set(notifications.notifications.map(({ id }) => id));
      try {
        await scheduleMessage(scheduledAt);
      } catch (error) {
        notifications.notifications
          .filter(
            ({ id, origin, type }) =>
              !shownBefore.has(id) &&
              origin.context?.composer === messageComposer &&
              !!type &&
              SCHEDULING_FAILURE_NOTIFICATION_TYPES.has(type),
          )
          .forEach(({ id }) => notifications.remove(id));
        throw error;
      }
    },
    [client, messageComposer, scheduleMessage],
  );

  const openDialog = () => {
    menu.close();
    const now = dateToNs(new Date());
    const { attachmentManager, channel, id, textComposer } = messageComposer;
    setDialogPreview(
      toScheduledMessagePreview({
        cid: channel.cid,
        created_at: now,
        id,
        message: {
          attachments: attachmentManager.attachments,
          custom: {},
          text: textComposer.text,
        },
        scheduled_at: now,
        status: 'scheduled',
        updated_at: now,
        user: (client.user ?? { id: client.userID ?? '' }) as UserResponse,
      }),
    );
  };

  const closeDialog = () => {
    setDialogPreview(undefined);
    // the menu item that opened the dialog is gone, so focus returns to the chevron
    requestAnimationFrame(() => buttonRef.current?.focus());
  };

  return (
    <>
      <Button
        appearance='solid'
        aria-expanded={isMenuOpen}
        aria-haspopup='menu'
        aria-label={t(
          'scheduledMessages.openScheduleMessageMenu.ariaLabel',
          'Open schedule message menu',
        )}
        circular
        className='str-chat__schedule-message-button'
        data-testid='schedule-message-button'
        disabled={!hasSendableData}
        onClick={() => menu.toggle()}
        ref={buttonRef}
        size='xs'
        variant='primary'
      >
        <IconChevronUp />
      </Button>
      <ContextMenuComponent
        allowFlip
        aria-label={t('scheduledMessages.scheduleMessage', 'Schedule message')}
        className='str-chat__schedule-message-menu'
        data-testid='schedule-message-menu'
        dialogManagerId={dialogManager?.id}
        Header={ScheduleMessageMenuHeader}
        id={menuId}
        onClose={menu.close}
        placement='top-end'
        // aligned with the whole split send button, not the chevron inset in it
        referenceElement={
          buttonRef.current?.closest<HTMLElement>('.str-chat__split-send-button') ??
          buttonRef.current
        }
        tabIndex={-1}
      >
        {isMenuOpen &&
          getSchedulePresets(
            new Date(),
            getScheduleTimeBounds(messageComposer.channel),
          ).map((scheduledAt) => (
            <ContextMenuButton
              className='str-chat__schedule-message-menu__preset'
              Icon={IconClock}
              key={scheduledAt.getTime()}
              {...limitReachedProps}
              onClick={() => {
                if (isLimitReached) return;
                menu.close();
                scheduleMessage(scheduledAt).catch(() => undefined);
              }}
            >
              {t('timestamp.SchedulePreset', { timestamp: scheduledAt })}
            </ContextMenuButton>
          ))}
        <div className='str-chat__context-menu__separator' role='separator' />
        <ContextMenuButton
          aria-haspopup='dialog'
          className='str-chat__schedule-message-menu__custom-time'
          hasSubMenu
          Icon={IconClock}
          {...limitReachedProps}
          onClick={() => {
            if (!isLimitReached) openDialog();
          }}
        >
          {t('scheduledMessages.customTime', 'Custom time')}
        </ContextMenuButton>
      </ContextMenuComponent>
      <Portal getPortalDestination={getChannelContainer} isOpen={!!dialogPreview}>
        <Modal
          className='str-chat__schedule-message-modal'
          dialogId={getScheduleTimeDialogId(messageComposer)}
          initialFocusStrategy='dialog'
          onClose={closeDialog}
          open={!!dialogPreview}
        >
          {dialogPreview && (
            <ScheduleTimeDialog
              channel={messageComposer.channel}
              close={closeDialog}
              errorMessage={t(
                'scheduledMessages.couldntScheduleMessageTryAgain',
                "Couldn't schedule message. Try again",
              )}
              previewMessage={dialogPreview}
              submit={scheduleMessageFromDialog}
              title={t('scheduledMessages.scheduleMessage', 'Schedule message')}
            />
          )}
        </Modal>
      </Portal>
    </>
  );
};
