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
import { useStableId } from '../../components/UtilityComponents/useStableId';

import { Button, type ButtonProps } from '../../components/Button';
import { UnreadCountBadge } from '../../components/Threads/UnreadCountBadge';
import {
  DialogManagerProvider,
  useChatContext,
  useComponentContextIcons,
  useTranslationContext,
} from '../../context';
import { useStateStore } from '../../store';
import {
  type ChatViewA11yContextValue,
  createChatViewA11yContextValue,
  DEFAULT_CHAT_VIEW_A11Y_CONTEXT_VALUE,
} from './ChatView.a11y.utility';
import { ChatViewNavigationProvider } from './ChatViewNavigationContext';
import { WorkspaceNavigationAdapter } from './workspaceNavigationAdapter';
import type { DeriveWorkspaceNavigation } from './workspaceNavigationAdapter';
import { WorkspaceLayout } from './layout/WorkspaceLayout';
import {
  createLayoutRuntimeState,
  LayoutController as LayoutControllerClass,
} from './layoutController/LayoutController';
import { createChatViewSlotBinding, getChatViewEntityBinding } from './slotBinding';
import { SupersededChannelSwap } from './SupersededChannelSwap';
import {
  hasSlotContent,
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
import { requireContext } from '../../context/requireContext';
import { ThemeScopeProvider } from '../../context/ThemeScopeContext';

// Binding primitives live in `./slotBinding` so `<Slot>` and the renderer registry avoid an
// import cycle; they are re-exported here so imports through ChatView keep resolving.
export * from './slotBinding';
export type { SlotKindDefinition, SlotKindRegistry } from './slotRegistry';
export { defaultSlotKindRegistry } from './slotRegistry';

export type ChatView = 'channels' | 'threads';

export type ChatViewEntityInferer = {
  kind: ChatViewEntityBinding['kind'];
  match: (source: unknown) => boolean;
  toBinding: (source: unknown) => ChatViewEntityBinding;
};

export type ChatViewBuiltinLayout = 'nav-rail-entity-list-workspace';

export type ChatViewProps = PropsWithChildren<{
  /**
   * Overrides members of the {@link WorkspaceNavigation} that ChatView provides. Receives the
   * SDK-derived navigation and returns only the members to replace. Must be referentially stable.
   */
  deriveWorkspaceNavigation?: DeriveWorkspaceNavigation;
  /**
   * ID of the dialog manager ChatView hosts inside its `.str-chat` root. Dialogs opened by view
   * content resolve to it, so their overlays get the `.str-chat`-scoped CSS. Omit for a local,
   * unregistered manager.
   */
  dialogManagerId?: string;
  duplicateEntityPolicy?: DuplicateEntityPolicy;
  entityInferrers?: ChatViewEntityInferer[];
  layout?: ChatViewBuiltinLayout;
  layoutController?: LayoutController;
  layouts?: LayoutDescriptor[];
  resolveDuplicateEntity?: ResolveDuplicateEntity;
  /**
   * Rendered by the built-in workspace layout in a slot with nothing bound. A layout whose slots
   * are all blank shows {@link ChatViewEmptyPlaceholder}.
   */
  SlotFallback?: ComponentType<ChatViewSlotFallbackProps>;
  /** Per-slot {@link ChatViewProps.SlotFallback}. */
  slotFallbackComponents?: Partial<
    Record<string, ComponentType<ChatViewSlotFallbackProps>>
  >;
  slotRenderers?: ChatViewSlotRenderers;
  /**
   * Content per view. Only the active view's node renders, in a plain `<div>` whose `id` comes
   * from `chatViewPanelIds`; its slots come from the matching `layouts` descriptor.
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

// No default: a shared `LayoutController` would let unrelated subtrees write to one instance.
export const ChatViewContext = createContext<ChatViewContextValue | undefined>(undefined);
const ChatViewA11yContext = createContext<ChatViewA11yContextValue>(
  DEFAULT_CHAT_VIEW_A11Y_CONTEXT_VALUE,
);

export const useChatViewContext = () =>
  requireContext(useContext(ChatViewContext), 'useChatViewContext', 'ChatView');

const activeViewSelector = ({ activeView }: ChatViewLayoutState) => ({ activeView });
const workspaceLayoutStateSelector = (state: ChatViewLayoutState) => ({
  activeView: state.activeView,
  viewState: getLayoutViewState(state),
});

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
}) => slotFallbackComponents?.[slot] ?? SlotFallback;

const BUILTIN_WORKSPACE_LAYOUT: ChatViewBuiltinLayout = 'nav-rail-entity-list-workspace';
const DEFAULT_LIST_BINDING_KEY = 'list';

// Each built-in view seeds its own list kind into the first slot; the kind picks the renderer.
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

// Without app `layouts`, each view has a single slot.
const DEFAULT_SLOT_NAMES: SlotName[] = ['slot1'];
const DEFAULT_LAYOUT_DESCRIPTORS = buildDefaultLayoutDescriptors(DEFAULT_SLOT_NAMES);

// Turns layout descriptors into seeded per-layout runtime state for the controller's initial state.
const seedLayoutsFromDescriptors = (
  descriptors: LayoutDescriptor[],
): Partial<Record<ChatView, LayoutRuntimeState>> =>
  descriptors.reduce<Partial<Record<ChatView, LayoutRuntimeState>>>((acc, descriptor) => {
    const slotBindings: Record<SlotName, LayoutSlotBinding | undefined> = {};
    Object.entries(descriptor.initialBindings ?? {}).forEach(([slot, entity]) => {
      if (entity) slotBindings[slot] = createChatViewSlotBinding(entity);
    });
    acc[descriptor.id] = createLayoutRuntimeState({
      availableSlots: descriptor.slots,
      slotBindings,
      slotNames: descriptor.slots,
    });
    return acc;
  }, {});

export const ChatView = ({
  children,
  deriveWorkspaceNavigation,
  dialogManagerId,
  duplicateEntityPolicy,
  entityInferrers = [],
  layout,
  layoutController,
  layouts: layoutsProp,
  resolveDuplicateEntity,
  SlotFallback,
  slotFallbackComponents,
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
  const layoutDescriptors = layoutsProp ?? DEFAULT_LAYOUT_DESCRIPTORS;

  // Seeds from descriptors when the SDK renders the views (built-in workspace, `views`) or the app
  // passes `layouts`; otherwise the app renders its own lists and only the channels view is seeded.
  const seedFromDescriptors =
    !!layoutsProp || layout === BUILTIN_WORKSPACE_LAYOUT || !!views;

  const internalLayoutController = useMemo(
    () =>
      new LayoutControllerClass({
        duplicateEntityPolicy,
        initialState: {
          activeView: 'channels',
          layouts: seedFromDescriptors
            ? seedLayoutsFromDescriptors(layoutDescriptors)
            : {
                channels: createLayoutRuntimeState({
                  availableSlots: DEFAULT_SLOT_NAMES,
                  slotNames: DEFAULT_SLOT_NAMES,
                }),
              },
        },
        resolveDuplicateEntity,
      }),
    [
      duplicateEntityPolicy,
      layoutDescriptors,
      resolveDuplicateEntity,
      seedFromDescriptors,
    ],
  );

  const effectiveLayoutController = layoutController ?? internalLayoutController;

  const { activeView } =
    useStateStore(effectiveLayoutController.state, activeViewSelector) ??
    activeViewSelector(effectiveLayoutController.state.getLatestValue());

  const setActiveView = useCallback(
    (cv: ChatView) => {
      // Each view keeps its own slot bindings across switches, so do not release the source
      // view's bindings here: display is slot-based and releasing would drop the open channel.
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

  // Always-on `children` (e.g. sync helpers) render alongside the active view's content.
  const activeViewContent = views?.[activeView];

  const content = views ? (
    <>
      {children}
      {activeViewContent != null && (
        <div
          className={`str-chat__chat-view__${activeView}`}
          id={a11yValue.chatViewPanelIds[activeView]}
        >
          {activeViewContent}
        </div>
      )}
    </>
  ) : layout === BUILTIN_WORKSPACE_LAYOUT ? (
    (() => {
      // an unbound slot with no fallback has no content; the layout decides what that shows
      const slots = viewState.availableSlots.map((slot) => {
        const content = renderSlotFromRegistry(
          getChatViewEntityBinding(viewState.slotBindings[slot]),
          slot,
          slotKindRegistry,
        );
        if (hasSlotContent(content)) return { content, slot };
        const Fallback = resolveSlotFallbackComponent({
          slot,
          SlotFallback,
          slotFallbackComponents,
        });
        return { content: Fallback ? <Fallback slot={slot} /> : null, slot };
      });

      return <WorkspaceLayout navRail={<ChatViewSelector />} slots={slots} />;
    })()
  ) : (
    children
  );

  // every slot showing a channel, so one that gets superseded moves to the instance replacing it
  const channelSlots = viewState.availableSlots.flatMap((slot) => {
    const entity = getChatViewEntityBinding(viewState.slotBindings[slot]);
    return entity?.kind === 'channel'
      ? [{ bindingKey: entity.key, channel: entity.source, slot }]
      : [];
  });

  return (
    <ChatViewA11yContext.Provider value={a11yValue}>
      <ChatViewContext.Provider value={value}>
        <SlotRegistryContext.Provider value={slotKindRegistry}>
          <ChatViewNavigationProvider>
            {/* Core components navigate through this slot-agnostic adapter, not the slot API. */}
            <WorkspaceNavigationAdapter
              deriveWorkspaceNavigation={deriveWorkspaceNavigation}
            >
              <div className={clsx('str-chat', theme, 'str-chat__chat-view')}>
                {/* The dialog manager sits inside `.str-chat` so dialogs portal under it; nested
                    managers (e.g. MessageList's) still win. */}
                <ThemeScopeProvider>
                  <DialogManagerProvider id={dialogManagerId}>
                    {content}
                  </DialogManagerProvider>
                </ThemeScopeProvider>
                {channelSlots.map(({ bindingKey, channel, slot }) => (
                  <SupersededChannelSwap
                    bindingKey={bindingKey}
                    channel={channel}
                    key={slot}
                    layoutController={effectiveLayoutController}
                    slot={slot}
                  />
                ))}
              </div>
            </WorkspaceNavigationAdapter>
          </ChatViewNavigationProvider>
        </SlotRegistryContext.Provider>
      </ChatViewContext.Provider>
    </ChatViewA11yContext.Provider>
  );
};

/**
 * Activates the thread while the window is visible and focused, and releases it otherwise.
 *
 * @param params.activeThread - Thread to activate. Does nothing when undefined.
 */
export const useActiveThread = ({ activeThread }: { activeThread?: Thread }) => {
  useEffect(() => {
    if (!activeThread) return;

    // one activation at a time: a repeated focus event must not stack another one
    let release: (() => void) | undefined;
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && document.hasFocus()) {
        release ??= activeThread.activate();
      } else {
        release?.();
        release = undefined;
      }
    };

    handleVisibilityChange();

    window.addEventListener('focus', handleVisibilityChange);
    window.addEventListener('blur', handleVisibilityChange);
    return () => {
      release?.();
      window.removeEventListener('blur', handleVisibilityChange);
      window.removeEventListener('focus', handleVisibilityChange);
    };
  }, [activeThread]);
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
        aria-current={isActive || undefined}
        aria-label={props['aria-label'] ?? (shouldShowTooltip ? text : undefined)}
        className={clsx('str-chat__chat-view__selector-button', className)}
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
  const { IconMessageBubble, IconMessageBubbleFill } = useComponentContextIcons();
  const { activeView, setActiveView } = useChatViewContext();
  const { t } = useTranslationContext();

  const isActive = activeView === 'channels';

  return (
    <ChatViewSelectorButton
      ActiveIcon={IconMessageBubbleFill}
      aria-label={t(
        'slotLayout.chatView.openChannelsView.ariaLabel',
        'Open channels view',
      )}
      Icon={IconMessageBubble}
      iconOnly={iconOnly}
      isActive={isActive}
      onClick={() => setActiveView('channels')}
      onPointerDown={() => setActiveView('channels')}
      text={t('slotLayout.chatView.channels.text', 'Channels')}
    />
  );
};

export const ChatViewThreadsSelectorButton = ({
  iconOnly = true,
}: ChatViewSelectorItemProps) => {
  const { IconThread, IconThreadFill } = useComponentContextIcons();
  const { client } = useChatContext();
  const { unreadThreadCount } = useStateStore(
    client.threads.state,
    unreadThreadCountSelector,
  ) ?? {
    unreadThreadCount: 0,
  };
  const { activeView, setActiveView } = useChatViewContext();
  const { t } = useTranslationContext();

  const isActive = activeView === 'threads';
  const label =
    unreadThreadCount > 0
      ? t('slotLayout.chatView.openThreadsViewUnread.ariaLabel', {
          count: unreadThreadCount,
          defaultValue_one: 'Open threads view, {{ count }} unread thread',
          defaultValue_other: 'Open threads view, {{ count }} unread threads',
        })
      : t('slotLayout.chatView.openThreadsView.ariaLabel', 'Open threads view');

  return (
    <ChatViewSelectorButton
      ActiveIcon={IconThreadFill}
      aria-label={label}
      Icon={IconThread}
      iconOnly={iconOnly}
      isActive={isActive}
      onClick={() => setActiveView('threads')}
      onPointerDown={() => setActiveView('threads')}
      text={t('common.threads.text', 'Threads')}
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

/**
 * Navigation landmark with one button per view. The shown view's button has `aria-current="true"`,
 * not `"page"`, because a host UI embedding ChatView may own the page.
 */
const ChatViewSelector = ({
  iconOnly = true,
  itemSet = defaultChatViewSelectorItemSet,
}: ChatViewSelectorProps) => {
  const { t } = useTranslationContext();

  return (
    <div
      aria-label={t(
        'slotLayout.chatView.chatViewControls.ariaLabel',
        'Chat view controls',
      )}
      className='str-chat__chat-view__selector'
      role='navigation'
    >
      {itemSet.map(({ Component, type }) => (
        <Component iconOnly={iconOnly} key={type} />
      ))}
    </div>
  );
};

ChatView.Selector = ChatViewSelector;
