import React from 'react';

import { useTranslationContext } from '../../context';
import { useMessageComposerController } from '../MessageComposer/hooks/useMessageComposerController';
import { useScheduledMessagePreview, useScheduleMessage } from './hooks';
import { ScheduleTimeDialog } from './ScheduleTimeDialog';
import type { ScheduleMessageDialogProps } from './types';

export const ScheduleMessageDialog = ({ close }: ScheduleMessageDialogProps) => {
  const { t } = useTranslationContext();

  const { channel } = useMessageComposerController();
  const previewMessage = useScheduledMessagePreview();
  const scheduleMessage = useScheduleMessage();

  return (
    <ScheduleTimeDialog
      channel={channel}
      close={close}
      errorMessage={t(
        'scheduledMessages.couldntScheduleMessageTryAgain',
        "Couldn't schedule message. Try again",
      )}
      previewMessage={previewMessage}
      submit={scheduleMessage}
      title={t('scheduledMessages.scheduleMessage', 'Schedule message')}
    />
  );
};
