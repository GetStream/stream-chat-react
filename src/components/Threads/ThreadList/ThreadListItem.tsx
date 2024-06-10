import React from 'react';

import type { ComponentPropsWithoutRef, ComponentType } from 'react';
import type { InferStoreValueType, Thread } from 'stream-chat';

import { useSimpleStateStore } from '../hooks/useSimpleStateStore';
import { Avatar } from '../../Avatar';
import { Icon } from '../icons';
import { useChatContext } from '../../../context';

export type ThreadListItemProps = {
  thread: Thread;
  ThreadListItemUi?: ComponentType<ThreadListItemUiProps>;
} & ComponentPropsWithoutRef<'button'>;

export type ThreadListItemUiProps = Omit<ThreadListItemProps, 'ThreadListItemUi'>;

// Bl - business logic
// Ui - user interface

/**
 * TODO:
 * - replace 💬 with proper icon
 * - add selected class name "str-chat__thread-list-item--selected"
 * - maybe hover state? ask design
 * - move styling to CSS library and clean it up (separate layout and theme)
 * - figure out why some data is unavailable/adjust types accordingly
 * - use Moment/DayJs for proper created_at formatting (replace toLocaleTimeString)
 * - handle deleted message
 * - handle markRead when loading a thread
 */

const selector = (nextValue: InferStoreValueType<Thread>) =>
  [
    nextValue.latestReplies.at(-1),
    nextValue.read,
    nextValue.parentMessage,
    nextValue.channelData,
  ] as const;

export const ThreadListItemUi = ({ thread, ...rest }: ThreadListItemUiProps) => {
  const { client } = useChatContext();
  const [latestReply, read, parentMessage, channelData] = useSimpleStateStore(
    thread.state,
    selector,
  );

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const unreadMessagesCount = read[client.user!.id]?.unread_messages ?? 0;

  return (
    <button className='str-chat__thread-list-item' {...rest}>
      <div className='str-chat__thread-list-item__channel'>
        <Icon.MessageBubble className='str-chat__thread-list-item__channel-icon' />
        <div className='str-chat__thread-list-item__channel-text'>{channelData?.name || 'N/A'}</div>
      </div>
      <div className='str-chat__thread-list-item__parent-message'>
        <div className='str-chat__thread-list-item__parent-message-text'>
          replied to: {parentMessage?.text || 'Unknown message'}
        </div>
        {unreadMessagesCount > 0 && (
          <div className='str-chat__thread-list-item__parent-message-unread-count'>
            {unreadMessagesCount}
          </div>
        )}
      </div>
      <div className='str-chat__thread-list-item__latest-reply'>
        <Avatar
          image={latestReply?.user?.image as string | undefined}
          name={latestReply?.user?.name}
        />
        <div className='str-chat__thread-list-item__latest-reply-details'>
          <div className='str-chat__thread-list-item__latest-reply-created-by'>
            {latestReply?.user?.name || latestReply?.user?.id || 'Unknown sender'}
          </div>
          <div className='str-chat__thread-list-item__latest-reply-text-and-timestamp'>
            <div className='str-chat__thread-list-item__latest-reply-text'>
              {latestReply?.text || 'N/A'}
            </div>
            <div className='str-chat__thread-list-item__latest-reply-timestamp'>
              {latestReply?.created_at.toLocaleTimeString() || 'N/A'}
            </div>
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

// const App = () => {
//   const route = useRouter();

//   return (
//     <Chat>
//       {route === '/channels' && (
//         <Channel>
//           <MessageList />
//           <Thread />
//         </Channel>
//       )}
//       {route === '/threads' && (
//         <Threads>
//           <ThreadList />
//           <ThreadProvider>
//             <Thread />
//           </ThreadProvider>
//         </Threads>
//       )}
//     </Chat>
//   );
// };
