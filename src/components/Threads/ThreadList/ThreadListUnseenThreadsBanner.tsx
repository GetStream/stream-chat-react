import React from 'react';

import type { ThreadManagerState } from 'stream-chat';

import { IconArrowRotateClockwise } from '../../Icons';
import { useChatContext } from '../../../context';
import { useStateStore } from '../../../store';

const selector = (nextValue: ThreadManagerState) => ({
  unseenThreadIds: nextValue.unseenThreadIds,
});

export const ThreadListUnseenThreadsBanner = () => {
  const { client } = useChatContext();
  const { unseenThreadIds } = useStateStore(client.threads.state, selector);

  if (!unseenThreadIds.length) return null;

  return (
    <div className='str-chat__unseen-threads-banner'>
      {/* TODO: translate */}
      {unseenThreadIds.length} unread threads
      <button
        className='str-chat__unseen-threads-banner__button'
        onClick={() => client.threads.reload()}
      >
        <IconArrowRotateClockwise />
      </button>
    </div>
  );
};
