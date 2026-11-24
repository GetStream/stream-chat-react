import React from 'react';

import { useComponentContext, useTranslationContext } from '../../context';
import { Button } from '../Button';
import {
  useScheduledMessageGroups,
  useScheduledMessagesLoadState,
  useScheduledMessagesPagination,
} from './hooks';
import { ScheduledMessageListEmpty, ScheduledMessageListLoadError } from './ListStates';
import { ScheduledMessageGroupHeader } from './ScheduledMessageGroupHeader';
import { ScheduledMessageItem as DefaultScheduledMessageItem } from './ScheduledMessageItem';
import { ScheduledMessageListLoading } from './ScheduledMessageListLoading';
import { ScheduledMessagesNoResults } from './ScheduledMessagesNoResults';
import type { ScheduledMessageListProps } from './types';

export const ScheduledMessageList = ({
  cid,
  onEdit,
  parentId,
  searchQuery,
}: ScheduledMessageListProps) => {
  const { t } = useTranslationContext();
  const {
    ListEmptyUI = ScheduledMessageListEmpty,
    ListFirstPageLoadingUI = ScheduledMessageListLoading,
    ListLoadErrorUI = ScheduledMessageListLoadError,
    ScheduledMessageItem = DefaultScheduledMessageItem,
  } = useComponentContext();

  const { groups, hasScheduledMessages } = useScheduledMessageGroups({
    cid,
    parentId,
    searchQuery,
  });
  const { canLoadMore, isLoading, loadMore } = useScheduledMessagesPagination({ cid });
  const { error, isFirstLoad, isRetrying, retry } = useScheduledMessagesLoadState({
    cid,
  });

  if (!groups.length) {
    if (hasScheduledMessages) return <ScheduledMessagesNoResults />;

    if (isFirstLoad) return <ListFirstPageLoadingUI />;

    if (error)
      return <ListLoadErrorUI error={error} isRetrying={isRetrying} retry={retry} />;

    return <ListEmptyUI />;
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
                <ScheduledMessageItem
                  onEdit={onEdit}
                  scheduledMessage={scheduledMessage}
                />
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
          {t('scheduledMessages.loadMore', 'Load more')}
        </Button>
      )}
    </div>
  );
};
