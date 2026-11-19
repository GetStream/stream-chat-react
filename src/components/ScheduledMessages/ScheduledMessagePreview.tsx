import React, { useState } from 'react';
import { nsToDate } from 'stream-chat';
import type { ScheduledMessageResponse } from 'stream-chat';

import {
  useComponentContext,
  useComponentContextIcons,
  useTranslationContext,
} from '../../context';
import { Button } from '../Button';
import { useMessageComposerController } from '../MessageComposer/hooks/useMessageComposerController';
import { QuotedMessagePreviewUI } from '../MessageComposer/QuotedMessagePreview';
import { RemoveAttachmentPreviewButton } from '../MessageComposer/RemoveAttachmentPreviewButton';
import { GlobalModal } from '../Modal';
import { useScheduledMessagePreview } from './hooks/useScheduledMessagePreview';
import { useRescheduleDialogProps } from './hooks/useRescheduleDialogProps';
import { ScheduleTimeDialog as DefaultScheduleTimeDialog } from './ScheduleTimeDialog';
import { isFailedScheduledMessage } from './utils';

export type ScheduledMessagePreviewProps = {
  onCancel: () => void;
  scheduledMessage: ScheduledMessageResponse;
};

/**
 * Above the composer while a scheduled message is edited: when it is sent, with a way to change
 * that time. A failed one, scheduled again as a new message, is previewed as the message.
 */
export const ScheduledMessagePreview = ({
  onCancel,
  scheduledMessage,
}: ScheduledMessagePreviewProps) => {
  const { t } = useTranslationContext();
  const { IconClock } = useComponentContextIcons();
  const { Modal = GlobalModal, ScheduleTimeDialog = DefaultScheduleTimeDialog } =
    useComponentContext();
  const { channel } = useMessageComposerController();
  const previewMessage = useScheduledMessagePreview(scheduledMessage);
  const [isRescheduling, setIsRescheduling] = useState(false);
  // the saved copy, until the composer's own copy catches up through the update event
  const [rescheduled, setRescheduled] = useState<ScheduledMessageResponse>();
  const current =
    rescheduled?.id === scheduledMessage.id &&
    rescheduled.updated_at > scheduledMessage.updated_at
      ? rescheduled
      : scheduledMessage;
  const rescheduleDialogProps = useRescheduleDialogProps({
    onRescheduled: setRescheduled,
    previewMessage,
    scheduledMessage: current,
  });

  if (isFailedScheduledMessage(scheduledMessage)) {
    return (
      <QuotedMessagePreviewUI
        authorLabel={t('scheduledMessages.scheduleAgain', 'Schedule again')}
        onRemove={onCancel}
        quotedMessage={previewMessage}
      />
    );
  }

  const sendTime = nsToDate(current.scheduled_at);
  const closeDialog = () => setIsRescheduling(false);

  return (
    <div
      className='str-chat__scheduled-message-preview'
      data-testid='scheduled-message-preview'
    >
      <IconClock className='str-chat__scheduled-message-preview__icon' />
      <time
        className='str-chat__scheduled-message-preview__label'
        dateTime={sendTime.toISOString()}
      >
        {t(
          'scheduledMessages.thisMessageWillBeSentTime',
          'This message will be sent {{ time }}',
          { time: t('timestamp.ScheduledMessageSendTime', { timestamp: sendTime }) },
        )}
      </time>
      <Button
        appearance='ghost'
        className='str-chat__scheduled-message-preview__reschedule-button'
        data-testid='scheduled-message-preview-reschedule-button'
        onClick={() => setIsRescheduling(true)}
        size='xs'
        variant='primary'
      >
        {t('scheduledMessages.reschedule', 'Reschedule')}
      </Button>
      <RemoveAttachmentPreviewButton
        aria-label={t('scheduledMessages.cancelEditing.ariaLabel', 'Cancel editing')}
        data-testid='scheduled-message-preview-cancel-button'
        onClick={onCancel}
      />
      <Modal
        className='str-chat__reschedule-message-modal'
        initialFocusStrategy='dialog'
        onClose={closeDialog}
        open={isRescheduling}
      >
        {isRescheduling && (
          <ScheduleTimeDialog
            channel={channel}
            close={closeDialog}
            {...rescheduleDialogProps}
          />
        )}
      </Modal>
    </div>
  );
};
