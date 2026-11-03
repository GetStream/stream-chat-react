import React, { useCallback, useState } from 'react';
import type { ChangeEvent } from 'react';

import { useComponentContextIcons, useTranslationContext } from '../../context';
import { Prompt } from '../Dialog';
import { TextInput } from '../Form';
import { useScheduledMessageCount } from './hooks';
import { ScheduledMessageList } from './ScheduledMessageList';
import type { ScheduledMessageListDialogProps } from './types';

export const ScheduledMessageListDialog = ({
  cid,
  close,
  parentId,
}: ScheduledMessageListDialogProps) => {
  const { t } = useTranslationContext();
  const { IconSearch } = useComponentContextIcons();

  const scheduledMessageCount = useScheduledMessageCount({ cid, parentId });

  const [searchQuery, setSearchQuery] = useState('');

  const updateSearchQuery = useCallback(
    ({ target }: ChangeEvent<HTMLInputElement>) => setSearchQuery(target.value),
    [],
  );

  const title = parentId ? t('Scheduled replies') : t('Scheduled messages');

  return (
    <Prompt.Root
      className='str-chat__scheduled-message-list-dialog'
      data-testid='scheduled-message-list-dialog'
    >
      <Prompt.Header close={close} title={title} />
      <Prompt.Body className='str-chat__scheduled-message-list-dialog__body'>
        {scheduledMessageCount > 0 && (
          <TextInput
            aria-label={t('Search')}
            autoComplete='off'
            className='str-chat__scheduled-message-list-dialog__search'
            leading={<IconSearch />}
            onChange={updateSearchQuery}
            placeholder={t('Search')}
            type='search'
            value={searchQuery}
          />
        )}
        <ScheduledMessageList cid={cid} parentId={parentId} searchQuery={searchQuery} />
      </Prompt.Body>
    </Prompt.Root>
  );
};
