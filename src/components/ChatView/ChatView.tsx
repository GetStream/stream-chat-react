import clsx from 'clsx';
import React, {
  type ComponentType,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { Button, type ButtonProps } from '../Button';
import { ThreadProvider } from '../Threads';
import { Icon } from '../Threads/icons';
import { UnreadCountBadge } from '../Threads/UnreadCountBadge';
import { useChatContext, useTranslationContext } from '../../context';
import { useStateStore } from '../../store';

import type { PropsWithChildren } from 'react';
import type { Thread, ThreadManagerState } from 'stream-chat';

export type ChatView = 'channels' | 'threads';

type ChatViewContextValue = {
  activeChatView: ChatView;
  setActiveChatView: (cv: ChatView) => void;
};

const ChatViewContext = createContext<ChatViewContextValue>({
  activeChatView: 'channels',
  setActiveChatView: () => undefined,
});

export const useChatViewContext = () => useContext(ChatViewContext);

export const ChatView = ({ children }: PropsWithChildren) => {
  const [activeChatView, setActiveChatView] = useState<ChatView>('channels');

  const { theme } = useChatContext();

  const value = useMemo(() => ({ activeChatView, setActiveChatView }), [activeChatView]);

  return (
    <ChatViewContext.Provider value={value}>
      <div className={clsx('str-chat', theme, 'str-chat__chat-view')}>{children}</div>
    </ChatViewContext.Provider>
  );
};

const ChannelsView = ({ children }: PropsWithChildren) => {
  const { activeChatView } = useChatViewContext();

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
  const { activeChatView } = useChatViewContext();
  const [activeThread, setActiveThread] =
    useState<ThreadsViewContextValue['activeThread']>(undefined);

  const value = useMemo(() => ({ activeThread, setActiveThread }), [activeThread]);

  if (activeChatView !== 'threads') return null;

  return (
    <ThreadsViewContext.Provider value={value}>
      <div className='str-chat__chat-view__threads'>{children}</div>
    </ThreadsViewContext.Provider>
  );
};

// thread business logic that's impossible to keep within client but encapsulated for ease of use
export const useActiveThread = ({ activeThread }: { activeThread?: Thread }) => {
  useEffect(() => {
    if (!activeThread) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && document.hasFocus()) {
        activeThread.activate();
      }
      if (document.visibilityState === 'hidden' || !document.hasFocus()) {
        activeThread.deactivate();
      }
    };

    handleVisibilityChange();

    window.addEventListener('focus', handleVisibilityChange);
    window.addEventListener('blur', handleVisibilityChange);
    return () => {
      activeThread.deactivate();
      window.addEventListener('blur', handleVisibilityChange);
      window.removeEventListener('focus', handleVisibilityChange);
    };
  }, [activeThread]);
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

  useActiveThread({ activeThread });

  return <ThreadProvider thread={activeThread}>{children}</ThreadProvider>;
};

export const ChatViewSelectorButton = ({
  children,
  className,
  Icon,
  text,
  ...props
}: ButtonProps & { Icon?: ComponentType; text?: string }) => (
  <Button
    {...props}
    className={clsx(
      'str-chat__chat-view__selector-button',
      'str-chat__button--ghost',
      'str-chat__button--secondary',
      className,
    )}
    role='tab'
  >
    {text ? (
      <>
        {Icon && <Icon />}
        <div className='str-chat__chat-view__selector-button-text'>{text}</div>
      </>
    ) : (
      children
    )}
  </Button>
);

const selector = ({ unreadThreadCount }: ThreadManagerState) => ({
  unreadThreadCount,
});

export const ChatViewChannelsSelectorButton = () => {
  const { activeChatView, setActiveChatView } = useChatViewContext();
  const { t } = useTranslationContext();

  return (
    <ChatViewSelectorButton
      aria-selected={activeChatView === 'channels'}
      Icon={Icon.MessageBubbleEmpty}
      onPointerDown={() => setActiveChatView('channels')}
      text={t('Channels')}
    />
  );
};

export const ChatViewThreadsSelectorButton = () => {
  const { client } = useChatContext();
  const { unreadThreadCount } = useStateStore(client.threads.state, selector) ?? {
    unreadThreadCount: 0,
  };
  const { activeChatView, setActiveChatView } = useChatViewContext();
  const { t } = useTranslationContext();

  return (
    <ChatViewSelectorButton
      aria-selected={activeChatView === 'threads'}
      onPointerDown={() => setActiveChatView('threads')}
    >
      <UnreadCountBadge count={unreadThreadCount} position='top-right'>
        <Icon.MessageBubble />
      </UnreadCountBadge>
      <div className='str-chat__chat-view__selector-button-text'>{t('Threads')}</div>
    </ChatViewSelectorButton>
  );
};

export type ChatViewSelectorItem = {
  Component: React.ComponentType;
  type: string & {};
};

export type ChatViewSelectorEntry = ChatViewSelectorItem;

export type ChatViewSelectorProps = {
  itemSet?: ChatViewSelectorEntry[];
};

export const defaultChatViewSelectorItemSet: ChatViewSelectorEntry[] = [
  {
    Component: ChatViewChannelsSelectorButton,
    type: 'channels' as string & {},
  },
  {
    Component: ChatViewThreadsSelectorButton,
    type: 'threads' as string & {},
  },
];

const ChatViewSelector = ({
  itemSet = defaultChatViewSelectorItemSet,
}: ChatViewSelectorProps) => (
  <div className='str-chat__chat-view__selector'>
    {itemSet.map(({ Component, type }) => (
      <Component key={type} />
    ))}
  </div>
);

ChatView.Channels = ChannelsView;
ChatView.Threads = ThreadsView;
ChatView.ThreadAdapter = ThreadAdapter;
ChatView.Selector = ChatViewSelector;
