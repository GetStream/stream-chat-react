import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { ThreadProvider } from '../Threads';

import type { PropsWithChildren } from 'react';
import type { Thread } from 'stream-chat';

const availableChatViews = ['channels', 'threads'] as const;

type ChatViewContextValue = {
  activeChatView: typeof availableChatViews[number];
  setActiveChatView: (cv: ChatViewContextValue['activeChatView']) => void;
};

const ChatViewContext = createContext<ChatViewContextValue>({
  activeChatView: 'channels',
  setActiveChatView: () => undefined,
});

export const ChatView = ({ children }: PropsWithChildren) => {
  const [activeChatView, setActiveChatView] = useState<ChatViewContextValue['activeChatView']>(
    'channels',
  );

  const value = useMemo(() => ({ activeChatView, setActiveChatView }), [activeChatView]);

  return (
    <ChatViewContext.Provider value={value}>
      <div className='str-chat str-chat__chat-view'>{children}</div>
    </ChatViewContext.Provider>
  );
};

const ChannelsView = ({ children }: PropsWithChildren) => {
  const { activeChatView } = useContext(ChatViewContext);

  if (activeChatView !== 'channels') return null;

  return <div className='str-chat__chat-view__channels'>{children}</div>;
};

export type ThreadsViewContextValue = {
  activeThread: Thread | undefined;
  setActiveThread: (cv: ThreadsViewContextValue['activeThread']) => void;
};

const ThreadsViewContext = createContext<ThreadsViewContextValue>({
  activeThread: undefined,
  setActiveThread: () => undefined,
});

export const useThreadsViewContext = () => useContext(ThreadsViewContext);

const ThreadsView = ({ children }: PropsWithChildren) => {
  const { activeChatView } = useContext(ChatViewContext);
  const [activeThread, setActiveThread] = useState<ThreadsViewContextValue['activeThread']>(
    undefined,
  );

  const value = useMemo(() => ({ activeThread, setActiveThread }), [activeThread]);

  if (activeChatView !== 'threads') return null;

  return (
    <ThreadsViewContext.Provider value={value}>
      <div className='str-chat__chat-view__threads'>{children}</div>
    </ThreadsViewContext.Provider>
  );
};

// thread business logic that's impossible to keep within client but encapsulated for ease of use
const useThreadBl = ({ thread }: { thread?: Thread }) => {
  useEffect(() => {
    if (!thread) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && document.hasFocus()) {
        thread.activate();
        thread.markAsRead();
      }
      if (document.visibilityState === 'hidden' || !document.hasFocus()) {
        thread.deactivate();
      }
    };

    handleVisibilityChange();

    window.addEventListener('focus', handleVisibilityChange);
    window.addEventListener('blur', handleVisibilityChange);
    return () => {
      thread.deactivate();
      window.addEventListener('blur', handleVisibilityChange);
      window.removeEventListener('focus', handleVisibilityChange);
    };
  }, [thread]);
};
// ThreadList under View.Threads context, will access setting function and on item click will set activeThread
// which can be accessed for the ease of use by ThreadAdapter which forwards it to required ThreadProvider
// ThreadList can easily live without this context and click handler can be overriden, ThreadAdapter is then no longer needed
/**
 * // this setup still works
 * const MyCustomComponent = () => {
 *  const [activeThread, setActiveThread] = useState();
 *
 *  return <>
 *    // simplified
 *    <ThreadList onItemPointerDown={setActiveThread} />
 *    <ThreadProvider thread={activeThread}>
 *      <Thread />
 *    </ThreadProvider>
 *  </>
 * }
 *
 */
const ThreadAdapter = ({ children }: PropsWithChildren) => {
  const { activeThread } = useThreadsViewContext();

  useThreadBl({ thread: activeThread });

  return <ThreadProvider thread={activeThread}>{children}</ThreadProvider>;
};

const ChatViewSelector = () => {
  const { setActiveChatView } = useContext(ChatViewContext);

  return (
    <ul className='str-chat__chat-view__selector'>
      <li>
        <button onPointerDown={() => setActiveChatView('channels')}>Channels</button>
      </li>
      <li>
        <button onPointerDown={() => setActiveChatView('threads')}>Threads</button>
      </li>
    </ul>
  );
};

ChatView.Channels = ChannelsView;
ChatView.Threads = ThreadsView;
ChatView.ThreadAdapter = ThreadAdapter;
ChatView.Selector = ChatViewSelector;
