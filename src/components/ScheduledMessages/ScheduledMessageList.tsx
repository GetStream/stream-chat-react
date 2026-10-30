import React from 'react';

import { useComponentContext, useTranslationContext } from '../../context';
import { Button } from '../Button';
import { LoadingIndicator } from '../Loading';
import { useScheduledMessageGroups, useScheduledMessagesPagination } from './hooks';
import { ScheduledMessageGroupHeader } from './ScheduledMessageGroupHeader';
import { ScheduledMessageItem as DefaultScheduledMessageItem } from './ScheduledMessageItem';
import { ScheduledMessagesEmptyList } from './ScheduledMessagesEmptyList';
import type { ScheduledMessageListProps } from './types';

export const ScheduledMessageList = ({ cid, parentId }: ScheduledMessageListProps) => {
  const { t } = useTranslationContext();
  const { ScheduledMessageItem = DefaultScheduledMessageItem } = useComponentContext();

  const { groups } = useScheduledMessageGroups({ cid, parentId });
  const { canLoadMore, isLoading, loadMore } = useScheduledMessagesPagination();

  if (!groups.length) {
    return isLoading ? <LoadingIndicator /> : <ScheduledMessagesEmptyList />;
  }

  return (
    <div
      className='str-chat__scheduled-message-list'
      data-testid='scheduled-message-list'
    >
      {groups.map((group) => (
        <section className='str-chat__scheduled-message-group' key={group.id}>
          <ScheduledMessageGroupHeader group={group} />
          <ul className='str-chat__scheduled-message-group__items'>
            {group.scheduledMessages.map((scheduledMessage) => (
              <li
                className='str-chat__scheduled-message-group__item'
                key={scheduledMessage.id}
              >
                <ScheduledMessageItem scheduledMessage={scheduledMessage} />
              </li>
            ))}
          </ul>
        </section>
      ))}
      {canLoadMore && (
        <Button
          appearance='ghost'
          className='str-chat__scheduled-message-list__load-more'
          disabled={isLoading}
          onClick={loadMore}
          size='sm'
          variant='secondary'
        >
          {t('Load more')}
        </Button>
      )}
    </div>
  );
};
