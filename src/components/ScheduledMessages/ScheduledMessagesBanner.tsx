import clsx from 'clsx';
import React, { useEffect, useRef, useState } from 'react';
import { nsToDate, Thread } from 'stream-chat';
import type {
  MessageComposerState,
  PaginatorState,
  ScheduledMessageResponse,
} from 'stream-chat';

import {
  useComponentContext,
  useComponentContextIcons,
  useTranslationContext,
} from '../../context';
import { useStateStore } from '../../store';
import { useAriaLiveAnnouncer } from '../Accessibility';
import { useChannelCapabilities } from '../Channel/hooks/useChannelCapabilities';
import { useMessageComposerController } from '../MessageComposer/hooks/useMessageComposerController';
import { SCHEDULE_MESSAGE_CAPABILITY, useScheduledMessages } from './hooks';
import { ScheduledMessageListDialog as DefaultScheduledMessageListDialog } from './ScheduledMessageListDialog';
import { isFailedScheduledMessage } from './utils';

const selectIsLoaded = ({ items }: PaginatorState<ScheduledMessageResponse>) => ({
  isLoaded: items !== undefined,
});

// hidden for a failed scheduled message open in the composer too
const selectIsEditing = ({
  editedMessage,
  editedScheduledMessage,
}: MessageComposerState) => ({
  isEditing: !!editedMessage || !!editedScheduledMessage,
});

/**
 * Above the composer: when the only scheduled message in the channel (or thread) is sent, how many
 * are scheduled, or how many failed. "View all" opens the `ScheduledMessageListDialog` slot. Hidden
 * while the composer edits a message; its changes are announced to screen readers.
 */
export const ScheduledMessagesBanner = () => {
  const { t } = useTranslationContext();
  const { IconClock, IconExclamationMark } = useComponentContextIcons();
  const { ScheduledMessageListDialog = DefaultScheduledMessageListDialog } =
    useComponentContext();
  const messageComposer = useMessageComposerController();
  const { channel, compositionContext } = messageComposer;
  // a thread's composer lists the thread's scheduled replies
  const view =
    compositionContext instanceof Thread
      ? compositionContext.scheduledMessages
      : channel.scheduledMessages;
  const { parentId } = view;
  const canSchedule = useChannelCapabilities({ cid: channel.cid }).has(
    SCHEDULE_MESSAGE_CAPABILITY,
  );
  const { scheduledMessages } = useScheduledMessages(view);
  const { isLoaded } = useStateStore(view.paginator.state, selectIsLoaded);
  const { isEditing } = useStateStore(messageComposer.state, selectIsEditing);
  const announce = useAriaLiveAnnouncer();
  const announcedLabelRef = useRef<string>(undefined);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const failedCount = scheduledMessages.filter(isFailedScheduledMessage).length;
  const isVisible =
    !isEditing && (failedCount > 0 || (canSchedule && scheduledMessages.length > 0));
  const [onlyScheduledMessage] = scheduledMessages.length === 1 ? scheduledMessages : [];

  const label = failedCount
    ? t('scheduledMessages.banner.failedToSend', {
        count: failedCount,
        defaultValue_one: '{{ count }} failed to send',
        defaultValue_other: '{{ count }} failed to send',
      })
    : onlyScheduledMessage
      ? t('scheduledMessages.banner.scheduledFor', 'Scheduled for {{ time }}', {
          time: t('timestamp.ScheduledMessageConfirmation', {
            timestamp: nsToDate(onlyScheduledMessage.scheduled_at),
          }),
        })
      : parentId
        ? t('scheduledMessages.banner.scheduledReplies', {
            count: scheduledMessages.length,
            defaultValue_one: '{{ count }} scheduled reply',
            defaultValue_other: '{{ count }} scheduled replies',
          })
        : t('scheduledMessages.banner.scheduledMessages', {
            count: scheduledMessages.length,
            defaultValue_one: '{{ count }} scheduled message',
            defaultValue_other: '{{ count }} scheduled messages',
          });
  const announcedLabel = isVisible ? label : undefined;

  // a change, such as a message just scheduled or failed; not the banner the list loaded with
  useEffect(() => {
    if (!isLoaded) {
      announcedLabelRef.current = undefined;
      return;
    }
    const previousLabel = announcedLabelRef.current;
    announcedLabelRef.current = announcedLabel ?? '';
    if (
      previousLabel === undefined ||
      !announcedLabel ||
      previousLabel === announcedLabel
    )
      return;
    announce(announcedLabel);
  }, [announce, announcedLabel, isLoaded]);

  if (!isVisible && !isDialogOpen) return null;

  const closeDialog = () => setIsDialogOpen(false);
  const editScheduledMessage = (scheduledMessage: ScheduledMessageResponse) => {
    closeDialog();
    messageComposer.editScheduledMessage(scheduledMessage);
  };

  const Icon = failedCount ? IconExclamationMark : IconClock;

  return (
    <>
      {isVisible && (
        <div
          className={clsx('str-chat__scheduled-messages-banner', {
            'str-chat__scheduled-messages-banner--failed': failedCount > 0,
          })}
          data-testid='scheduled-messages-banner'
        >
          <Icon className='str-chat__scheduled-messages-banner__icon' />
          <span className='str-chat__scheduled-messages-banner__label'>{label}</span>
          <button
            className='str-chat__scheduled-messages-banner__view-button'
            onClick={() => setIsDialogOpen(true)}
            type='button'
          >
            {onlyScheduledMessage && !failedCount
              ? t('scheduledMessages.view', 'View')
              : t('scheduledMessages.viewAll', 'View all')}
          </button>
        </div>
      )}
      <ScheduledMessageListDialog
        close={closeDialog}
        onEdit={editScheduledMessage}
        open={isDialogOpen}
        scheduledMessages={view}
      />
    </>
  );
};
