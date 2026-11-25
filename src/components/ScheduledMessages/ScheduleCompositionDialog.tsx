import React from 'react';
import type { LocalMessage } from 'stream-chat';

import { useComponentContext, useTranslationContext } from '../../context';
import { CHANNEL_CONTAINER_ID } from '../Channel/constants';
import { useMessageComposerController } from '../MessageComposer/hooks/useMessageComposerController';
import { GlobalModal } from '../Modal';
import { Portal } from '../Portal/Portal';
import { useScheduleComposition } from './hooks/useScheduleComposition';
import { ScheduleTimeDialog as DefaultScheduleTimeDialog } from './ScheduleTimeDialog';
import { getScheduleTimeDialogId } from './utils';

const getChannelContainer = () => document.getElementById(CHANNEL_CONTAINER_ID);

export type ScheduleCompositionDialogProps = {
  onClose: () => void;
  previewMessage?: LocalMessage;
};

export const ScheduleCompositionDialog = ({
  onClose,
  previewMessage,
}: ScheduleCompositionDialogProps) => {
  const { t } = useTranslationContext();
  const { Modal = GlobalModal, ScheduleTimeDialog = DefaultScheduleTimeDialog } =
    useComponentContext();
  const messageComposer = useMessageComposerController();
  const { scheduleMessageFromDialog } = useScheduleComposition();

  return (
    <Portal getPortalDestination={getChannelContainer} isOpen={!!previewMessage}>
      <Modal
        className='str-chat__schedule-message-modal'
        dialogId={getScheduleTimeDialogId(messageComposer)}
        initialFocusStrategy='dialog'
        onClose={onClose}
        open={!!previewMessage}
      >
        {previewMessage && (
          <ScheduleTimeDialog
            channel={messageComposer.channel}
            close={onClose}
            errorMessage={t(
              'scheduledMessages.couldntScheduleMessageTryAgain',
              "Couldn't schedule message. Try again",
            )}
            previewMessage={previewMessage}
            submit={scheduleMessageFromDialog}
            title={t('scheduledMessages.scheduleMessage', 'Schedule message')}
          />
        )}
      </Modal>
    </Portal>
  );
};
