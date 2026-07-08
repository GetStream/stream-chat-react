import clsx from 'clsx';
import React, {
  type ComponentType,
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useStableId } from '../UtilityComponents/useStableId';

import { Button, type ButtonProps } from '../Button';
import {
  IconMessageBubble,
  IconMessageBubbleFill,
  IconThread,
  IconThreadFill,
} from '../Icons';
import { UnreadCountBadge } from '../Threads/UnreadCountBadge';
import {
  DialogManagerProvider,
  useChatContext,
  useTranslationContext,
} from '../../context';
import { useStateStore } from '../../store';
// MERGE-RECONCILE: this file keeps PR #2909's slot/layout navigation architecture
// (LayoutController / WorkspaceLayout / ChatViewNavigationProvider, context shape
// activeView/setActiveView/layoutController) as the base, and grafts master's WAI-ARIA
// tabs accessibility (ChatViewA11yContext, role=tablist/tab/tabpanel wiring) and Phosphor
// icons (../Icons) on top. PR's `Icon` from '../Threads/icons' was removed by master and is
// no longer imported. Reconcile if the layout navigation is later dropped in favor of the
// simpler master ChatView.
import {
  type ChatViewA11yContextValue,
  createChatViewA11yContextValue,
  DEFAULT_CHAT_VIEW_A11Y_CONTEXT_VALUE,
} from './ChatView.a11y.utility';
import { ChatViewNavigationProvider } from './ChatViewNavigationContext';
import { WorkspaceLayout } from './layout/WorkspaceLayout';
import {
  createLayoutRuntimeState,
  LayoutController as LayoutControllerClass,
} from './layoutController/LayoutController';
import { createChatViewSlotBinding, getChatViewEntityBinding } from './slotBinding';
import {
  renderSlotFromRegistry,
  resolveSlotKindRegistry,
  SlotRegistryContext,
} from './slotRegistry';

import type { PropsWithChildren } from 'react';
import type { Thread, ThreadManagerState } from 'stream-chat';
import type {
  ChatViewLayoutState,
  DuplicateEntityPolicy,
  LayoutController,
  LayoutRuntimeState,
  LayoutSlotBinding,
  ResolveDuplicateEntity,
  SlotName,
} from './layoutController/layoutControllerTypes';
import type {
  ChatViewEntityBinding,
  ChatViewSlotFallbackProps,
  ChatViewSlotRenderers,
  LayoutDescriptor,
} from './slotBinding';
import { getLayoutViewState } from './hooks';

// Re-export the binding primitives + renderer types from their leaf modules so
// existing `stream-chat-react` imports keep resolving through ChatView.
export * from './slotBinding';
export type { SlotKindDefinition, SlotKindRegistry } from './slotRegistry';
export { defaultSlotKindRegistry } from './slotRegistry';

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

// Entity-binding primitives + per-kind renderer types live in the leaf module
// `./slotBinding` (so the generic <Slot> and the renderer registry can consume
// them without an import cycle). Re-exported here for back-compat.
export type ChatViewEntityInferer = {
  kind: ChatViewEntityBinding['kind'];
  match: (source: unknown) => boolean;
  toBinding: (source: unknown) => ChatViewEntityBinding;
};

export type ChatViewBuiltinLayout = 'nav-rail-entity-list-workspace';

export type ChatViewProps = PropsWithChildren<{
  /**
   * Optional id for the dialog manager ChatView hosts inside its `.str-chat` root. Dialogs
   * opened by view content (context menus, member actions, …) resolve to this manager and
   * their overlays render under `.str-chat`, so the SDK's `.str-chat`-scoped dialog CSS
   * applies. Omit for a local (unregistered) manager.
   */
  dialogManagerId?: string;
  duplicateEntityPolicy?: DuplicateEntityPolicy;
  entityInferrers?: ChatViewEntityInferer[];
  layout?: ChatViewBuiltinLayout;
  layoutController?: LayoutController;
  /** Declarative layout descriptors (D7). Defaults to the built-in channels/threads. */
  layouts?: LayoutDescriptor[];
  maxSlots?: number;
  minSlots?: number;
  resolveDuplicateEntity?: ResolveDuplicateEntity;
  SlotFallback?: ComponentType<ChatViewSlotFallbackProps>;
  slotNames?: string[];
  slotFallbackComponents?: Partial<
    Record<string, ComponentType<ChatViewSlotFallbackProps>>
  >;
  slotRenderers?: ChatViewSlotRenderers;
  /**
   * Per-view content (D8). The active view's node is rendered inside an a11y tabpanel;
   * that view's slot topology comes from the matching `layouts` descriptor, and
   * `viewActionSlotResolvers[view]` (if any) is registered while it is active. Replaces
   * the removed `ChatView.Channels`/`ChatView.Threads` gated components — the app writes
   * one mapping instead of two hand-composed, activeView-gated trees.
   */
  views?: Partial<Record<ChatView, ReactNode>>;
  /** Optional per-view navigation action slot resolvers. */
  viewActionSlotResolvers?: Partial<Record<ChatView, ViewActionSlotResolvers>>;
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
    layouts: {
      channels: createLayoutRuntimeState({
        availableSlots: createGeneratedSlotNames(DEFAULT_MAX_SLOTS),
      }),
    },
  },
});

export const ChatViewContext = createContext<ChatViewContextValue>({
  activeChatView: 'channels',
  activeView: 'channels',
  entityInferers: [],
  layoutController: defaultLayoutController,
  registerViewActionSlotResolvers: () => undefined,
  resolveActionTargetSlot: () => undefined,
  setActiveView: () => undefined,
});
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

const activeViewSelector = ({ activeView }: ChatViewLayoutState) => ({ activeView });
const workspaceLayoutStateSelector = (state: ChatViewLayoutState) => ({
  activeView: state.activeView,
  viewState: getLayoutViewState(state),
});

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

const BUILTIN_WORKSPACE_LAYOUT: ChatViewBuiltinLayout = 'nav-rail-entity-list-workspace';
const DEFAULT_LIST_BINDING_KEY = 'list';

// D7 — the built-in views expressed as declarative layout descriptors. Each layout
// seeds its own list kind into its first slot (channels -> channelList,
// threads -> threadList); the kind picks the renderer, so there is no `source.view`.
const LIST_KIND_BY_LAYOUT: Record<ChatView, 'channelList' | 'threadList'> = {
  channels: 'channelList',
  threads: 'threadList',
};
const buildDefaultLayoutDescriptors = (slots: SlotName[]): LayoutDescriptor[] => {
  const seedSlot = slots[0];
  return (['channels', 'threads'] as const).map((id) => ({
    id,
    initialBindings: seedSlot
      ? {
          [seedSlot]: {
            key: DEFAULT_LIST_BINDING_KEY,
            kind: LIST_KIND_BY_LAYOUT[id],
            source: {},
          },
        }
      : undefined,
    slots,
  }));
};

// D7 — turn the declarative descriptors into seeded per-layout runtime state at
// controller construction (replaces the imperative, lazy seed effect).
const seedLayoutsFromDescriptors = (
  descriptors: LayoutDescriptor[],
  minSlots: number,
): Partial<Record<ChatView, LayoutRuntimeState>> =>
  descriptors.reduce<Partial<Record<ChatView, LayoutRuntimeState>>>((acc, descriptor) => {
    const slotBindings: Record<SlotName, LayoutSlotBinding | undefined> = {};
    Object.entries(descriptor.initialBindings ?? {}).forEach(([slot, entity]) => {
      if (entity) slotBindings[slot] = createChatViewSlotBinding(entity);
    });
    const availableCount = Math.min(Math.max(1, minSlots), descriptor.slots.length);
    acc[descriptor.id] = createLayoutRuntimeState({
      availableSlots: descriptor.slots.slice(0, availableCount),
      slotBindings,
      slotNames: descriptor.slots,
    });
    return acc;
  }, {});

export const ChatView = ({
  children,
  dialogManagerId,
  duplicateEntityPolicy,
  entityInferrers = [],
  layout,
  layoutController,
  layouts: layoutsProp,
  maxSlots,
  minSlots,
  resolveDuplicateEntity,
  SlotFallback,
  slotFallbackComponents,
  slotNames,
  slotRenderers,
  viewActionSlotResolvers: viewActionSlotResolversProp,
  views,
}: ChatViewProps) => {
  const { theme } = useChatContext();
  const chatViewId = useStableId();
  const a11yValue = useMemo(
    () => createChatViewA11yContextValue(chatViewId),
    [chatViewId],
  );
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

  const layoutDescriptors = useMemo<LayoutDescriptor[]>(
    () => layoutsProp ?? buildDefaultLayoutDescriptors(resolvedSlotNames),
    [layoutsProp, resolvedSlotNames],
  );

  // In the built-in workspace and in `views`-map mode the SDK owns per-view rendering,
  // so seed every layout's slot topology from its descriptor up front (a stable boolean
  // keeps the controller identity constant across renders).
  const seedAllLayouts = layout === BUILTIN_WORKSPACE_LAYOUT || !!views;

  const internalLayoutController = useMemo(
    () =>
      new LayoutControllerClass({
        duplicateEntityPolicy,
        initialState: {
          activeView: 'channels',
          // D7 — when the SDK owns per-view rendering (workspace or `views` map), seed
          // every layout's slots/bindings up front from its descriptor (no lazy seed
          // effect). In bare `children` mode the app claims slots itself, so seed only
          // the channels slot topology.
          layouts: seedAllLayouts
            ? seedLayoutsFromDescriptors(layoutDescriptors, resolvedMinSlots)
            : {
                channels: createLayoutRuntimeState({
                  availableSlots: initialAvailableSlots,
                  slotNames: resolvedSlotNames,
                }),
              },
          maxSlots: resolvedMaxSlots,
          minSlots: resolvedMinSlots,
        },
        resolveDuplicateEntity,
      }),
    [
      duplicateEntityPolicy,
      initialAvailableSlots,
      layoutDescriptors,
      resolvedMaxSlots,
      resolvedMinSlots,
      resolvedSlotNames,
      resolveDuplicateEntity,
      seedAllLayouts,
    ],
  );

  const effectiveLayoutController = layoutController ?? internalLayoutController;

  const { activeView } =
    useStateStore(effectiveLayoutController.state, activeViewSelector) ??
    activeViewSelector(effectiveLayoutController.state.getLatestValue());

  const setActiveView = useCallback(
    (cv: ChatView) => {
      // Per-view layouts are retained across switches (that is the point of the
      // `layouts` map): each view keeps its own slot bindings so returning to it
      // restores what was open. We must NOT release the source view's channel/thread
      // bindings here — display is slot-based, so releasing on switch would drop the
      // open channel/thread (e.g. `?channel=` cleared when moving to the threads view).
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
      entityInferers: entityInferrers,
      layoutController: effectiveLayoutController,
      registerViewActionSlotResolvers,
      resolveActionTargetSlot,
      setActiveView,
    }),
    [
      activeView,
      effectiveLayoutController,
      entityInferrers,
      registerViewActionSlotResolvers,
      resolveActionTargetSlot,
      setActiveView,
    ],
  );

  // Register per-view navigation action resolvers supplied via the `views`-mode prop.
  useEffect(() => {
    if (!viewActionSlotResolversProp) return;
    const entries = Object.entries(viewActionSlotResolversProp) as Array<
      [ChatView, ViewActionSlotResolvers | undefined]
    >;
    entries.forEach(([view, resolvers]) =>
      registerViewActionSlotResolvers(view, resolvers),
    );
    return () => {
      entries.forEach(([view]) => registerViewActionSlotResolvers(view, undefined));
    };
  }, [registerViewActionSlotResolvers, viewActionSlotResolversProp]);

  const workspaceLayoutState =
    useStateStore(effectiveLayoutController.state, workspaceLayoutStateSelector) ??
    workspaceLayoutStateSelector(effectiveLayoutController.state.getLatestValue());
  const { viewState } = workspaceLayoutState;

  const slotKindRegistry = useMemo(
    () => resolveSlotKindRegistry(slotRenderers),
    [slotRenderers],
  );

  // D8 — the active view's content is rendered in a single a11y tabpanel; per-view slot
  // topology is seeded from its `layouts` descriptor. Always-on `children` (e.g. sync
  // helpers, dialog managers) render alongside it, regardless of the active view.
  const activeViewContent = views?.[activeView];

  const content = views ? (
    <>
      {children}
      {activeViewContent != null && (
        <div
          aria-labelledby={a11yValue.chatViewTabIds[activeView]}
          className={`str-chat__chat-view__${activeView}`}
          id={a11yValue.chatViewPanelIds[activeView]}
          role='tabpanel'
        >
          {activeViewContent}
        </div>
      )}
    </>
  ) : layout === BUILTIN_WORKSPACE_LAYOUT ? (
    (() => {
      const slots = viewState.availableSlots.map((slot) => {
        const content = renderSlotFromRegistry(
          getChatViewEntityBinding(viewState.slotBindings[slot]),
          slot,
          slotKindRegistry,
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
  ) : (
    children
  );

  return (
    <ChatViewA11yContext.Provider value={a11yValue}>
      <ChatViewContext.Provider value={value}>
        <SlotRegistryContext.Provider value={slotKindRegistry}>
          <ChatViewNavigationProvider>
            <div className={clsx('str-chat', theme, 'str-chat__chat-view')}>
              {/* Host the chat-view dialog manager INSIDE `.str-chat` so dialogs opened by
                  view content (context menus, member actions, …) portal here and inherit the
                  `.str-chat`-scoped dialog CSS. Nested managers (e.g. MessageList's) still win
                  where present. */}
              <DialogManagerProvider id={dialogManagerId}>
                {content}
              </DialogManagerProvider>
            </div>
          </ChatViewNavigationProvider>
        </SlotRegistryContext.Provider>
      </ChatViewContext.Provider>
    </ChatViewA11yContext.Provider>
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
      window.removeEventListener('blur', handleVisibilityChange);
      window.removeEventListener('focus', handleVisibilityChange);
    };
  }, [activeThread]);
};

// D8 — `ThreadAdapter` is retired: the threads view renders the thread(s) bound in
// thread slots (via `useSlotThreads` + `ThreadProvider`), so there is no single
// `activeThread` adapter. `useActiveThread` remains for callers that render a thread
// panel and want focus-driven activate/deactivate.

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

const unreadThreadCountSelector = ({ unreadThreadCount }: ThreadManagerState) => ({
  unreadThreadCount,
});

export type ChatViewSelectorItemProps = {
  iconOnly?: boolean;
};

export const ChatViewChannelsSelectorButton = ({
  iconOnly = true,
}: ChatViewSelectorItemProps) => {
  const { activeView, setActiveView } = useChatViewContext();
  const { chatViewPanelIds, chatViewTabIds } = useChatViewA11yContext();
  const { t } = useTranslationContext();

  const isActive = activeView === 'channels';

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
      onClick={() => setActiveView('channels')}
      onPointerDown={() => setActiveView('channels')}
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
  const { activeView, setActiveView } = useChatViewContext();
  const { chatViewPanelIds, chatViewTabIds } = useChatViewA11yContext();
  const { t } = useTranslationContext();

  const isActive = activeView === 'threads';

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
      onClick={() => setActiveView('threads')}
      onPointerDown={() => setActiveView('threads')}
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

ChatView.Selector = ChatViewSelector;
