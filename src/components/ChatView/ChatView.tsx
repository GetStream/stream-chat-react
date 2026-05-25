import clsx from 'clsx';
import React, {
  type ComponentType,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useStableId } from '../../utils/useStableId';

import { Button, type ButtonProps } from '../Button';
import { EmptyStateIndicator as DefaultEmptyStateIndicator } from '../EmptyStateIndicator';
import {
  IconMessageBubble,
  IconMessageBubbleFill,
  IconThread,
  IconThreadFill,
} from '../Icons';
import { ThreadProvider } from '../Threads';
import { UnreadCountBadge } from '../Threads/UnreadCountBadge';
import {
  useChatContext,
  useComponentContext,
  useTranslationContext,
} from '../../context';
import { useStateStore } from '../../store';
import {
  type ChatViewA11yContextValue,
  createChatViewA11yContextValue,
  DEFAULT_CHAT_VIEW_A11Y_CONTEXT_VALUE,
} from './ChatView.a11y.utility';

import type { PropsWithChildren } from 'react';
import type { Thread, ThreadManagerState } from 'stream-chat';

export type ChatView = 'channels' | 'threads';

/**
 * ChatView accessibility contract (WAI-ARIA Tabs):
 * 1) Selector container is role="tablist".
 * 2) Each selector button is role="tab", with id + aria-controls=<panel-id>.
 * 3) Each view container is role="tabpanel", with id + aria-labelledby=<tab-id>.
 * 4) Tab activation updates the active panel.
 * 5) Tabs are always tabbable (tabIndex=0), so users can reach both without
 *    arrow-key navigation.
 */
type ChatViewContextValue = {
  activeChatView: ChatView;
  setActiveChatView: (cv: ChatView) => void;
};

export const ChatViewContext = createContext<ChatViewContextValue | undefined>(undefined);
const ChatViewA11yContext = createContext<ChatViewA11yContextValue>(
  DEFAULT_CHAT_VIEW_A11Y_CONTEXT_VALUE,
);

export const useChatViewContext = () => {
  const value = useContext(ChatViewContext);

  if (!value) {
    console.warn(
      'The useChatViewContext hook was called outside of the ChatView provider.',
    );
    return {} as ChatViewContextValue;
  }

  return value;
};
const useChatViewA11yContext = () => useContext(ChatViewA11yContext);

export const ChatView = ({ children }: PropsWithChildren) => {
  const [activeChatView, setActiveChatView] = useState<ChatView>('channels');
  const chatViewId = useStableId('chatview');

  const { theme } = useChatContext();

  const a11yValue = useMemo(
    () => createChatViewA11yContextValue(chatViewId),
    [chatViewId],
  );

  const value = useMemo(() => ({ activeChatView, setActiveChatView }), [activeChatView]);

  return (
    <ChatViewA11yContext.Provider value={a11yValue}>
      <ChatViewContext.Provider value={value}>
        <div className={clsx('str-chat', theme, 'str-chat__chat-view')}>{children}</div>
      </ChatViewContext.Provider>
    </ChatViewA11yContext.Provider>
  );
};

const ChannelsView = ({ children }: PropsWithChildren) => {
  const { activeChatView } = useChatViewContext();
  const { chatViewPanelIds, chatViewTabIds } = useChatViewA11yContext();
  const isActive = activeChatView === 'channels';

  if (!isActive) return null;

  return (
    <div
      aria-labelledby={chatViewTabIds.channels}
      className='str-chat__chat-view__channels'
      id={chatViewPanelIds.channels}
      role='tabpanel'
    >
      {children}
    </div>
  );
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
  const { chatViewPanelIds, chatViewTabIds } = useChatViewA11yContext();
  const [activeThread, setActiveThread] =
    useState<ThreadsViewContextValue['activeThread']>(undefined);

  const value = useMemo(() => ({ activeThread, setActiveThread }), [activeThread]);
  const isActive = activeChatView === 'threads';

  if (!isActive) return null;

  return (
    <ThreadsViewContext.Provider value={value}>
      <div
        aria-labelledby={chatViewTabIds.threads}
        className='str-chat__chat-view__threads'
        id={chatViewPanelIds.threads}
        role='tabpanel'
      >
        {children}
      </div>
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
  const { chatViewPanelIds, chatViewTabIds } = useChatViewA11yContext();
  const { t } = useTranslationContext();

  const isActive = activeChatView === 'channels';

  return (
    <ChatViewSelectorButton
      ActiveIcon={IconMessageBubbleFill}
      // tab -> tabpanel wiring
      aria-controls={chatViewPanelIds.channels}
      aria-selected={isActive}
      Icon={IconMessageBubble}
      iconOnly={iconOnly}
      id={chatViewTabIds.channels}
      isActive={isActive}
      onClick={() => setActiveChatView('channels')}
      onPointerDown={() => setActiveChatView('channels')}
      tabIndex={0}
      text={t('Channels')}
    />
  );
};

export const ChatViewThreadsSelectorButton = ({
  iconOnly = true,
}: ChatViewSelectorItemProps) => {
  const { client } = useChatContext();
  const { unreadThreadCount } = useStateStore(
    client.threads.state,
    unreadThreadCountSelector,
  ) ?? {
    unreadThreadCount: 0,
  };
  const { activeChatView, setActiveChatView } = useChatViewContext();
  const { chatViewPanelIds, chatViewTabIds } = useChatViewA11yContext();
  const { t } = useTranslationContext();

  const isActive = activeChatView === 'threads';

  return (
    <ChatViewSelectorButton
      ActiveIcon={IconThreadFill}
      // tab -> tabpanel wiring
      aria-controls={chatViewPanelIds.threads}
      aria-selected={isActive}
      Icon={IconThread}
      iconOnly={iconOnly}
      id={chatViewTabIds.threads}
      isActive={isActive}
      onClick={() => setActiveChatView('threads')}
      onPointerDown={() => setActiveChatView('threads')}
      tabIndex={0}
      text={t('Threads')}
    >
      <UnreadCountBadge count={unreadThreadCount} position='top-right'>
        {isActive ? <IconThreadFill /> : <IconThread />}
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
  const { t } = useTranslationContext();

  return (
    <div
      aria-label={t('aria/Chat view tabs')}
      className='str-chat__chat-view__selector'
      // WAI-ARIA Tabs pattern: tablist owns the tab controls.
      role='tablist'
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
