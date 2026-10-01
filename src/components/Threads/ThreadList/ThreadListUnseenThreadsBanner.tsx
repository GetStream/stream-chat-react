import React, { useCallback, useEffect, useRef, useState } from 'react';
import clsx from 'clsx';

import type { ThreadManagerState } from 'stream-chat';

import {
  useChatContext,
  useComponentContextIcons,
  useTranslationContext,
} from '../../../context';
import { useStateStore } from '../../../store';
import { LoadingIndicator } from '../../Loading';

const selector = (nextValue: ThreadManagerState) => ({
  unseenThreadIds: nextValue.unseenThreadIds,
});

export const ThreadListUnseenThreadsBanner = () => {
  const { IconRefresh } = useComponentContextIcons();
  const { client } = useChatContext();
  const { t } = useTranslationContext();
  const { unseenThreadIds } = useStateStore(client.threads.state, selector);
  // A reload of a loaded list publishes no loading state, so the pending reload is tracked here.
  const [isLoading, setIsLoading] = useState(false);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const reload = useCallback(async () => {
    setIsLoading(true);
    try {
      await client.threads.reload();
    } finally {
      if (isMounted.current) setIsLoading(false);
    }
  }, [client]);

  if (!unseenThreadIds.length) return null;

  return (
    <button
      className={clsx('str-chat__unseen-threads-banner', {
        'str-chat__unseen-threads-banner--loading': isLoading,
      })}
      disabled={isLoading}
      onClick={reload}
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
