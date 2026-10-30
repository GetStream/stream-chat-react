import React from 'react';

import { useTranslationContext } from '../../context';
import { Prompt } from '../Dialog';
import { ScheduledMessageList } from './ScheduledMessageList';
import type { ScheduledMessageListDialogProps } from './types';

export const ScheduledMessageListDialog = ({
  cid,
  close,
  parentId,
}: ScheduledMessageListDialogProps) => {
  const { t } = useTranslationContext();

  const title = parentId ? t('Scheduled replies') : t('Scheduled messages');

  return (
    <Prompt.Root
      className='str-chat__scheduled-message-list-dialog'
      data-testid='scheduled-message-list-dialog'
    >
      <Prompt.Header close={close} title={title} />
      <Prompt.Body className='str-chat__scheduled-message-list-dialog__body'>
        <ScheduledMessageList cid={cid} parentId={parentId} />
      </Prompt.Body>
    </Prompt.Root>
  );
};
