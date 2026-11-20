import React, { useCallback, useState } from 'react';
import type { ChangeEvent } from 'react';

import {
  useComponentContext,
  useComponentContextIcons,
  useTranslationContext,
} from '../../context';
import { Prompt } from '../Dialog';
import { TextInput } from '../Form';
import { useScheduledMessageCount } from './hooks';
import { ScheduledMessageList as DefaultScheduledMessageList } from './ScheduledMessageList';
import type { ScheduledMessageListDialogProps } from './types';

export const ScheduledMessageListDialog = ({
  cid,
  close,
  onEdit,
  parentId,
}: ScheduledMessageListDialogProps) => {
  const { t } = useTranslationContext();
  const { IconSearch } = useComponentContextIcons();
  const { ScheduledMessageList = DefaultScheduledMessageList } = useComponentContext();

  const scheduledMessageCount = useScheduledMessageCount({ cid, parentId });

  const [searchQuery, setSearchQuery] = useState('');

  const updateSearchQuery = useCallback(
    ({ target }: ChangeEvent<HTMLInputElement>) => setSearchQuery(target.value),
    [],
  );

  const title = parentId
    ? t('scheduledMessages.scheduledReplies', 'Scheduled replies')
    : t('scheduledMessages.scheduledMessages', 'Scheduled messages');

  return (
    <Prompt.Root
      className='str-chat__scheduled-message-list-dialog'
      data-testid='scheduled-message-list-dialog'
    >
      <Prompt.Header close={close} title={title} />
      <Prompt.Body className='str-chat__scheduled-message-list-dialog__body'>
        {scheduledMessageCount > 0 && (
          <TextInput
            aria-label={t('scheduledMessages.search', 'Search')}
            autoComplete='off'
            className='str-chat__scheduled-message-list-dialog__search'
            leading={<IconSearch />}
            onChange={updateSearchQuery}
            placeholder={t('scheduledMessages.search', 'Search')}
            type='search'
            value={searchQuery}
          />
        )}
        <ScheduledMessageList
          cid={cid}
          onEdit={onEdit}
          parentId={parentId}
          searchQuery={searchQuery}
        />
      </Prompt.Body>
    </Prompt.Root>
  );
};
