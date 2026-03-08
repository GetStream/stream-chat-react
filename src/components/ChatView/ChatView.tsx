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
import { EmptyStateIndicator as DefaultEmptyStateIndicator } from '../EmptyStateIndicator';
import {
  IconBubble2ChatMessage,
  IconBubble2Solid,
  IconBubbleText6ChatMessage,
  IconBubbleText6SolidChatMessage,
} from '../Icons';
import { ThreadProvider } from '../Threads';
import { UnreadCountBadge } from '../Threads/UnreadCountBadge';
import {
  useChatContext,
  useComponentContext,
  useTranslationContext,
} from '../../context';
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
  const { client } = useChatContext('ThreadAdapter');
  const { EmptyStateIndicator = DefaultEmptyStateIndicator } =
    useComponentContext('ThreadAdapter');
  const { activeThread } = useThreadsViewContext();
  const { t } = useTranslationContext('ThreadAdapter');
  const { isLoading, ready } = useStateStore(
    client.threads.state,
    threadAdapterSelector,
  ) ?? {
    isLoading: false,
    ready: false,
  };

  useActiveThread({ activeThread });

  if (!activeThread && ready && !isLoading && EmptyStateIndicator) {
    return (
      <div className='str-chat__thread-container str-chat__thread'>
        <EmptyStateIndicator
          listType='message'
          messageText={t('Select a thread to continue the conversation')}
        />
      </div>
    );
  }

  return <ThreadProvider thread={activeThread}>{children}</ThreadProvider>;
};

export const ChatViewSelectorButton = ({
  ActiveIcon,
  children,
  className,
  Icon,
  iconOnly = true,
  isActive,
  text,
  ...props
}: ButtonProps & {
  ActiveIcon?: ComponentType;
  iconOnly?: boolean;
  Icon?: ComponentType;
  isActive?: boolean;
  text?: string;
}) => {
  const SelectorIcon = isActive && ActiveIcon ? ActiveIcon : Icon;
  const shouldShowTooltip = !!text && iconOnly;

  return (
    <div className='str-chat__chat-view__selector-button-container'>
      <Button
        appearance='ghost'
        aria-label={props['aria-label'] ?? (shouldShowTooltip ? text : undefined)}
        className={clsx('str-chat__chat-view__selector-button', className)}
        role='tab'
        variant='secondary'
        {...props}
      >
        {children ?? (SelectorIcon && <SelectorIcon />)}
        {!iconOnly && text && (
          <div className='str-chat__chat-view__selector-button-text'>{text}</div>
        )}
      </Button>
      {shouldShowTooltip && (
        <div
          aria-hidden='true'
          className='str-chat__chat-view__selector-button-tooltip str-chat__tooltip'
        >
          {text}
        </div>
      )}
    </div>
  );
};

const threadAdapterSelector = ({ pagination, ready }: ThreadManagerState) => ({
  isLoading: pagination.isLoading,
  ready,
});

const unreadThreadCountSelector = ({ unreadThreadCount }: ThreadManagerState) => ({
  unreadThreadCount,
});

export type ChatViewSelectorItemProps = {
  iconOnly?: boolean;
};

export const ChatViewChannelsSelectorButton = ({
  iconOnly = true,
}: ChatViewSelectorItemProps) => {
  const { activeChatView, setActiveChatView } = useChatViewContext();
  const { openMobileNav } = useChatContext('ChatViewChannelsSelectorButton');
  const { t } = useTranslationContext();

  const isActive = activeChatView === 'channels';
  return (
    <ChatViewSelectorButton
      ActiveIcon={IconBubble2Solid}
      aria-selected={isActive}
      Icon={IconBubble2ChatMessage}
      iconOnly={iconOnly}
      isActive={isActive}
      onPointerDown={() => {
        openMobileNav();
        setActiveChatView('channels');
      }}
      text={t('Channels')}
    />
  );
};

export const ChatViewThreadsSelectorButton = ({
  iconOnly = true,
}: ChatViewSelectorItemProps) => {
  const { client, openMobileNav } = useChatContext();
  const { unreadThreadCount } = useStateStore(
    client.threads.state,
    unreadThreadCountSelector,
  ) ?? {
    unreadThreadCount: 0,
  };
  const { activeChatView, setActiveChatView } = useChatViewContext();
  const { t } = useTranslationContext();

  const isActive = activeChatView === 'threads';
  return (
    <ChatViewSelectorButton
      ActiveIcon={IconBubbleText6SolidChatMessage}
      aria-selected={isActive}
      Icon={IconBubbleText6ChatMessage}
      iconOnly={iconOnly}
      isActive={isActive}
      onPointerDown={() => {
        openMobileNav();
        setActiveChatView('threads');
      }}
      text={t('Threads')}
    >
      <UnreadCountBadge count={unreadThreadCount} position='top-right'>
        {isActive ? <IconBubbleText6SolidChatMessage /> : <IconBubbleText6ChatMessage />}
      </UnreadCountBadge>
    </ChatViewSelectorButton>
  );
};

export type ChatViewSelectorItem = {
  Component: React.ComponentType<ChatViewSelectorItemProps>;
  type: string & {};
};

export type ChatViewSelectorEntry = ChatViewSelectorItem;

export type ChatViewSelectorProps = {
  iconOnly?: boolean;
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
  iconOnly = true,
  itemSet = defaultChatViewSelectorItemSet,
}: ChatViewSelectorProps) => {
  const { navOpen } = useChatContext('ChatView.Selector');
  return (
    <div
      className={clsx('str-chat__chat-view__selector', {
        'str-chat__chat-view__selector--nav-closed': navOpen === false,
        'str-chat__chat-view__selector--nav-open': navOpen === true,
      })}
    >
      {itemSet.map(({ Component, type }) => (
        <Component iconOnly={iconOnly} key={type} />
      ))}
    </div>
  );
};

ChatView.Channels = ChannelsView;
ChatView.Threads = ThreadsView;
ChatView.ThreadAdapter = ThreadAdapter;
ChatView.Selector = ChatViewSelector;
