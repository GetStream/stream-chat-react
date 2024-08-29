import React from 'react';

import type { ThreadManagerState } from 'stream-chat';

import { Icon } from '../icons';
import { useChatContext } from '../../../context';
import { useStateStore } from '../hooks/useStateStore';

const selector = (nextValue: ThreadManagerState) => [nextValue.unseenThreadIds] as const;

export const ThreadListUnseenThreadsBanner = () => {
  const { client } = useChatContext();
  const [unseenThreadIds] = useStateStore(client.threads.state, selector);

  if (!unseenThreadIds.length) return null;

  return (
    <div className='str-chat__unseen-threads-banner'>
      {/* TODO: translate */}
      {unseenThreadIds.length} unread threads
      <button
        className='str-chat__unseen-threads-banner__button'
        onClick={() => client.threads.reload()}
      >
        <Icon.Reload />
      </button>
    </div>
  );
};
