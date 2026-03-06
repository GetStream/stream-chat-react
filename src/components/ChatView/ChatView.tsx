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
import { LayoutController as LayoutControllerClass } from './layoutController/LayoutController';
import { resolveTargetSlotChannelDefault } from './layoutSlotResolvers';

import type { PropsWithChildren, ReactNode } from 'react';
import type { Channel as StreamChannel, Thread, ThreadManagerState } from 'stream-chat';
import type {
  ChatViewLayoutState,
  DuplicateEntityPolicy,
  LayoutController,
  LayoutSlotBinding,
  ResolveDuplicateEntity,
  ResolveTargetSlot,
  SlotName,
} from './layoutController/layoutControllerTypes';
import { getLayoutViewState } from './hooks';

export type ChatView = 'channels' | 'threads';

export type UserListEntitySource = {
  query: string;
};

export type ChannelListEntitySource = {
  view?: ChatView;
};
export type ThreadListEntitySource = {
  view?: ChatView;
};

export type SearchResultsEntitySource = {
  query: string;
};

export type ChatViewEntityBinding =
  | { key?: string; kind: 'channelList'; source: ChannelListEntitySource }
  | { key?: string; kind: 'threadList'; source: ThreadListEntitySource }
  | { key?: string; kind: 'channel'; source: StreamChannel }
  | { key?: string; kind: 'thread'; source: Thread }
  | { key?: string; kind: 'memberList'; source: StreamChannel }
  | { key?: string; kind: 'userList'; source: UserListEntitySource }
  | { key?: string; kind: 'searchResults'; source: SearchResultsEntitySource }
  | { key?: string; kind: 'pinnedMessagesList'; source: StreamChannel };

export type ChatViewEntityInferer = {
  kind: ChatViewEntityBinding['kind'];
  match: (source: unknown) => boolean;
  toBinding: (source: unknown) => ChatViewEntityBinding;
};

export type ChatViewBuiltinLayout = 'nav-rail-entity-list-workspace';

type LayoutEntityByKind<TKind extends ChatViewEntityBinding['kind']> = Extract<
  ChatViewEntityBinding,
  { kind: TKind }
>;

export type ChatViewSlotRendererProps<TKind extends ChatViewEntityBinding['kind']> = {
  entity: LayoutEntityByKind<TKind>;
  slot: string;
  source: LayoutEntityByKind<TKind>['source'];
};

export type ChatViewSlotFallbackProps = {
  slot: string;
};

export type ChatViewSlotRenderers = Partial<{
  [TKind in ChatViewEntityBinding['kind']]: (
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
  slotNames?: string[];
  slotFallbackComponents?: Partial<
    Record<string, ComponentType<ChatViewSlotFallbackProps>>
  >;
  slotRenderers?: ChatViewSlotRenderers;
}>;

export type ChatViewNavigationAction = 'openChannel' | 'openThread';

export type ResolveViewActionTargetSlotArgs = {
  action: ChatViewNavigationAction;
  activeView: ChatView;
  availableSlots: SlotName[];
  requestedSlot?: SlotName;
  slotBindings: Record<SlotName, LayoutSlotBinding | undefined>;
  slotNames?: SlotName[];
};

export type ResolveViewActionTargetSlot = (
  args: ResolveViewActionTargetSlotArgs,
) => SlotName | undefined;

export type ViewActionSlotResolvers = Partial<
  Record<ChatViewNavigationAction, ResolveViewActionTargetSlot>
>;

type ChatViewContextValue = {
  activeChatView: ChatView;
  activeView: ChatView;
  entityInferers: ChatViewEntityInferer[];
  layoutController: LayoutController;
  registerViewActionSlotResolvers: (
    view: ChatView,
    resolvers?: ViewActionSlotResolvers,
  ) => void;
  resolveActionTargetSlot: (
    view: ChatView,
    args: ResolveViewActionTargetSlotArgs,
  ) => SlotName | undefined;
  setActiveView: (cv: ChatView) => void;
};

const DEFAULT_MAX_SLOTS = 1;
const DEFAULT_MIN_SLOTS = 1;

const createGeneratedSlotNames = (slotCount: number) =>
  Array.from({ length: Math.max(0, slotCount) }, (_, index) => `slot${index + 1}`);

const resolveSlotTopology = ({
  maxSlots,
  minSlots,
  slotNames,
}: {
  maxSlots?: number;
  minSlots?: number;
  slotNames?: string[];
}) => {
  const explicitSlotNames = slotNames?.filter(Boolean) ?? [];
  const hasExplicitSlotNames = explicitSlotNames.length > 0;
  const resolvedMaxSlots = hasExplicitSlotNames
    ? Math.min(
        Math.max(1, maxSlots ?? explicitSlotNames.length),
        explicitSlotNames.length,
      )
    : Math.max(1, maxSlots ?? DEFAULT_MAX_SLOTS);
  const resolvedMinSlots = Math.min(
    Math.max(1, minSlots ?? DEFAULT_MIN_SLOTS),
    resolvedMaxSlots,
  );
  const resolvedSlotNames = hasExplicitSlotNames
    ? explicitSlotNames.slice(0, resolvedMaxSlots)
    : createGeneratedSlotNames(resolvedMaxSlots);

  return {
    initialAvailableSlots: resolvedSlotNames.slice(0, resolvedMinSlots),
    resolvedMaxSlots,
    resolvedMinSlots,
    resolvedSlotNames,
  };
};

const defaultLayoutController = new LayoutControllerClass({
  initialState: {
    activeView: 'channels',
    availableSlotsByView: {
      channels: createGeneratedSlotNames(DEFAULT_MAX_SLOTS),
    },
  },
});

const ChatViewContext = createContext<ChatViewContextValue>({
  activeChatView: 'channels',
  activeView: 'channels',
  entityInferers: [],
  layoutController: defaultLayoutController,
  registerViewActionSlotResolvers: () => undefined,
  resolveActionTargetSlot: () => undefined,
  setActiveView: () => undefined,
});

export const useChatViewContext = () => useContext(ChatViewContext);

const activeViewSelector = ({ activeView }: ChatViewLayoutState) => ({ activeView });
const workspaceLayoutStateSelector = (state: ChatViewLayoutState) => ({
  activeView: state.activeView,
  viewState: getLayoutViewState(state),
});

const isChatViewEntityBinding = (value: unknown): value is ChatViewEntityBinding => {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<ChatViewEntityBinding>;
  return typeof candidate.kind === 'string' && 'source' in candidate;
};

export const getChatViewEntityBinding = (
  binding?: LayoutSlotBinding,
): ChatViewEntityBinding | undefined =>
  isChatViewEntityBinding(binding?.payload) ? binding.payload : undefined;

export const createChatViewSlotBinding = (
  entity: ChatViewEntityBinding,
): LayoutSlotBinding => ({
  key: entity.key ? `${entity.kind}:${entity.key}` : undefined,
  payload: entity,
});

const renderSlotBinding = (
  entity: ChatViewEntityBinding | undefined,
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
    case 'threadList':
      return (
        slotRenderers?.threadList?.({ entity, slot, source: entity.source }) ?? (
          <ThreadList />
        )
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

const LIST_BINDING_KEY = 'list';
const LIST_ENTITY_KIND: ChatViewEntityBinding['kind'] = 'channelList';

const registerListSlotHint = (
  layoutController: LayoutController,
  view: ChatView,
  slot: SlotName,
) => {
  layoutController.state.next((current) => {
    if (current.listSlotByView?.[view] === slot) return current;

    return {
      ...current,
      listSlotByView: {
        ...(current.listSlotByView ?? {}),
        [view]: slot,
      },
    };
  });
};

export const ChatView = ({
  children,
  duplicateEntityPolicy,
  entityInferers = [],
  layout,
  layoutController,
  maxSlots,
  minSlots,
  resolveDuplicateEntity,
  resolveTargetSlot,
  SlotFallback,
  slotFallbackComponents,
  slotNames,
  slotRenderers,
}: ChatViewProps) => {
  const { theme } = useChatContext();
  const [viewActionSlotResolvers, setViewActionSlotResolvers] = useState<
    Partial<Record<ChatView, ViewActionSlotResolvers>>
  >({});
  const { initialAvailableSlots, resolvedMaxSlots, resolvedMinSlots, resolvedSlotNames } =
    useMemo(
      () =>
        resolveSlotTopology({
          maxSlots,
          minSlots,
          slotNames,
        }),
      [maxSlots, minSlots, slotNames],
    );

  const internalLayoutController = useMemo(
    () =>
      new LayoutControllerClass({
        duplicateEntityPolicy,
        initialState: {
          activeView: 'channels',
          availableSlotsByView: {
            channels: initialAvailableSlots,
          },
          maxSlots: resolvedMaxSlots,
          minSlots: resolvedMinSlots,
          slotNamesByView: {
            channels: resolvedSlotNames,
          },
        },
        resolveDuplicateEntity,
        resolveTargetSlot: resolveTargetSlot ?? resolveTargetSlotChannelDefault,
      }),
    [
      duplicateEntityPolicy,
      initialAvailableSlots,
      resolvedMaxSlots,
      resolvedMinSlots,
      resolvedSlotNames,
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
      const currentState = effectiveLayoutController.state.getLatestValue();
      if (currentState.activeView !== cv) {
        const currentViewState = getLayoutViewState(currentState);
        currentViewState.availableSlots.forEach((slot) => {
          const entity = getChatViewEntityBinding(currentViewState.slotBindings[slot]);
          if (entity?.kind === 'channel' || entity?.kind === 'thread') {
            effectiveLayoutController.clear(slot);
          }
        });
      }
      effectiveLayoutController.setActiveView(cv);
    },
    [effectiveLayoutController],
  );

  const registerViewActionSlotResolvers = useCallback(
    (view: ChatView, resolvers?: ViewActionSlotResolvers) => {
      setViewActionSlotResolvers((current) => {
        const previous = current[view];
        if (previous === resolvers) return current;

        const next = { ...current };
        if (!resolvers) delete next[view];
        else next[view] = resolvers;
        return next;
      });
    },
    [],
  );

  const resolveActionTargetSlot = useCallback(
    (view: ChatView, args: ResolveViewActionTargetSlotArgs) =>
      viewActionSlotResolvers[view]?.[args.action]?.(args),
    [viewActionSlotResolvers],
  );

  const value = useMemo(
    () => ({
      activeChatView: activeView,
      activeView,
      entityInferers,
      layoutController: effectiveLayoutController,
      registerViewActionSlotResolvers,
      resolveActionTargetSlot,
      setActiveView,
    }),
    [
      activeView,
      effectiveLayoutController,
      entityInferers,
      registerViewActionSlotResolvers,
      resolveActionTargetSlot,
      setActiveView,
    ],
  );

  const workspaceLayoutState =
    useStateStore(effectiveLayoutController.state, workspaceLayoutStateSelector) ??
    workspaceLayoutStateSelector(effectiveLayoutController.state.getLatestValue());
  const { activeView: workspaceActiveView, viewState } = workspaceLayoutState;

  useEffect(() => {
    if (layout !== 'nav-rail-entity-list-workspace') return;

    const existingListSlot = viewState.availableSlots.find(
      (slot) =>
        getChatViewEntityBinding(viewState.slotBindings[slot])?.kind === LIST_ENTITY_KIND,
    );

    if (existingListSlot) {
      registerListSlotHint(
        effectiveLayoutController,
        workspaceActiveView,
        existingListSlot,
      );
      const existingEntity = getChatViewEntityBinding(
        viewState.slotBindings[existingListSlot],
      );
      if (
        existingEntity?.kind === LIST_ENTITY_KIND &&
        existingEntity.source.view !== workspaceActiveView
      ) {
        effectiveLayoutController.setSlotBinding(
          existingListSlot,
          createChatViewSlotBinding({
            ...existingEntity,
            source: { view: workspaceActiveView },
          }),
        );
      }
      return;
    }

    const firstFreeSlot = viewState.availableSlots.find(
      (slot) => !viewState.slotBindings[slot],
    );
    if (!firstFreeSlot) return;

    registerListSlotHint(effectiveLayoutController, workspaceActiveView, firstFreeSlot);
    effectiveLayoutController.setSlotBinding(
      firstFreeSlot,
      createChatViewSlotBinding({
        key: LIST_BINDING_KEY,
        kind: LIST_ENTITY_KIND,
        source: { view: workspaceActiveView },
      }),
    );
  }, [
    effectiveLayoutController,
    layout,
    workspaceActiveView,
    viewState.slotBindings,
    viewState.availableSlots,
  ]);

  const content =
    layout === 'nav-rail-entity-list-workspace'
      ? (() => {
          const slots = viewState.availableSlots.map((slot) => {
            const content = renderSlotBinding(
              getChatViewEntityBinding(viewState.slotBindings[slot]),
              slot,
              slotRenderers,
            );
            const Fallback = resolveSlotFallbackComponent({
              slot,
              SlotFallback,
              slotFallbackComponents,
            });

            return {
              content: content ?? <Fallback slot={slot} />,
              slot,
            };
          });

          return <WorkspaceLayout navRail={<ChatViewSelector />} slots={slots} />;
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

export type ChatViewChannelsProps = PropsWithChildren<{
  slots?: SlotName[];
  targetSlotResolvers?: ViewActionSlotResolvers;
}>;

const normalizeViewSlots = (slots?: SlotName[]) =>
  (slots ?? []).filter((slot): slot is SlotName => Boolean(slot));

const areSlotArraysEqual = (first: SlotName[], second: SlotName[]) => {
  if (first.length !== second.length) return false;
  return first.every((slot, index) => second[index] === slot);
};

// todo: move channel list orchestrator here
const ChannelsView = ({
  children,
  slots,
  targetSlotResolvers,
}: ChatViewChannelsProps) => {
  const { activeView, layoutController, registerViewActionSlotResolvers } =
    useChatViewContext();
  const isChannelsViewActive = activeView === 'channels';
  const orderedSlots = useMemo(() => normalizeViewSlots(slots), [slots]);

  useEffect(() => {
    registerViewActionSlotResolvers('channels', targetSlotResolvers);

    return () => {
      registerViewActionSlotResolvers('channels', undefined);
    };
  }, [registerViewActionSlotResolvers, targetSlotResolvers]);

  useEffect(() => {
    if (!isChannelsViewActive || orderedSlots.length === 0) return;
    const current = layoutController.state.getLatestValue();
    if (areSlotArraysEqual(getLayoutViewState(current).availableSlots, orderedSlots))
      return;
    layoutController.setSlotNames(orderedSlots);
    layoutController.setAvailableSlots(orderedSlots);
  }, [isChannelsViewActive, layoutController, orderedSlots]);

  if (!isChannelsViewActive) return null;

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

export type ChatViewThreadsProps = PropsWithChildren<{
  slots?: SlotName[];
  targetSlotResolvers?: ViewActionSlotResolvers;
}>;

const ThreadsView = ({ children, slots, targetSlotResolvers }: ChatViewThreadsProps) => {
  const { activeView, layoutController, registerViewActionSlotResolvers } =
    useChatViewContext();
  const isThreadsViewActive = activeView === 'threads';
  const [activeThread, setActiveThread] =
    useState<ThreadsViewContextValue['activeThread']>(undefined);
  const orderedSlots = useMemo(() => normalizeViewSlots(slots), [slots]);

  const value = useMemo(() => ({ activeThread, setActiveThread }), [activeThread]);

  useEffect(() => {
    registerViewActionSlotResolvers('threads', targetSlotResolvers);

    return () => {
      registerViewActionSlotResolvers('threads', undefined);
    };
  }, [registerViewActionSlotResolvers, targetSlotResolvers]);

  useEffect(() => {
    if (!isThreadsViewActive || orderedSlots.length === 0) return;
    const current = layoutController.state.getLatestValue();
    if (areSlotArraysEqual(getLayoutViewState(current).availableSlots, orderedSlots))
      return;
    layoutController.setSlotNames(orderedSlots);
    layoutController.setAvailableSlots(orderedSlots);
  }, [isThreadsViewActive, layoutController, orderedSlots]);

  if (!isThreadsViewActive) return null;

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
