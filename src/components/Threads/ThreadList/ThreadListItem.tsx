import React, { createContext, useContext } from 'react';

import type { ComponentPropsWithoutRef, ComponentType } from 'react';
import { InferStoreValueType, Thread } from 'stream-chat';

import { useSimpleStateStore } from '../hooks/useSimpleStateStore';
import { Avatar } from '../../Avatar';
import { Icon } from '../icons';
import { useChatContext } from '../../../context';
import { useThreadsViewContext } from '../../Views';
import clsx from 'clsx';

export type ThreadListItemProps = {
  thread: Thread;
  ThreadListItemUi?: ComponentType<ThreadListItemUiProps>;
};

export type ThreadListItemUiProps = ComponentPropsWithoutRef<'button'>;

// Bl - business logic
// Ui - user interface

/**
 * TODO:
 * - add selected class name "str-chat__thread-list-item--selected"
 * - maybe hover state? ask design
 * - move styling to CSS library and clean it up (separate layout and theme)
 * - figure out why some data is unavailable/adjust types accordingly
 * - use Moment/DayJs for proper created_at formatting (replace toLocaleTimeString)
 * - handle deleted message [in progress]
 * - handle markRead when loading a thread
 */

const selector = (nextValue: InferStoreValueType<Thread>) =>
  [
    nextValue.latestReplies.at(-1),
    nextValue.read,
    nextValue.parentMessage,
    nextValue.channelData,
    nextValue.deletedAt,
  ] as const;

export const ThreadListItemUi = (props: ThreadListItemUiProps) => {
  const { client } = useChatContext();
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const thread = useThreadListItemContext()!;
  const [latestReply, read, parentMessage, channelData, deletedAt] = useSimpleStateStore(
    thread.state,
    selector,
  );

  const { activeThread, setActiveThread } = useThreadsViewContext();

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const unreadMessagesCount = read[client.user!.id]?.unread_messages ?? 0;
  const avatarProps = deletedAt ? null : latestReply?.user;

  return (
    <button
      className={clsx('str-chat__thread-list-item', {
        'str-chat__thread-list-item--active': activeThread === thread,
      })}
      onPointerDown={() => setActiveThread(thread)}
      {...props}
    >
      <div className='str-chat__thread-list-item__channel'>
        <Icon.MessageBubble className='str-chat__thread-list-item__channel-icon' />
        <div className='str-chat__thread-list-item__channel-text'>{channelData?.name || 'N/A'}</div>
      </div>
      <div className='str-chat__thread-list-item__parent-message'>
        <div className='str-chat__thread-list-item__parent-message-text'>
          replied to: {parentMessage?.text || 'Unknown message'}
        </div>
        {unreadMessagesCount > 0 && !deletedAt && (
          <div className='str-chat__thread-list-item__parent-message-unread-count'>
            {unreadMessagesCount}
          </div>
        )}
      </div>
      <div className='str-chat__thread-list-item__latest-reply'>
        <Avatar {...avatarProps} />
        <div className='str-chat__thread-list-item__latest-reply-details'>
          {!deletedAt && (
            <div className='str-chat__thread-list-item__latest-reply-created-by'>
              {latestReply?.user?.name || latestReply?.user?.id || 'Unknown sender'}
            </div>
          )}
          <div className='str-chat__thread-list-item__latest-reply-text-and-timestamp'>
            <div className='str-chat__thread-list-item__latest-reply-text'>
              {deletedAt ? 'This thread has been deleted' : latestReply?.text || 'N/A'}
            </div>
            <div className='str-chat__thread-list-item__latest-reply-timestamp'>
              {deletedAt
                ? deletedAt.toLocaleTimeString()
                : latestReply?.created_at.toLocaleTimeString() || 'N/A'}
            </div>
          </div>
        </div>
      </div>
    </button>
  );
};

const ThreadListItemContext = createContext<Thread | undefined>(undefined);

export const useThreadListItemContext = () => useContext(ThreadListItemContext);

export const ThreadListItem = (props: ThreadListItemProps) => {
  const { ThreadListItemUi: PropsThreadListItemUi = ThreadListItemUi, thread } = props;

  // useThreadListItemBl();

  return (
    <ThreadListItemContext.Provider value={thread}>
      <PropsThreadListItemUi />
    </ThreadListItemContext.Provider>
  );
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

// pre-built layout

{
  /* 
<Chat client={chatClient}>
  <Views>
    // has default
    <ViewSelector onItemPointerDown={} />
    <View.Chat>
      <Channel>
        <MessageList />
        <MessageInput />
      </Channel>
    </View.Chat>
    <View.Thread> <-- activeThread state
      <ThreadList /> <-- uses context for click handler
      <WrappedThread /> <-- ThreadProvider + Channel combo
    </View.Thread>
  </Views>
</Chat>;
*/
}
