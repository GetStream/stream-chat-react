import React, { createContext, useContext } from 'react';

import type { Thread } from 'stream-chat';

import { useComponentContext } from '../../../context';
import { ThreadListItemUi as DefaultThreadListItemUi } from './ThreadListItemUi';

export type ThreadListItemProps = {
  thread: Thread;
};

const ThreadListItemContext = createContext<Thread | undefined>(undefined);

export const useThreadListItemContext = () => useContext(ThreadListItemContext);

export const ThreadListItem = ({ thread }: ThreadListItemProps) => {
  const { ThreadListItemUi = DefaultThreadListItemUi } = useComponentContext();

  return (
    <ThreadListItemContext.Provider value={thread}>
      <ThreadListItemUi />
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
