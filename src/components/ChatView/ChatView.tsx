import clsx from 'clsx';
import React, {
  type ComponentType,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { Button, type ButtonProps } from '../Button';
import { ChannelList } from '../ChannelList';
import { ThreadProvider } from '../Threads';
import { ThreadList } from '../Threads/ThreadList';
import { Icon } from '../Threads/icons';
import { UnreadCountBadge } from '../Threads/UnreadCountBadge';
import { useChatContext, useTranslationContext } from '../../context';
import { useStateStore } from '../../store';
import { ChatViewNavigationProvider } from './ChatViewNavigationContext';
import { WorkspaceLayout } from './layout/WorkspaceLayout';
import { createLayoutController } from './layoutController/LayoutController';
import { resolveTargetSlotChannelDefault } from './layoutSlotResolvers';

import type { PropsWithChildren, ReactNode } from 'react';
import type { Thread, ThreadManagerState } from 'stream-chat';
import type {
  ChatViewLayoutState,
  DuplicateEntityPolicy,
  LayoutController,
  LayoutEntityBinding,
  ResolveDuplicateEntity,
  ResolveTargetSlot,
} from './layoutController/layoutControllerTypes';

export type ChatView = 'channels' | 'threads';

export type ChatViewEntityInferer = {
  kind: LayoutEntityBinding['kind'];
  match: (source: unknown) => boolean;
  toBinding: (source: unknown) => LayoutEntityBinding;
};

export type ChatViewBuiltinLayout = 'nav-rail-entity-list-workspace';

type LayoutEntityByKind<TKind extends LayoutEntityBinding['kind']> = Extract<
  LayoutEntityBinding,
  { kind: TKind }
>;

export type ChatViewSlotRendererProps<TKind extends LayoutEntityBinding['kind']> = {
  entity: LayoutEntityByKind<TKind>;
  slot: string;
  source: LayoutEntityByKind<TKind>['source'];
};

export type ChatViewSlotFallbackProps = {
  slot: string;
};

export type ChatViewSlotRenderers = Partial<{
  [TKind in LayoutEntityBinding['kind']]: (
    props: ChatViewSlotRendererProps<TKind>,
  ) => ReactNode;
}>;

export type ChatViewProps = PropsWithChildren<{
  duplicateEntityPolicy?: DuplicateEntityPolicy;
  entityInferers?: ChatViewEntityInferer[];
  layout?: ChatViewBuiltinLayout;
  layoutController?: LayoutController;
  maxSlots?: number;
  minSlots?: number;
  resolveDuplicateEntity?: ResolveDuplicateEntity;
  resolveTargetSlot?: ResolveTargetSlot;
  SlotFallback?: ComponentType<ChatViewSlotFallbackProps>;
  slotFallbackComponents?: Partial<
    Record<string, ComponentType<ChatViewSlotFallbackProps>>
  >;
  slotRenderers?: ChatViewSlotRenderers;
}>;

type ChatViewContextValue = {
  activeChatView: ChatView;
  activeView: ChatView;
  entityInferers: ChatViewEntityInferer[];
  layoutController: LayoutController;
  setActiveChatView: (cv: ChatView) => void;
  setActiveView: (cv: ChatView) => void;
};

const DEFAULT_MAX_SLOTS = 1;
const DEFAULT_MIN_SLOTS = 1;

const resolveInitialSlotCount = ({
  maxSlots,
  minSlots,
}: {
  maxSlots: number;
  minSlots: number;
}) => Math.min(Math.max(1, minSlots), Math.max(1, maxSlots));

const createVisibleSlots = (slotCount: number) =>
  Array.from({ length: Math.max(0, slotCount) }, (_, index) => `slot${index + 1}`);

const defaultLayoutController = createLayoutController({
  initialState: {
    activeView: 'channels',
    visibleSlots: createVisibleSlots(DEFAULT_MAX_SLOTS),
  },
});

const ChatViewContext = createContext<ChatViewContextValue>({
  activeChatView: 'channels',
  activeView: 'channels',
  entityInferers: [],
  layoutController: defaultLayoutController,
  setActiveChatView: () => undefined,
  setActiveView: () => undefined,
});

export const useChatViewContext = () => useContext(ChatViewContext);

const activeViewSelector = ({ activeView }: ChatViewLayoutState) => ({ activeView });
const workspaceLayoutStateSelector = ({
  activeView,
  entityListPaneOpen,
  slotBindings,
  visibleSlots,
}: ChatViewLayoutState) => ({
  activeView,
  entityListPaneOpen,
  slotBindings,
  visibleSlots,
});

const renderSlotBinding = (
  entity: LayoutEntityBinding | undefined,
  slot: string,
  slotRenderers: ChatViewSlotRenderers | undefined,
): ReactNode | null => {
  if (!entity) return null;

  switch (entity.kind) {
    case 'channelList':
      return (
        slotRenderers?.channelList?.({ entity, slot, source: entity.source }) ??
        (entity.source.view === 'threads' ? (
          <ThreadList />
        ) : (
          <ChannelList showChannelSearch />
        ))
      );
    case 'channel':
      return slotRenderers?.channel?.({ entity, slot, source: entity.source }) ?? null;
    case 'thread':
      return slotRenderers?.thread?.({ entity, slot, source: entity.source }) ?? null;
    case 'memberList':
      return slotRenderers?.memberList?.({ entity, slot, source: entity.source }) ?? null;
    case 'userList':
      return slotRenderers?.userList?.({ entity, slot, source: entity.source }) ?? null;
    case 'searchResults':
      return (
        slotRenderers?.searchResults?.({ entity, slot, source: entity.source }) ?? null
      );
    case 'pinnedMessagesList':
      return (
        slotRenderers?.pinnedMessagesList?.({ entity, slot, source: entity.source }) ??
        null
      );
    default:
      return null;
  }
};

const DefaultSlotFallback = () => (
  <div className='str-chat__chat-view__workspace-layout-slot-fallback'>
    Select a channel to start messaging
  </div>
);

const resolveSlotFallbackComponent = ({
  slot,
  SlotFallback,
  slotFallbackComponents,
}: {
  SlotFallback?: ComponentType<ChatViewSlotFallbackProps>;
  slot: string;
  slotFallbackComponents?: Partial<
    Record<string, ComponentType<ChatViewSlotFallbackProps>>
  >;
}) => slotFallbackComponents?.[slot] ?? SlotFallback ?? DefaultSlotFallback;

export const ChatView = ({
  children,
  duplicateEntityPolicy,
  entityInferers = [],
  layout,
  layoutController,
  maxSlots = DEFAULT_MAX_SLOTS,
  minSlots = DEFAULT_MIN_SLOTS,
  resolveDuplicateEntity,
  resolveTargetSlot,
  SlotFallback,
  slotFallbackComponents,
  slotRenderers,
}: ChatViewProps) => {
  const { theme } = useChatContext();
  const initialSlotCount = resolveInitialSlotCount({ maxSlots, minSlots });

  const internalLayoutController = useMemo(
    () =>
      createLayoutController({
        duplicateEntityPolicy,
        initialState: {
          activeView: 'channels',
          maxSlots,
          minSlots,
          visibleSlots: createVisibleSlots(initialSlotCount),
        },
        resolveDuplicateEntity,
        resolveTargetSlot: resolveTargetSlot ?? resolveTargetSlotChannelDefault,
      }),
    [
      duplicateEntityPolicy,
      initialSlotCount,
      maxSlots,
      minSlots,
      resolveDuplicateEntity,
      resolveTargetSlot,
    ],
  );

  const effectiveLayoutController = layoutController ?? internalLayoutController;

  const { activeView } =
    useStateStore(effectiveLayoutController.state, activeViewSelector) ??
    activeViewSelector(effectiveLayoutController.state.getLatestValue());

  const setActiveView = useCallback(
    (cv: ChatView) => {
      effectiveLayoutController.setActiveView(cv);
    },
    [effectiveLayoutController],
  );

  const value = useMemo(
    () => ({
      activeChatView: activeView,
      activeView,
      entityInferers,
      layoutController: effectiveLayoutController,
      setActiveChatView: setActiveView,
      setActiveView,
    }),
    [activeView, effectiveLayoutController, entityInferers, setActiveView],
  );

  const workspaceLayoutState =
    useStateStore(effectiveLayoutController.state, workspaceLayoutStateSelector) ??
    workspaceLayoutStateSelector(effectiveLayoutController.state.getLatestValue());

  useEffect(() => {
    if (layout !== 'nav-rail-entity-list-workspace') return;

    const existingChannelListSlot = workspaceLayoutState.visibleSlots.find(
      (slot) => workspaceLayoutState.slotBindings[slot]?.kind === 'channelList',
    );

    if (existingChannelListSlot) {
      const existingEntity = workspaceLayoutState.slotBindings[existingChannelListSlot];
      if (
        existingEntity?.kind === 'channelList' &&
        existingEntity.source.view !== workspaceLayoutState.activeView
      ) {
        effectiveLayoutController.bind(existingChannelListSlot, {
          ...existingEntity,
          source: { view: workspaceLayoutState.activeView },
        });
      }
      return;
    }

    const firstFreeSlot = workspaceLayoutState.visibleSlots.find(
      (slot) => !workspaceLayoutState.slotBindings[slot],
    );
    if (!firstFreeSlot) return;

    effectiveLayoutController.bind(firstFreeSlot, {
      key: 'channel-list',
      kind: 'channelList',
      source: { view: workspaceLayoutState.activeView },
    });
  }, [
    effectiveLayoutController,
    layout,
    workspaceLayoutState.activeView,
    workspaceLayoutState.slotBindings,
    workspaceLayoutState.visibleSlots,
  ]);

  const content =
    layout === 'nav-rail-entity-list-workspace'
      ? (() => {
          const slots = workspaceLayoutState.visibleSlots.map((slot) => ({
            content: renderSlotBinding(
              workspaceLayoutState.slotBindings[slot],
              slot,
              slotRenderers,
            ),
            slot,
          }));
          const entityListSlot = slots.find(
            ({ slot }) => workspaceLayoutState.slotBindings[slot]?.kind === 'channelList',
          );

          return (
            <WorkspaceLayout
              entityListHidden={!workspaceLayoutState.entityListPaneOpen}
              entityListSlot={entityListSlot}
              navRail={<ChatViewSelector />}
              slots={slots
                .filter(
                  ({ slot }) =>
                    workspaceLayoutState.slotBindings[slot]?.kind !== 'channelList',
                )
                .map(({ content, slot }) => {
                  const Fallback = resolveSlotFallbackComponent({
                    slot,
                    SlotFallback,
                    slotFallbackComponents,
                  });

                  return {
                    content: content ?? <Fallback slot={slot} />,
                    slot,
                  };
                })}
            />
          );
        })()
      : children;

  return (
    <ChatViewContext.Provider value={value}>
      <ChatViewNavigationProvider>
        <div className={clsx('str-chat', theme, 'str-chat__chat-view')}>{content}</div>
      </ChatViewNavigationProvider>
    </ChatViewContext.Provider>
  );
};

const ChannelsView = ({ children }: PropsWithChildren) => {
  const { activeView } = useChatViewContext();

  if (activeView !== 'channels') return null;

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
  const { activeView } = useChatViewContext();
  const [activeThread, setActiveThread] =
    useState<ThreadsViewContextValue['activeThread']>(undefined);

  const value = useMemo(() => ({ activeThread, setActiveThread }), [activeThread]);

  if (activeView !== 'threads') return null;

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
    appearance='ghost'
    className={clsx('str-chat__chat-view__selector-button', className)}
    role='tab'
    variant='secondary'
    {...props}
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
  const { activeView, setActiveView } = useChatViewContext();
  const { t } = useTranslationContext();

  return (
    <ChatViewSelectorButton
      aria-selected={activeView === 'channels'}
      Icon={Icon.MessageBubbleEmpty}
      onPointerDown={() => setActiveView('channels')}
      text={t('Channels')}
    />
  );
};

export const ChatViewThreadsSelectorButton = () => {
  const { client } = useChatContext();
  const { unreadThreadCount } = useStateStore(client.threads.state, selector) ?? {
    unreadThreadCount: 0,
  };
  const { activeView, setActiveView } = useChatViewContext();
  const { t } = useTranslationContext();

  return (
    <ChatViewSelectorButton
      aria-selected={activeView === 'threads'}
      onPointerDown={() => setActiveView('threads')}
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
