import clsx from 'clsx';
import type {
  ChannelMemberResponse,
  Channel as StreamChannel,
  Thread as ThreadType,
  UserResponse,
} from 'stream-chat';
import {
  type ComponentType,
  type MouseEvent,
  type PropsWithChildren,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  AIStateIndicator,
  Button,
  Channel,
  ChannelAvatar,
  ChannelHeader,
  ChannelListItem,
  ChannelSearchResultItem,
  ChatView,
  type ChatViewSelectorEntry,
  EmptyStateIndicator,
  IconArrowLeft,
  IconXmark,
  MessageComposer,
  MessageList,
  MessageSearchResultItem,
  ModalContextProvider,
  SearchSourceResultList,
  type SearchSourceResultListProps,
  Thread,
  type ThreadHeaderProps,
  ThreadList,
  ThreadProvider,
  ThreadSlot,
  TypingIndicator,
  useActiveThread,
  useChatContext,
  useChatViewNavigation,
  UserSearchResultItem,
  useSlotChannel,
  useSlotThread,
  useSlotTopLayerEntity,
  useTranslationContext,
  VirtualizedMessageList,
  WithComponents,
  WithDragAndDropUpload,
} from 'stream-chat-react';
import {
  ChannelDetailProvider,
  ChannelMemberDetail,
} from 'stream-chat-react/channel-detail';

import { useAppSettingsSelector } from '../AppSettings/state';
import { ConfiguredAvatarWithChannelDetail } from './ConfiguredChannelDetail.tsx';
import {
  resolveRevealAction,
  useRegisterSlotGeometry,
  useSlotGeometry,
} from 'stream-chat-react/slot-geometry';
import {
  CHANNEL_THREAD_SLOT,
  DESKTOP_LAYOUT_BREAKPOINT,
  MAIN_CHANNEL_SLOT,
  MAIN_THREAD_SLOT,
  OPTIONAL_THREAD_SLOT,
} from './constants.ts';
import { SidebarResizeHandle, ThreadResizeHandle } from './Resize.tsx';
import { ReturnToSkipNavigation } from '../AccessibilityNavigation/ReturnToSkipNavigation.tsx';
import { ChannelPreviewOverlay } from '../ChannelPreviewOverlay/ChannelPreviewOverlay.tsx';
import { useSidebar } from './SidebarContext.tsx';
import { SwitchableChannelNavigation } from './SwitchableChannelNavigation.tsx';
import { ThreadStateSync } from './Sync.tsx';

export const CHANNEL_MESSAGE_COMPOSER_TEXTAREA_TARGET_ID =
  'app-channel-message-composer-textarea';
export const CHANNEL_LIST_TARGET_ID = 'app-channel-list';
export const CHANNELS_SELECTOR_BUTTON_TARGET_QUERY =
  '[id^="str-chat__chat-view-"][id$="-tab-channels"]';

// Whether the app-settings "message list" toggle is set to the virtualized list. Read the same
// way everywhere so every channel and thread honors the setting (not just the primary channel).
const useVirtualizedMessageList = () =>
  useAppSettingsSelector((s) => s.messageList).type === 'virtualized';

// Shared sidebar overlay: the view selector (nav rail) + the view-specific list. Extracted
// so the selector isn't duplicated across the channels/threads panels. (It still renders
// per active view — the layout CSS scopes the collapsible overlay to each view's layout, so
// a single always-mounted rail would need a separate CSS refactor.)
const ChatSidebar = ({
  children,
  iconOnly,
  itemSet,
}: PropsWithChildren<{ iconOnly?: boolean; itemSet?: ChatViewSelectorEntry[] }>) => (
  <div className='app-chat-sidebar-overlay'>
    <ChatView.Selector iconOnly={iconOnly} itemSet={itemSet} />
    {children}
  </div>
);

// Channel list item whose click opens the channel via ChatView navigation. A plain click
// opens it in the primary slot (default resolution); ctrl/⌘-click opens it beside the
// current channel, in the secondary slot where the reply thread normally sits.
const CustomChannelListItem = ({ item }: { item: unknown }) => {
  const channel = item as StreamChannel;
  const { open } = useChatViewNavigation();
  const openChannel = (event: MouseEvent) => {
    const binding = {
      key: channel.cid ?? undefined,
      kind: 'channel' as const,
      source: channel,
    };
    // ctrl/⌘-click opens the channel beside the current one (secondary slot); a plain click
    // opens it in place. `additive` lets the navigation layer pick the secondary slot rather
    // than hard-coding its name here.
    open(binding, {
      // ⌘/ctrl-click opens beside the current channel (secondary slot). The SDK base policy
      // binds it there if free, or stacks a layer if the slot is occupied (e.g. an open reply
      // thread) — no explicit `layer` needed.
      additive: event.ctrlKey || event.metaKey,
    });
  };
  return <ChannelListItem channel={channel} onSelect={openChannel} />;
};

// Search result items wired for ⌘/Ctrl-click here in the app (the SDK items default to a plain
// open; the "open beside" UX decision belongs to the app). Plain click opens in place;
// ctrl/⌘-click opens the result beside the current channel (additive -> secondary slot).
const SearchChannelResult = ({ item }: { item: StreamChannel }) => {
  const { open } = useChatViewNavigation();
  return (
    <ChannelSearchResultItem
      item={item}
      onSelect={(event) =>
        open(
          { key: item.cid ?? undefined, kind: 'channel', source: item },
          {
            // ⌘/ctrl-click opens beside the current channel (secondary slot). The SDK base policy
            // binds it there if free, or stacks a layer if the slot is occupied (e.g. an open reply
            // thread) — no explicit `layer` needed.
            additive: event.ctrlKey || event.metaKey,
          },
        )
      }
    />
  );
};

const SearchUserResult = ({ item }: { item: UserResponse }) => {
  const { open } = useChatViewNavigation();
  const { client } = useChatContext();
  return (
    <UserSearchResultItem
      item={item}
      onSelect={(event) => {
        const channel = client.channel('messaging', {
          members: [client.userID as string, item.id],
        });
        void channel.watch();
        open(
          { key: channel.cid ?? undefined, kind: 'channel', source: channel },
          {
            // ⌘/ctrl-click opens beside the current channel (secondary slot). The SDK base policy
            // binds it there if free, or stacks a layer if the slot is occupied (e.g. an open reply
            // thread) — no explicit `layer` needed.
            additive: event.ctrlKey || event.metaKey,
          },
        );
      }}
    />
  );
};

// Injects the ⌘/Ctrl-aware channel/user result items (messages keep the default). Provided to
// the channels view via ComponentContext (overrides the SDK's SearchSourceResultList).
const SplitAwareSearchResultList = (props: SearchSourceResultListProps) => (
  <SearchSourceResultList
    {...props}
    SearchResultItems={{
      channels: SearchChannelResult,
      messages: MessageSearchResultItem,
      users: SearchUserResult,
    }}
  />
);

// The in-channel reply thread is opened into the channels view's secondary slot (the same
// slot a 2nd channel can occupy) — bound by the message "reply in thread" / replies-count
// actions via `open`. It renders only when a thread is bound; `ThreadProvider` feeds it to
// <Thread>, and `useActiveThread` activates/deactivates it with window focus.
const ChannelThreadPanel = ({
  onOpenMemberDetail,
  thread,
}: {
  // Clicking an avatar/mention in the thread opens the member profile as a layer over this panel.
  onOpenMemberDetail: (userId?: string) => void;
  thread?: ThreadType;
}) => {
  const isOpen = !!thread;
  const virtualized = useVirtualizedMessageList();
  const registerThreadSlot = useRegisterSlotGeometry(CHANNEL_THREAD_SLOT);
  useActiveThread({ activeThread: thread });

  const panelClassName = clsx(
    'str-chat__dropzone-root--thread app-chat-secondary-panel',
    { 'app-chat-secondary-panel--open': isOpen },
  );

  // The resize handle is rendered once at the slot level (see `ResponsiveChannelPanels`), not
  // here — the bar belongs to the slot, which may hold layers, not to this base content.
  return thread ? (
    // ThreadProvider wraps the dropzone so WithDragAndDropUpload's `useChannel` resolves
    // the thread's own channel — the thread panel no longer depends on an ambient
    // <Channel>, so it can live in its own slot beside the primary channel.
    <ThreadProvider thread={thread}>
      <WithDragAndDropUpload className={panelClassName}>
        <ReturnToSkipNavigation />
        <Thread
          additionalMessageComposerProps={{
            audioRecordingEnabled: true,
            asyncMessagesMultiSendEnabled: true,
          }}
          // Standard (non-virtualized) thread list forwards these; the virtualized list drills
          // a narrower prop set, so member-detail-from-thread follows the standard-list default.
          additionalMessageListProps={{
            onMentionsClick: (_event, mentionedUsers) =>
              onOpenMemberDetail(mentionedUsers[0]?.id),
            onUserClick: (_event, user) => onOpenMemberDetail(user.id),
          }}
          virtualized={virtualized}
        />
      </WithDragAndDropUpload>
    </ThreadProvider>
  ) : (
    // Closed state: just the collapsed-width shell (no dropzone, so no channel needed).
    // Registered with the geometry module; the open branch above is a WithDragAndDropUpload
    // (no ref forwarding), but there the primary channel collapses so `isObscured` still fires.
    <div className={panelClassName} ref={registerThreadSlot} />
  );
};

// Header affordance for the secondary channel, injected into its ChannelHeader via the
// `HeaderStartContent` component slot (ChannelHeader has no built-in one the way the reply thread's
// ThreadHeader does). Both variants call `close(CHANNEL_THREAD_SLOT)` — which pops the top layer
// if any, else releases the base (layer-aware close). The icon just signals intent: a **back**
// arrow when the channel is a layer over something to return to, a **close** X otherwise.
const SecondaryChannelHeaderButton = ({ variant }: { variant: 'back' | 'close' }) => {
  const { close } = useChatViewNavigation();
  const isBack = variant === 'back';

  return (
    <Button
      appearance='ghost'
      aria-label={isBack ? 'Back' : 'Close split'}
      circular
      onClick={() => close(CHANNEL_THREAD_SLOT)}
      size='md'
      variant='secondary'
    >
      {isBack ? <IconArrowLeft /> : <IconXmark />}
    </Button>
  );
};

const SecondaryChannelCloseButton = () => (
  <SecondaryChannelHeaderButton variant='close' />
);
const SecondaryChannelBackButton = () => <SecondaryChannelHeaderButton variant='back' />;

// The 2nd channel's content: its own <Channel> (a sibling of the primary channel, not nested)
// with header + list + composer inside the dropzone so WithDragAndDropUpload's `useChannel`
// resolves it. Shared by the base side-by-side panel and the layer overlay below. The close
// affordance is injected into the header via HeaderStartContent (`close(CHANNEL_THREAD_SLOT)`
// releases the base or pops the layer, per the layer-aware close).
const SecondChannelContent = ({
  channel,
  HeaderStartContent = SecondaryChannelCloseButton,
}: {
  channel: StreamChannel;
  HeaderStartContent?: ComponentType;
}) => {
  const virtualized = useVirtualizedMessageList();
  return (
    <Channel channel={channel}>
      <WithComponents overrides={{ HeaderStartContent }}>
        <WithDragAndDropUpload className='str-chat__dropzone-root--thread'>
          <ChannelHeader Avatar={ConfiguredAvatarWithChannelDetail} />
          <div className='app-chat-view__channel-body'>
            {virtualized ? (
              <VirtualizedMessageList returnAllReadData shouldGroupByUser />
            ) : (
              <MessageList returnAllReadData />
            )}
            <MessageComposer asyncMessagesMultiSendEnabled audioRecordingEnabled />
          </div>
        </WithDragAndDropUpload>
      </WithComponents>
    </Channel>
  );
};

// Shared wrapper for a layer covering the secondary slot: mirrors the channel container's
// `.str-chat` + theme root (so `--str-chat__*` tokens and component styles resolve) and carries
// the opaque, bordered `.app-chat-secondary-overlay` surface. The base panel stays mounted beneath.
const SecondarySlotOverlay = ({ children }: PropsWithChildren) => {
  const { theme } = useChatContext();
  return (
    <div className={clsx('str-chat', theme, 'app-chat-secondary-overlay')}>
      {children}
    </div>
  );
};

// The secondary channels-view slot can hold a 2nd channel side-by-side as its BASE binding
// (⌘/ctrl-click a channel into a free secondary slot). It renders in the same column the reply
// thread uses.
const SecondChannelPanel = ({ channel }: { channel: StreamChannel }) => {
  const registerThreadSlot = useRegisterSlotGeometry(CHANNEL_THREAD_SLOT);
  // The resize handle is rendered once at the slot level (see `ResponsiveChannelPanels`).
  return (
    <div
      className='app-chat-secondary-panel app-chat-secondary-panel--open'
      ref={registerThreadSlot}
    >
      <SecondChannelContent channel={channel} />
    </div>
  );
};

// A 2nd channel opened as a LAYER over the slot's current content — ⌘/ctrl-click a channel while a
// reply thread (or another panel) already occupies the secondary slot. Enabled by the SDK's
// `open(binding, { additive: true, layer: true })` base policy: it covers the base without closing
// it, and `close(CHANNEL_THREAD_SLOT)` pops the layer to reveal what was underneath.
const SecondChannelOverlay = ({
  channel,
  hasBaseBeneath,
}: {
  channel: StreamChannel;
  /** When something sits under this layer (a reply thread / another panel), the header shows a
   *  "back" affordance instead of "close" — both pop this layer to reveal it. */
  hasBaseBeneath: boolean;
}) => (
  <SecondarySlotOverlay>
    <SecondChannelContent
      channel={channel}
      HeaderStartContent={
        hasBaseBeneath ? SecondaryChannelBackButton : SecondaryChannelCloseButton
      }
    />
  </SecondarySlotOverlay>
);

// A thread overlay is always a layer stacked over the secondary slot's base, so its header gets a
// BACK affordance rather than a close: it pops the layer (`close` is layer-aware), revealing what's
// beneath. The SDK ThreadHeader hardcodes a close-X with no icon override, so we render a small
// header of our own (back + title) here.
const LayerThreadHeader = ({ thread }: ThreadHeaderProps) => {
  const { close } = useChatViewNavigation();
  const { t } = useTranslationContext();
  const replyCount = thread?.reply_count ?? 0;

  return (
    <div className='str-chat__thread-header'>
      <div className='str-chat__thread-header__start'>
        <Button
          appearance='ghost'
          aria-label={t('Back')}
          circular
          onClick={() => close(CHANNEL_THREAD_SLOT)}
          size='md'
          variant='secondary'
        >
          <IconArrowLeft />
        </Button>
      </div>
      <div className='str-chat__thread-header-details'>
        <div className='str-chat__thread-header-title'>{t('Thread')}</div>
        <div className='str-chat__thread-header-subtitle'>
          {replyCount === 1
            ? t('1 reply')
            : t('{{ count }} replies', { count: replyCount })}
        </div>
      </div>
    </div>
  );
};

// A reply thread shown as a LAYER over the secondary slot — e.g. clicking the replies button inside
// a 2nd channel that occupies the slot. The SDK base policy stacks the thread on top (rather than
// binding it invisibly beneath); here we render that top layer in the shared overlay wrapper, with
// a header close that pops the layer to reveal the channel beneath.
const ChannelThreadOverlay = ({ thread }: { thread: ThreadType }) => {
  const virtualized = useVirtualizedMessageList();
  useActiveThread({ activeThread: thread });
  return (
    <SecondarySlotOverlay>
      <ThreadProvider thread={thread}>
        <WithComponents overrides={{ ThreadHeader: LayerThreadHeader }}>
          <Thread
            additionalMessageComposerProps={{
              asyncMessagesMultiSendEnabled: true,
              audioRecordingEnabled: true,
            }}
            virtualized={virtualized}
          />
        </WithComponents>
      </ThreadProvider>
    </SecondarySlotOverlay>
  );
};

// A member profile shown over the secondary slot — opened by clicking a message avatar or a mention
// in either the primary channel or the reply thread (see `ResponsiveChannelPanels` /
// `ChannelThreadPanel`). It's a `pushLayer` overlay, not a slot replacement: it renders absolutely
// over the secondary column (`.app-chat-secondary-overlay`) while the base panel stays mounted
// beneath, so `close`/back (which pop the layer) reveal the thread exactly where it was.
//
// We reuse the `userProfile` slot kind (source `{ userId }`) rather than adding a new SDK kind; the
// member is resolved here from the channel it belongs to. `ChannelMemberDetail` is built for the
// ChannelDetail navigator/modal, so we feed it the two contexts it expects standalone:
// `ChannelDetailProvider` (its member actions read the channel from `useChannelDetailContext`) and a
// `ModalContextProvider` whose `close` pops the layer (the detail header's close button calls it).
const ChannelMemberDetailOverlay = ({
  channel,
  hasBaseBeneath,
  userId,
}: {
  channel: StreamChannel;
  /** Whether a thread / 2nd channel sits under this overlay — if so, offer a "back" affordance
   *  (both back and close pop this single layer to reveal it). */
  hasBaseBeneath: boolean;
  userId: string;
}) => {
  const { close } = useChatViewNavigation();
  const [member, setMember] = useState<ChannelMemberResponse | undefined>(
    () => channel.state.members[userId],
  );

  useEffect(() => {
    const existing = channel.state.members[userId];
    if (existing) {
      setMember(existing);
      return;
    }
    // Not a cached member (e.g. large channel) — fetch just this one.
    let cancelled = false;
    channel
      .queryMembers({ id: { $in: [userId] } })
      .then((response) => {
        if (!cancelled) setMember(response.members[0]);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [channel, userId]);

  // Pops the member-profile layer (per the layer-aware `close`), revealing the base beneath.
  const closeOverlay = useCallback(() => close(CHANNEL_THREAD_SLOT), [close]);

  return (
    <SecondarySlotOverlay>
      {member ? (
        <ChannelDetailProvider channel={channel}>
          <ModalContextProvider
            value={{ close: closeOverlay, dialogId: 'app-member-detail' }}
          >
            <ChannelMemberDetail
              layout='inline'
              member={member}
              onBack={hasBaseBeneath ? closeOverlay : undefined}
            />
          </ModalContextProvider>
        </ChannelDetailProvider>
      ) : null}
    </SecondarySlotOverlay>
  );
};

const ResponsiveChannelPanels = ({ mainChannel }: { mainChannel?: StreamChannel }) => {
  // Register the primary channel column with the geometry module so `isObscured(MAIN_CHANNEL_SLOT)`
  // reflects reality (at narrow widths the open secondary panel collapses this column to ~0).
  const registerMainSlot = useRegisterSlotGeometry(MAIN_CHANNEL_SLOT);
  // The channel and the thread each occupy their OWN slot and render as siblings here: the
  // primary channel wraps only its own message panel, and the secondary slot — a reply
  // thread or a 2nd channel — sits beside it rather than nested inside the channel. A bound
  // Thread carries its own channel, so it no longer depends on an ambient <Channel>.
  const sideChannel = useSlotChannel({ slot: CHANNEL_THREAD_SLOT });
  const replyThread = useSlotThread({ slot: CHANNEL_THREAD_SLOT });
  // A member profile can also occupy the secondary slot — but as a *layer* on top of whatever is
  // there (a reply thread, a 2nd channel, or nothing), not by replacing it. Reading the top layer
  // (not the base binding) is what lets the thread beneath stay mounted so closing the profile
  // returns to it at its exact scroll position. We reuse the `userProfile` kind (source `{ userId }`).
  const memberProfile = useSlotTopLayerEntity({
    kind: 'userProfile',
    slot: CHANNEL_THREAD_SLOT,
  });
  // A channel opened as a layer (⌘/ctrl-click a channel while the secondary slot is occupied) — the
  // top layer's `channel` source. Covers the base (e.g. a reply thread) without closing it.
  const layerChannel = useSlotTopLayerEntity({
    kind: 'channel',
    slot: CHANNEL_THREAD_SLOT,
  });
  // A reply thread opened as a layer (e.g. replies clicked inside a 2nd channel occupying the slot)
  // — the top layer's `thread` source. Covers the base without closing it.
  const layerThread = useSlotTopLayerEntity({
    kind: 'thread',
    slot: CHANNEL_THREAD_SLOT,
  });
  const isSideOpen =
    !!sideChannel || !!replyThread || !!memberProfile || !!layerChannel || !!layerThread;
  const virtualized = useVirtualizedMessageList();
  const { close, pushLayer } = useChatViewNavigation();

  // Coverage-driven "reveal": when a navigation asked to reveal the channel (e.g. "Also sent in
  // channel → View" from the threads view — see AlsoSentInChannelIndicator), release the covering
  // thread once this view has mounted and the geometry plugin has measured the channel column.
  // Deferring to here — rather than the click handler — is what makes the cross-view case work:
  // the channel isn't mounted/measurable until after the view switch. `resolveRevealAction` keeps
  // it coverage-conditional (wide side-by-side layouts leave the thread) and one-shot.
  const { clearReveal, coverage, revealSlot } = useSlotGeometry();
  useEffect(() => {
    const action = resolveRevealAction(revealSlot, coverage);
    if (action === 'wait') return;
    if (action === 'act') close(CHANNEL_THREAD_SLOT);
    clearReveal();
  }, [clearReveal, close, coverage, revealSlot]);

  // Open a member's detail as a layer covering the secondary slot. The clicked user's id becomes the
  // `userProfile` source, which `ChannelMemberDetailOverlay` resolves back to a channel member.
  const openMemberDetail = useCallback(
    (userId?: string) => {
      if (!userId) return;
      pushLayer(CHANNEL_THREAD_SLOT, {
        key: userId,
        kind: 'userProfile',
        source: { userId },
      });
    },
    [pushLayer],
  );

  return (
    <div
      className={clsx('app-chat-view__channel-content', {
        'app-chat-view__channel-content--secondary-open': isSideOpen,
      })}
    >
      {mainChannel && (
        // The main column wrapper carries `.app-chat-view__channel-main` (the existing layout
        // rules size it); the primary <Channel> lives inside it — a sibling of the secondary
        // panel below, not its ancestor.
        <div className='app-chat-view__channel-main' ref={registerMainSlot}>
          <Channel channel={mainChannel}>
            <WithDragAndDropUpload>
              <ChannelHeader Avatar={ConfiguredAvatarWithChannelDetail} />
              <div className='app-chat-view__channel-body'>
                {virtualized ? (
                  // VirtualizedMessageList drills a narrower prop set and doesn't forward
                  // onUserClick/onMentionsClick — wiring member-detail there would need a custom
                  // Message component. The demo's default list is the standard one below.
                  <VirtualizedMessageList returnAllReadData shouldGroupByUser />
                ) : (
                  <MessageList
                    onMentionsClick={(_event, mentionedUsers) =>
                      openMemberDetail(mentionedUsers[0]?.id)
                    }
                    onUserClick={(_event, user) => openMemberDetail(user.id)}
                    returnAllReadData
                  />
                )}
                <ReturnToSkipNavigation />
                <AIStateIndicator />
                <MessageComposer
                  additionalTextareaProps={{
                    id: CHANNEL_MESSAGE_COMPOSER_TEXTAREA_TARGET_ID,
                  }}
                  asyncMessagesMultiSendEnabled
                  audioRecordingEnabled
                  maxRows={10}
                />
                <ChannelPreviewOverlay />
              </div>
            </WithDragAndDropUpload>
          </Channel>
        </div>
      )}
      {/* The resize handle belongs to the SLOT, not its contents: it's rendered once here and
          driven by whether the slot is open (base binding OR a layer such as the member profile),
          so a layer that covers the base — or is the only occupant — stays resizable. */}
      <ThreadResizeHandle isOpen={isSideOpen} />
      {/* The base of the secondary slot (2nd channel or reply thread) is ALWAYS rendered at a
          stable position so it stays mounted — a member-profile layer covers it (below) rather
          than replacing it, and closing that layer reveals it untouched. */}
      {sideChannel ? (
        <SecondChannelPanel channel={sideChannel} />
      ) : (
        <ChannelThreadPanel onOpenMemberDetail={openMemberDetail} thread={replyThread} />
      )}
      {memberProfile && mainChannel && (
        <ChannelMemberDetailOverlay
          channel={mainChannel}
          hasBaseBeneath={!!sideChannel || !!replyThread}
          userId={memberProfile.userId}
        />
      )}
      {/* A ⌘/ctrl-clicked channel opened as a layer covers the secondary slot; its header shows a
          back affordance when a base (reply thread / 2nd channel) sits beneath, else a close — both
          pop the layer, revealing what was underneath. */}
      {layerChannel && (
        <SecondChannelOverlay
          channel={layerChannel}
          hasBaseBeneath={!!sideChannel || !!replyThread}
        />
      )}
      {/* A reply thread opened as a layer (e.g. the replies button inside a 2nd channel that holds
          the slot) covers it; its header close pops the layer to reveal the channel beneath. */}
      {layerThread && <ChannelThreadOverlay thread={layerThread} />}
    </div>
  );
};

export const ChannelsPanels = ({
  iconOnly,
  itemSet,
}: {
  iconOnly?: boolean;
  initialChannelId?: string;
  itemSet?: ChatViewSelectorEntry[];
}) => {
  // The primary channel occupies the main panel; a 2nd channel (ctrl/⌘-click) or the reply
  // thread shares the secondary slot, rendered by ResponsiveChannelPanels.
  const mainChannel = useSlotChannel({ slot: MAIN_CHANNEL_SLOT });
  const mainChannelId = mainChannel?.id;
  const { closeSidebar, sidebarOpen } = useSidebar();
  const channelsLayoutRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!mainChannelId || typeof window === 'undefined') return;
    if (window.innerWidth >= DESKTOP_LAYOUT_BREAKPOINT) return;
    closeSidebar();
  }, [mainChannelId, closeSidebar]);

  useEffect(() => {
    const channelListElement = channelsLayoutRef.current?.querySelector<HTMLElement>(
      '.app-chat-sidebar-overlay > .str-chat__channel-list',
    );
    if (!channelListElement) return;

    channelListElement.id = CHANNEL_LIST_TARGET_ID;
  }, [mainChannelId, sidebarOpen]);

  return (
    <div
      className={clsx('app-chat-view__channels-layout', {
        'app-chat-view__channels-layout--channel-selected': !!mainChannel,
        'app-chat-view__channels-layout--sidebar-collapsed': !sidebarOpen,
      })}
      ref={channelsLayoutRef}
    >
      <ChatSidebar iconOnly={iconOnly} itemSet={itemSet}>
        <WithComponents
          overrides={{
            Avatar: ChannelAvatar,
            ListItem: CustomChannelListItem,
            SearchSourceResultList: SplitAwareSearchResultList,
          }}
        >
          <SwitchableChannelNavigation />
        </WithComponents>
      </ChatSidebar>
      <SidebarResizeHandle layoutRef={channelsLayoutRef} />
      <WithComponents overrides={{ TypingIndicator }}>
        <ResponsiveChannelPanels mainChannel={mainChannel} />
      </WithComponents>
    </div>
  );
};

// Renders the primary open thread, bound to the main thread slot. `ThreadSlot` supplies the
// ThreadProvider + slot context (so the header's close button knows which slot it releases),
// and `useActiveThread` keeps the thread activated/deactivated with window focus.
const ThreadPanel = ({ thread }: { thread: ThreadType }) => {
  const virtualized = useVirtualizedMessageList();
  useActiveThread({ activeThread: thread });

  return (
    <ThreadSlot hideIfEmpty={false} slot={MAIN_THREAD_SLOT}>
      <WithDragAndDropUpload className='str-chat__dropzone-root--thread'>
        <WithComponents overrides={{ TypingIndicator }}>
          <ReturnToSkipNavigation />
          <Thread
            additionalMessageComposerProps={{
              audioRecordingEnabled: true,
              asyncMessagesMultiSendEnabled: true,
            }}
            virtualized={virtualized}
          />
        </WithComponents>
      </WithDragAndDropUpload>
    </ThreadSlot>
  );
};

// The threads view's secondary slot holds a 2nd thread (ctrl/⌘-click a thread in the list)
// opened side-by-side with the primary thread. It occupies the resizable secondary column.
// `ThreadSlot` binds it to OPTIONAL_THREAD_SLOT, which is why its ThreadHeader shows the
// built-in close button (end content) — the same header the channels-view reply thread uses.
const SecondaryThreadPanel = ({ thread }: { thread: ThreadType }) => {
  const virtualized = useVirtualizedMessageList();
  useActiveThread({ activeThread: thread });

  return (
    <ThreadSlot hideIfEmpty={false} slot={OPTIONAL_THREAD_SLOT}>
      <div className='app-chat-secondary-panel app-chat-secondary-panel--open'>
        <WithDragAndDropUpload className='str-chat__dropzone-root--thread'>
          <WithComponents overrides={{ TypingIndicator }}>
            <ReturnToSkipNavigation />
            <Thread
              additionalMessageComposerProps={{
                audioRecordingEnabled: true,
                asyncMessagesMultiSendEnabled: true,
              }}
              virtualized={virtualized}
            />
          </WithComponents>
        </WithDragAndDropUpload>
      </div>
    </ThreadSlot>
  );
};

export const ThreadsPanels = ({
  iconOnly,
  itemSet,
}: {
  iconOnly?: boolean;
  itemSet?: ChatViewSelectorEntry[];
}) => {
  const { sidebarOpen } = useSidebar();
  // The primary thread fills the main column; an optional 2nd thread (ctrl/⌘-click) occupies
  // the resizable secondary column beside it — the same slot machinery the channels view uses.
  const mainThread = useSlotThread({ slot: MAIN_THREAD_SLOT });
  const optionalThread = useSlotThread({ slot: OPTIONAL_THREAD_SLOT });
  const hasThread = !!mainThread || !!optionalThread;
  const isSecondaryOpen = !!optionalThread;
  const threadsLayoutRef = useRef<HTMLDivElement | null>(null);

  return (
    <>
      <ThreadStateSync />
      <div
        className={clsx('app-chat-view__threads-layout', {
          'app-chat-view__threads-layout--thread-selected': hasThread,
          'app-chat-view__threads-layout--sidebar-collapsed': !sidebarOpen,
        })}
        ref={threadsLayoutRef}
      >
        <ChatSidebar iconOnly={iconOnly} itemSet={itemSet}>
          <ThreadList />
        </ChatSidebar>
        <SidebarResizeHandle layoutRef={threadsLayoutRef} />
        <div
          className={clsx('app-chat-view__threads-main', {
            'app-chat-view__threads-main--secondary-open': isSecondaryOpen,
          })}
        >
          {!hasThread ? (
            <div className='str-chat__thread-container str-chat__thread'>
              <EmptyStateIndicator listType='message' />
            </div>
          ) : (
            <>
              {mainThread && <ThreadPanel thread={mainThread} />}
              <ThreadResizeHandle isOpen={isSecondaryOpen} />
              {optionalThread && <SecondaryThreadPanel thread={optionalThread} />}
            </>
          )}
        </div>
      </div>
    </>
  );
};
