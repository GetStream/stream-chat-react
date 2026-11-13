import clsx from 'clsx';
import React, { useCallback, useRef } from 'react';
import type { ScheduledMessageResponse } from 'stream-chat';

import {
  useComponentContext,
  useComponentContextIcons,
  useTranslationContext,
} from '../../context';
import { useChannelCapabilities } from '../Channel/hooks/useChannelCapabilities';
import { useMessageComposerController } from '../MessageComposer/hooks/useMessageComposerController';
import { GlobalModal } from '../Modal';
import { Portal } from '../Portal/Portal';
import { SCHEDULE_MESSAGE_CAPABILITY } from './constants';
import {
  useFailedScheduledMessageCount,
  useScheduledMessageCount,
  useScheduleMessageDialog,
} from './hooks';
import { ScheduledMessageListDialog } from './ScheduledMessageListDialog';
import { getChannelContainer, openScheduledMessageInComposer } from './utils';

export const ScheduledMessagesBanner = () => {
  const { t } = useTranslationContext();
  const { IconClock, IconExclamationMark } = useComponentContextIcons();
  const { Modal = GlobalModal } = useComponentContext();

  const messageComposer = useMessageComposerController();
  const { channel, threadId } = messageComposer;
  const { cid } = channel;
  const channelCapabilities = useChannelCapabilities({ cid });
  const parentId = threadId ?? undefined;
  const scheduledMessageCount = useScheduledMessageCount({ cid, parentId });
  const failedScheduledMessageCount = useFailedScheduledMessageCount({ cid, parentId });

  const viewButtonRef = useRef<HTMLButtonElement>(null);

  const { closeDialog, isDialogOpen, openDialog } =
    useScheduleMessageDialog(viewButtonRef);

  const editScheduledMessage = useCallback(
    (scheduledMessage: ScheduledMessageResponse) => {
      closeDialog();
      openScheduledMessageInComposer(messageComposer, scheduledMessage);
    },
    [closeDialog, messageComposer],
  );

  const hasCapability = channelCapabilities.has(SCHEDULE_MESSAGE_CAPABILITY);
  const hasFailedScheduledMessages = failedScheduledMessageCount > 0;
  const isBannerVisible =
    (hasCapability && scheduledMessageCount > 0) || hasFailedScheduledMessages;
  const scheduledLabel = parentId
    ? t('scheduledMessages.banner.scheduledReplies', {
        count: scheduledMessageCount,
        defaultValue_one: '{{ count }} scheduled reply',
        defaultValue_other: '{{ count }} scheduled replies',
      })
    : t('scheduledMessages.banner.scheduledMessages', {
        count: scheduledMessageCount,
        defaultValue_one: '{{ count }} scheduled message',
        defaultValue_other: '{{ count }} scheduled messages',
      });
  const label = hasFailedScheduledMessages
    ? t('scheduledMessages.banner.failedToSend', {
        count: failedScheduledMessageCount,
        defaultValue_one: '{{ count }} failed to send',
        defaultValue_other: '{{ count }} failed to send',
      })
    : scheduledLabel;
  const BannerIcon = hasFailedScheduledMessages ? IconExclamationMark : IconClock;

  if (!isBannerVisible && !isDialogOpen) return null;

  return (
    <>
      {isBannerVisible && (
        <div
          className={clsx('str-chat__scheduled-messages-banner', {
            'str-chat__scheduled-messages-banner--failed': hasFailedScheduledMessages,
          })}
          data-testid='scheduled-messages-banner'
        >
          <BannerIcon className='str-chat__scheduled-messages-banner__icon' />
          <span className='str-chat__scheduled-messages-banner__label'>{label}</span>
          <button
            className='str-chat__scheduled-messages-banner__view-button'
            onClick={openDialog}
            ref={viewButtonRef}
            type='button'
          >
            {t('scheduledMessages.viewAll', 'View all')}
          </button>
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
              onEdit={editScheduledMessage}
              parentId={parentId}
            />
          )}
        </Modal>
      </Portal>
    </>
  );
};
