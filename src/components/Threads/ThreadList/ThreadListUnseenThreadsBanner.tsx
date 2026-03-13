import React from 'react';
import clsx from 'clsx';

import type { ThreadManagerState } from 'stream-chat';

import { IconArrowRotateRightLeftRepeatRefresh } from '../../Icons';
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
          <IconArrowRotateRightLeftRepeatRefresh />
          <span>
            {t('ThreadListUnseenThreadsBanner/unreadThreads', {
              count: unseenThreadIds.length,
            })}
          </span>
        </>
      )}
      {isLoading && (
        <>
          <LoadingIndicator />
          <span>{t('ThreadListUnseenThreadsBanner/loading')}</span>
        </>
      )}
    </button>
  );
};
