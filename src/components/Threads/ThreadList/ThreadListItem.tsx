import React from 'react';

import type { Thread } from 'stream-chat';
import type { ComponentType } from 'react';
import { useSimpleStateStore } from '../hooks/useSimpleStateStore';
import { Avatar } from '../../Avatar';

export type ThreadListItemProps = {
  thread: Thread;
  ThreadListItemUi?: ComponentType<ThreadListItemUiProps>;
};

export type ThreadListItemUiProps = Pick<ThreadListItemProps, 'thread'>;

// Bl - business logic
// Ui - user interface

/**
 * TODO:
 * - replace 💬 with proper icon
 * - add unread count bubble beside parent message
 * - add selected class name "str-chat__thread-list-item--selected"
 * - maybe hover state? ask design
 * - move styling to CSS library and clean it up (separate layout and theme)
 * - figure out why some data is unavailable/adjust types accordingly
 * - use Moment/DayJs for proper created_at formatting (replace toLocaleTimeString)
 */

export const ThreadListItemUi = ({ thread }: ThreadListItemUiProps) => {
  const [latestReply, channelData, parentMessage] = useSimpleStateStore(thread.state, (data) => [
    data.latestReplies.at(-1),
    data.channelData,
    data.parentMessage,
  ]);

  return (
    <button className='str-chat__thread-list-item'>
      <div className='str-chat__thread-list-item__channel'>💬 {channelData.name || 'N/A'}</div>
      <div className='str-chat__thread-list-item__parent-message'>
        replied to: {parentMessage?.text || 'Unknown message'}
      </div>
      <div className='str-chat__thread-list-item__latest-reply-container'>
        <Avatar
          image={latestReply?.user?.image as string | undefined}
          name={latestReply?.user?.name}
          shape='circle'
          size={49}
        />
        <div className='str-chat__thread-list-item__latest-reply-details'>
          <div className='str-chat__thread-list-item__latest-reply-created-by'>
            {latestReply?.user?.name || latestReply?.user?.id || 'Unknown sender'}
          </div>
          <div className='str-chat__thread-list-item__latest-reply-text'>
            <div>{latestReply?.text || 'N/A'}</div>
            <div>{latestReply?.created_at.toLocaleTimeString() || 'N/A'}</div>
          </div>
        </div>
      </div>
    </button>
  );
};

// could be context provider? (to be able to pass down Thread instance and simplify SimpleStore subbing)
export const ThreadListItem = (props: ThreadListItemProps) => {
  const { ThreadListItemUi: PropsThreadListItemUi = ThreadListItemUi, ...rest } = props;

  // useThreadListItemBl();

  return <PropsThreadListItemUi {...rest} />;
};
