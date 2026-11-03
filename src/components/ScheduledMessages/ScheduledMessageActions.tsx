import clsx from 'clsx';
import React, { useCallback, useMemo, useRef } from 'react';

import {
  useChatContext,
  useComponentContext,
  useComponentContextIcons,
  useTranslationContext,
} from '../../context';
import { useChannelDisplayName } from '../ChannelListItem/hooks/useChannelDisplayName';
import { Button } from '../Button';
import { ContextMenu, useDialogIsOpen, useDialogOnNearestManager } from '../Dialog';
import { GlobalModal } from '../Modal';
import { SCHEDULED_MESSAGE_ACTIONS_MENU_ID, ScheduledMessageAction } from './constants';
import { DeleteScheduledMessageAlert } from './DeleteScheduledMessageAlert';
import { useScheduledMessageActionHandlers, useScheduleMessageDialog } from './hooks';
import { RescheduleMessageDialog } from './RescheduleMessageDialog';
import { ScheduledMessageActionsMenu } from './ScheduledMessageActionsMenu';
import type { ScheduledMessageActionsProps } from './types';
import { getScheduledMessageActions, hasScheduledMessageEditButton } from './utils';

export const ScheduledMessageActions = ({
  onEdit,
  scheduledMessage,
}: ScheduledMessageActionsProps) => {
  const { t } = useTranslationContext();
  const { IconEdit, IconMore } = useComponentContextIcons();
  const { ContextMenu: ContextMenuComponent = ContextMenu, Modal = GlobalModal } =
    useComponentContext();

  const { client } = useChatContext('ScheduledMessageActions');
  const channelName = useChannelDisplayName(client.activeChannels[scheduledMessage.cid]);

  const { copyText, deleteScheduledMessage, isPending, sendNow } =
    useScheduledMessageActionHandlers(scheduledMessage);
  const menuDialogId = `${SCHEDULED_MESSAGE_ACTIONS_MENU_ID}-${scheduledMessage.id}`;
  const { dialog: menuDialog, dialogManager } = useDialogOnNearestManager({
    id: menuDialogId,
  });
  const isMenuOpen = useDialogIsOpen(menuDialogId, dialogManager?.id);

  const menuButtonRef = useRef<HTMLButtonElement>(null);

  const rescheduleDialog = useScheduleMessageDialog(menuButtonRef);
  const deleteAlert = useScheduleMessageDialog(menuButtonRef);

  const actions = useMemo(
    () => getScheduledMessageActions(scheduledMessage, { canEdit: !!onEdit }),
    [onEdit, scheduledMessage],
  );
  const hasEditButton = hasScheduledMessageEditButton(scheduledMessage, actions);
  const menuActions = useMemo(
    () =>
      hasEditButton
        ? actions.filter((action) => action !== ScheduledMessageAction.Edit)
        : actions,
    [actions, hasEditButton],
  );

  const toggleMenu = useCallback(() => menuDialog.toggle(), [menuDialog]);

  const editScheduledMessage = useCallback(
    () => onEdit?.(scheduledMessage),
    [onEdit, scheduledMessage],
  );

  const sendScheduledMessageNow = useCallback(() => {
    sendNow();
  }, [sendNow]);

  const confirmDelete = useCallback(() => {
    deleteAlert.closeDialog();
    deleteScheduledMessage();
  }, [deleteAlert, deleteScheduledMessage]);

  return (
    <div
      className={clsx('str-chat__scheduled-message-actions', {
        'str-chat__scheduled-message-actions--active': isMenuOpen,
      })}
    >
      <Button
        appearance='ghost'
        aria-expanded={isMenuOpen}
        aria-haspopup='menu'
        aria-label={t('aria/Open scheduled message actions')}
        circular
        className='str-chat__scheduled-message-actions-button'
        data-testid='scheduled-message-actions-button'
        disabled={!menuActions.length || isPending}
        onClick={toggleMenu}
        ref={menuButtonRef}
        size='xs'
        variant='secondary'
      >
        <IconMore />
      </Button>
      {hasEditButton && (
        <Button
          appearance='ghost'
          aria-label={t('Edit')}
          circular
          className='str-chat__scheduled-message-actions-button'
          data-testid='scheduled-message-edit-button'
          disabled={isPending}
          onClick={editScheduledMessage}
          size='xs'
          variant='secondary'
        >
          <IconEdit />
        </Button>
      )}
      <ContextMenuComponent
        allowFlip
        aria-label={t('Scheduled message actions')}
        className='str-chat__scheduled-message-actions-menu'
        data-testid='scheduled-message-actions-menu'
        dialogManagerId={dialogManager?.id}
        id={menuDialogId}
        onClose={menuDialog.close}
        placement='bottom-end'
        referenceElement={menuButtonRef.current}
        tabIndex={-1}
      >
        <ScheduledMessageActionsMenu
          actions={menuActions}
          onCopy={copyText}
          onDelete={deleteAlert.openDialog}
          onEdit={editScheduledMessage}
          onReschedule={rescheduleDialog.openDialog}
          onSendNow={sendScheduledMessageNow}
        />
      </ContextMenuComponent>
      <Modal
        className='str-chat__reschedule-message-modal'
        initialFocusStrategy='dialog'
        onClose={rescheduleDialog.closeDialog}
        open={rescheduleDialog.isDialogOpen}
      >
        {rescheduleDialog.isDialogOpen && (
          <RescheduleMessageDialog
            close={rescheduleDialog.closeDialog}
            scheduledMessage={scheduledMessage}
          />
        )}
      </Modal>
      <Modal
        className='str-chat__delete-scheduled-message-modal'
        onClose={deleteAlert.closeDialog}
        open={deleteAlert.isDialogOpen}
        role='alertdialog'
      >
        {deleteAlert.isDialogOpen && (
          <DeleteScheduledMessageAlert
            channelName={channelName}
            onCancel={deleteAlert.closeDialog}
            onDelete={confirmDelete}
          />
        )}
      </Modal>
    </div>
  );
};
