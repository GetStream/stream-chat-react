import React, { useCallback, useMemo, useRef } from 'react';

import {
  useComponentContext,
  useComponentContextIcons,
  useTranslationContext,
} from '../../context';
import { Button } from '../Button';
import { ContextMenu, useDialogIsOpen, useDialogOnNearestManager } from '../Dialog';
import { GlobalModal } from '../Modal';
import { SCHEDULED_MESSAGE_ACTIONS_MENU_ID } from './constants';
import { DeleteScheduledMessageAlert as DefaultDeleteScheduledMessageAlert } from './DeleteScheduledMessageAlert';
import { useScheduledMessageActionHandlers, useScheduleMessageDialog } from './hooks';
import { RescheduleMessageDialog as DefaultRescheduleMessageDialog } from './RescheduleMessageDialog';
import { ScheduledMessageActionsMenu } from './ScheduledMessageActionsMenu';
import type { ScheduledMessageActionsProps } from './types';
import { getScheduledMessageActions } from './utils';

export const ScheduledMessageActions = ({
  onEdit,
  scheduledMessage,
}: ScheduledMessageActionsProps) => {
  const { t } = useTranslationContext();
  const { IconMore } = useComponentContextIcons();
  const {
    ContextMenu: ContextMenuComponent = ContextMenu,
    DeleteScheduledMessageAlert = DefaultDeleteScheduledMessageAlert,
    Modal = GlobalModal,
    RescheduleMessageDialog = DefaultRescheduleMessageDialog,
  } = useComponentContext();

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
    <>
      <Button
        appearance='ghost'
        aria-expanded={isMenuOpen}
        aria-haspopup='menu'
        aria-label={t('aria/Open scheduled message actions')}
        className='str-chat__scheduled-message-actions-button'
        data-testid='scheduled-message-actions-button'
        disabled={!actions.length || isPending}
        onClick={toggleMenu}
        ref={menuButtonRef}
        size='sm'
        variant='secondary'
      >
        <IconMore />
      </Button>
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
          actions={actions}
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
            onCancel={deleteAlert.closeDialog}
            onDelete={confirmDelete}
          />
        )}
      </Modal>
    </>
  );
};
