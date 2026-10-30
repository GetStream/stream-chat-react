import React, { useRef } from 'react';

import {
  useChannelStateContext,
  useComponentContext,
  useComponentContextIcons,
  useTranslationContext,
} from '../../context';
import { Button } from '../Button';
import { useMessageComposerController } from '../MessageComposer/hooks/useMessageComposerController';
import { GlobalModal } from '../Modal';
import { Portal } from '../Portal/Portal';
import { SCHEDULE_MESSAGE_CAPABILITY } from './constants';
import { useScheduledMessageCount, useScheduleMessageDialog } from './hooks';
import { ScheduledMessageListDialog } from './ScheduledMessageListDialog';
import { getChannelContainer } from './utils';

export const ScheduledMessagesBanner = () => {
  const { t } = useTranslationContext();
  const { IconChevronRight, IconClock } = useComponentContextIcons();
  const { Modal = GlobalModal } = useComponentContext();
  const { channelCapabilities } = useChannelStateContext('ScheduledMessagesBanner');

  const { channel, threadId } = useMessageComposerController();
  const { cid } = channel;
  const parentId = threadId ?? undefined;
  const scheduledMessageCount = useScheduledMessageCount({ cid, parentId });

  const viewButtonRef = useRef<HTMLButtonElement>(null);

  const { closeDialog, isDialogOpen, openDialog } =
    useScheduleMessageDialog(viewButtonRef);

  const hasCapability = !!channelCapabilities[SCHEDULE_MESSAGE_CAPABILITY];
  const isBannerVisible = hasCapability && scheduledMessageCount > 0;
  const label = parentId
    ? t('{{ count }} scheduled replies', { count: scheduledMessageCount })
    : t('{{ count }} scheduled messages', { count: scheduledMessageCount });

  if (!isBannerVisible && !isDialogOpen) return null;

  return (
    <>
      {isBannerVisible && (
        <div
          className='str-chat__scheduled-messages-banner'
          data-testid='scheduled-messages-banner'
        >
          <IconClock className='str-chat__scheduled-messages-banner__icon' />
          <span className='str-chat__scheduled-messages-banner__label'>{label}</span>
          <Button
            appearance='ghost'
            className='str-chat__scheduled-messages-banner__view-button'
            onClick={openDialog}
            ref={viewButtonRef}
            size='sm'
            variant='secondary'
          >
            {t('View')}
            <IconChevronRight />
          </Button>
        </div>
      )}
      <Portal getPortalDestination={getChannelContainer} isOpen={isDialogOpen}>
        <Modal
          className='str-chat__scheduled-message-list-modal'
          onClose={closeDialog}
          open={isDialogOpen}
        >
          {isDialogOpen && (
            <ScheduledMessageListDialog
              cid={cid}
              close={closeDialog}
              parentId={parentId}
            />
          )}
        </Modal>
      </Portal>
    </>
  );
};
