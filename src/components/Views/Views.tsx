import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { ThreadProvider } from '../Threads';

import type { PropsWithChildren } from 'react';
import type { Thread } from 'stream-chat';

const availableViews = ['channel', 'threads'] as const;

type ViewsContextValue = {
  activeView: typeof availableViews[number];
  setActiveView: (cv: ViewsContextValue['activeView']) => void;
};

const ViewsContext = createContext<ViewsContextValue>({
  activeView: 'channel',
  setActiveView: () => undefined,
});

export const Views = ({ children }: PropsWithChildren) => {
  const [activeView, setActiveView] = useState<ViewsContextValue['activeView']>('channel');

  const value = useMemo(() => ({ activeView, setActiveView }), [activeView]);

  return (
    <ViewsContext.Provider value={value}>
      <div className='str-chat str-chat__views'>{children}</div>
    </ViewsContext.Provider>
  );
};

const ChannelView = ({ children }: PropsWithChildren) => {
  const { activeView } = useContext(ViewsContext);

  if (activeView !== 'channel') return null;

  return <div className='str-chat__views__channel'>{children}</div>;
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
  const { activeView } = useContext(ViewsContext);
  const [activeThread, setActiveThread] = useState<ThreadsViewContextValue['activeThread']>(
    undefined,
  );

  const value = useMemo(() => ({ activeThread, setActiveThread }), [activeThread]);

  if (activeView !== 'threads') return null;

  return (
    <ThreadsViewContext.Provider value={value}>
      <div className='str-chat__views__threads'>{children}</div>
    </ThreadsViewContext.Provider>
  );
};

const ThreadAdapter = ({ children }: PropsWithChildren) => {
  const { activeThread } = useThreadsViewContext();

  useEffect(() => {
    activeThread?.markAsRead();
  }, [activeThread]);

  return <ThreadProvider thread={activeThread}>{children}</ThreadProvider>;
};

const ViewSelector = () => {
  const { setActiveView } = useContext(ViewsContext);

  return (
    <ul className='str-chat__views__selector'>
      <li>
        <button onPointerDown={() => setActiveView('channel')}>Channels</button>
      </li>
      <li>
        <button onPointerDown={() => setActiveView('threads')}>Threads</button>
      </li>
    </ul>
  );
};

Views.Channel = ChannelView;
Views.Threads = ThreadsView;
Views.Selector = ViewSelector;
Views.ThreadAdapter = ThreadAdapter;
