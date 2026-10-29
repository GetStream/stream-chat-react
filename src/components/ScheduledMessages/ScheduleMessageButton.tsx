import clsx from 'clsx';
import React, { useCallback, useRef } from 'react';

import {
  useComponentContext,
  useComponentContextIcons,
  useTranslationContext,
} from '../../context';
import { Button } from '../Button';
import { CHANNEL_CONTAINER_ID } from '../Channel/constants';
import { ContextMenu, useDialogIsOpen, useDialogOnNearestManager } from '../Dialog';
import { useMessageComposerHasSendableData } from '../MessageComposer/hooks';
import { useMessageComposerController } from '../MessageComposer/hooks/useMessageComposerController';
import { GlobalModal } from '../Modal';
import { Portal } from '../Portal/Portal';
import { SCHEDULE_MESSAGE_MENU_ID } from './constants';
import {
  useScheduleMessage,
  useScheduleMessageDialog,
  useSchedulePresets,
} from './hooks';
import { ScheduleMessageDialog as DefaultScheduleMessageDialog } from './ScheduleMessageDialog';
import { ScheduleMessageMenu } from './ScheduleMessageMenu';
import { ScheduleMessageMenuHeader } from './ScheduleMessageMenuHeader';

const getChannelContainer = () => document.getElementById(CHANNEL_CONTAINER_ID);

const getMenuDialogId = (threadId?: string | null) =>
  threadId ? `${SCHEDULE_MESSAGE_MENU_ID}-thread` : SCHEDULE_MESSAGE_MENU_ID;

const ignoreReportedError = () => undefined;

export const ScheduleMessageButton = () => {
  const { t } = useTranslationContext();
  const { IconChevronUp } = useComponentContextIcons();
  const {
    ContextMenu: ContextMenuComponent = ContextMenu,
    Modal = GlobalModal,
    ScheduleMessageDialog = DefaultScheduleMessageDialog,
  } = useComponentContext();

  const { threadId } = useMessageComposerController();
  const hasSendableData = useMessageComposerHasSendableData();
  const scheduleMessage = useScheduleMessage();
  const menuDialogId = getMenuDialogId(threadId);
  const { dialog: menuDialog, dialogManager } = useDialogOnNearestManager({
    id: menuDialogId,
  });
  const isMenuOpen = useDialogIsOpen(menuDialogId, dialogManager?.id);

  const menuButtonRef = useRef<HTMLButtonElement>(null);

  const presets = useSchedulePresets(isMenuOpen);
  const { closeDialog, isDialogOpen, openDialog } =
    useScheduleMessageDialog(menuButtonRef);

  const toggleMenu = useCallback(() => menuDialog.toggle(), [menuDialog]);

  const scheduleAtPreset = useCallback(
    (scheduledAt: Date) => {
      scheduleMessage(scheduledAt).catch(ignoreReportedError);
    },
    [scheduleMessage],
  );

  return (
    <>
      <Button
        appearance='solid'
        aria-expanded={isMenuOpen}
        aria-haspopup='menu'
        aria-label={t('aria/Open schedule message menu')}
        className={clsx('str-chat__schedule-message-button', {
          'str-chat__schedule-message-button--selected': isMenuOpen,
        })}
        data-testid='schedule-message-button'
        disabled={!hasSendableData}
        onClick={toggleMenu}
        ref={menuButtonRef}
        size='sm'
        variant='primary'
      >
        <IconChevronUp />
      </Button>
      <ContextMenuComponent
        allowFlip
        aria-label={t('Schedule message')}
        className='str-chat__schedule-message-menu'
        data-testid='schedule-message-menu'
        dialogManagerId={dialogManager?.id}
        Header={ScheduleMessageMenuHeader}
        id={menuDialogId}
        onClose={menuDialog.close}
        placement='top-end'
        referenceElement={menuButtonRef.current}
        tabIndex={-1}
      >
        <ScheduleMessageMenu
          onCustomTimeSelect={openDialog}
          onPresetSelect={scheduleAtPreset}
          presets={presets}
        />
      </ContextMenuComponent>
      <Portal getPortalDestination={getChannelContainer} isOpen={isDialogOpen}>
        <Modal
          className='str-chat__schedule-message-modal'
          initialFocusStrategy='dialog'
          onClose={closeDialog}
          open={isDialogOpen}
        >
          {isDialogOpen && <ScheduleMessageDialog close={closeDialog} />}
        </Modal>
      </Portal>
    </>
  );
};
