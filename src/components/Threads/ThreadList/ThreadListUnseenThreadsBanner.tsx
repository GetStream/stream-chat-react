import React from 'react';
import clsx from 'clsx';

import type { ThreadManagerState } from 'stream-chat';

import { IconRefresh } from '../../Icons';
import { useChatContext, useTranslationContext } from '../../../context';
import { useStateStore } from '../../../store';
import { LoadingIndicator } from '../../Loading';

const selector = (nextValue: ThreadManagerState) => ({
  isLoading: nextValue.pagination.isLoading,
  unseenThreadIds: nextValue.unseenThreadIds,
});

export const ThreadListUnseenThreadsBanner = () => {
  const { client } = useChatContext();
  const { t } = useTranslationContext();
  const { isLoading, unseenThreadIds } = useStateStore(client.threads.state, selector);

  if (!unseenThreadIds.length) return null;

  return (
    <button
      className={clsx('str-chat__unseen-threads-banner', {
        'str-chat__unseen-threads-banner--loading': isLoading,
      })}
      disabled={isLoading}
      onClick={() => client.threads.reload()}
    >
      {!isLoading && (
        <>
          <IconRefresh />
          <span>
            {t('threadList.unseenBanner.unreadThreads', {
              count: unseenThreadIds.length,
              defaultValue_one: '{{ count }} unread thread',
              defaultValue_other: '{{ count }} unread threads',
            })}
          </span>
        </>
      )}
      {isLoading && (
        <>
          <LoadingIndicator />
          <span>{t('threadList.unseenBanner.loading', 'Loading...')}</span>
        </>
      )}
    </button>
  );
};
