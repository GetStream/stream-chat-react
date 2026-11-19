import clsx from 'clsx';
import type {
  ChannelMemberResponse,
  LocalMessage,
  Channel as StreamChannel,
  Thread as ThreadType,
} from 'stream-chat';
import {
  type BaseSyntheticEvent,
  type MouseEvent,
  type PropsWithChildren,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  AIStateIndicator,
  asDynamicKey,
  Channel,
  ChannelAvatar,
  ChannelHeader,
  ChannelInstanceProvider,
  ChannelListItem,
  MessageComposerUI as DefaultMessageComposerUI,
  getRenderTextMentionEntities,
  GlobalModal,
  MessageList,
  type MessageListProps,
  Prompt,
  Thread,
  ThreadHeader,
  ThreadList,
  TypingIndicator,
  useChatContext,
  useComponentContext,
  useTranslationContext,
  VirtualizedMessageList,
  WithComponents,
  WithDragAndDropUpload,
  WorkspacePanelProvider,
} from 'stream-chat-react';
import {
  ChatView,
  ChatViewEmptyPlaceholder,
  type ChatViewSelectorEntry,
  getChatViewEntityBinding,
  ThreadSlot,
  useActiveThread,
  useChatViewNavigation,
  useLayoutViewState,
  useSlotChannel,
  useSlotThread,
  useSlotTopLayerEntity,
} from 'stream-chat-react/slot-layout';
import {
  ChannelDetailProvider,
  ChannelMemberDetail,
} from 'stream-chat-react/channel-detail';

import { useAppSettingsSelector } from '../AppSettings/state';
import { isOwnProfileSource, useOwnUser, UserDetailDialog } from '../UserProfile';
import { ChannelListItemUIWithPresence } from './ChannelListItemPresence';
import {
  ConfiguredAvatarWithChannelDetail,
  ConfiguredChannelDetail,
  isChannelDetailSource,
} from './ConfiguredChannelDetail.tsx';
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
import { HeaderStartWithSidebarToggle } from '../Sidebar/HeaderContent.tsx';
import { SidebarResizeHandle, ThreadResizeHandle } from './Resize.tsx';
import { ReturnToSkipNavigation } from '../AccessibilityNavigation/ReturnToSkipNavigation.tsx';
import { ChannelPreviewOverlay } from '../ChannelPreviewOverlay/ChannelPreviewOverlay.tsx';
import { useSidebar } from './SidebarContext.tsx';
import { SwitchableChannelNavigation } from './SwitchableChannelNavigation.tsx';
import { ConfigurableMessageComposer } from '../ConfigurableMessageComposer';

export const CHANNEL_MESSAGE_COMPOSER_TEXTAREA_TARGET_ID =
  'app-channel-message-composer-textarea';
export const THREAD_MESSAGE_COMPOSER_TEXTAREA_TARGET_ID =
  'app-thread-message-composer-textarea';
export const CHANNEL_LIST_TARGET_ID = 'app-channel-list';
export const THREAD_LIST_TARGET_ID = 'app-thread-list';
export const CHANNELS_SELECTOR_BUTTON_TARGET_QUERY =
  '[id^="str-chat__chat-view-"][id$="-tab-channels"]';

/**
 * The user behind the clicked mention. Enter or Space targets the message text, not a mention, so
 * it identifies a user only when the message's one mention is a user.
 */
const getMentionedUserId = (event: BaseSyntheticEvent, message: LocalMessage) => {
  if (event.type === 'keydown') {
    const [mention, ...otherMentions] = getRenderTextMentionEntities(message);
    if (otherMentions.length || mention?.mentionType !== 'user') return undefined;
    return mention.id;
  }
  return (event.target as HTMLElement).closest<HTMLElement>('[data-user-id]')?.dataset
    .userId;
};

// Whether the app-settings "message list" toggle is set to the virtualized list. Read the same
// way everywhere so every channel and thread honors the setting (not just the primary channel).
const useVirtualizedMessageList = () =>
  useAppSettingsSelector((s) => s.messageList).type === 'virtualized';

// The replies list of a thread panel. `<Thread>` composes nothing itself, so each panel says what
// it wants -- this is the part every panel says identically: honor the app's list-type setting, and
// leave out date separators (the parent message already carries one). Props reach the standard list
// only; the virtualized one drills a narrower set, so anything passed here follows the standard
// list's default when the virtualized list is on.
const ThreadMessageList = (props: MessageListProps) => {
  const virtualized = useVirtualizedMessageList();
  return virtualized ? (
    <VirtualizedMessageList withDateSeparator={false} />
  ) : (
    <MessageList withDateSeparator={false} {...props} />
  );
};

// Tag the list's `[role="listbox"]` with a stable id so the skip-navigation links can target it. The
// listbox unmounts/remounts (search mode, view switches, reloads) and its view may start inactive, so
// observe `document.body` and re-tag whenever it (re)appears. The selector is globally unambiguous —
// only one view's sidebar is mounted at a time.
const useTagSkipNavigationListbox = (listboxSelector: string, targetId: string) => {
  useEffect(() => {
    const tagListbox = () => {
      const listbox = document.querySelector<HTMLElement>(listboxSelector);
      if (listbox && listbox.id !== targetId) {
        listbox.id = targetId;
      }
    };

    tagListbox();
    const observer = new MutationObserver(tagListbox);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [listboxSelector, targetId]);
};

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
    // shows it alone, closing the other panels. `additive` lets the navigation layer pick the
    // secondary slot rather than hard-coding its name here.
    const additive = event.ctrlKey || event.metaKey;
    open(binding, {
      // The SDK base policy binds an additive channel into the secondary slot if free, or stacks
      // a layer if the slot is occupied (e.g. an open reply thread) — no explicit `layer` needed.
      additive,
      exclusive: !additive,
    });
  };
  return <ChannelListItem channel={channel} onSelect={openChannel} />;
};

// The in-channel reply thread is opened into the channels view's secondary slot (the same
// slot a 2nd channel can occupy) — bound by the message "reply in thread" / replies-count
// actions via `open`. It renders only when a thread is bound, and `useActiveThread`
// activates/deactivates it with window focus.
const ChannelThreadPanel = ({
  onOpenMemberDetail,
  thread,
}: {
  // Clicking an avatar/mention in the thread opens the member profile (see `openMemberDetail`).
  onOpenMemberDetail: (userId: string | undefined, event: BaseSyntheticEvent) => void;
  thread?: ThreadType;
}) => {
  const isOpen = !!thread;
  const registerThreadSlot = useRegisterSlotGeometry(CHANNEL_THREAD_SLOT);
  useActiveThread({ activeThread: thread });

  const panelClassName = clsx('app-chat-secondary-panel', {
    'app-chat-secondary-panel--open': isOpen,
  });

  // The resize handle is rendered once at the slot level (see `ResponsiveChannelPanels`), not
  // here — the bar belongs to the slot, which may hold layers, not to this base content.
  return thread ? (
    // The dropzone sits inside <Thread> so WithDragAndDropUpload's `useChannel` resolves the
    // thread's own channel — the thread panel no longer depends on an ambient <Channel>, so it
    // can live in its own slot beside the primary channel. The panel shell stays outside, so the
    // open and closed states present the same box to the layout.
    <div className={panelClassName}>
      <Thread thread={thread}>
        <WithDragAndDropUpload className='str-chat__dropzone-root--thread'>
          <ReturnToSkipNavigation />
          <ThreadHeader />
          <ThreadMessageList
            onMentionsClick={(event, message) =>
              onOpenMemberDetail(getMentionedUserId(event, message), event)
            }
            onUserClick={(event, user) => onOpenMemberDetail(user.id, event)}
          />
          <ConfigurableMessageComposer />
        </WithDragAndDropUpload>
      </Thread>
    </div>
  ) : (
    // Closed state: just the collapsed-width shell (no dropzone, so no channel needed).
    // Registered with the geometry module; the open branch above renders a plain div too, but
    // there the primary channel collapses so `isObscured` still fires.
    <div className={panelClassName} ref={registerThreadSlot} />
  );
};

// The 2nd channel's content: its own <Channel> (a sibling of the primary channel, not nested)
// with header + list + composer inside the dropzone so WithDragAndDropUpload's `useChannel`
// resolves it. Shared by the base side-by-side panel and the layer overlay below. The primary
// channel's header start content (the sidebar toggle) is cleared; the SDK ChannelHeader supplies
// the back and close controls of a channel beside the primary one.
const SecondChannelContent = ({ channel }: { channel: StreamChannel }) => {
  const virtualized = useVirtualizedMessageList();
  return (
    <Channel channel={channel}>
      <WithDragAndDropUpload className='str-chat__dropzone-root--thread'>
        <ChannelHeader Avatar={ConfiguredAvatarWithChannelDetail} />
        <div className='app-chat-view__channel-body'>
          {virtualized ? (
            <VirtualizedMessageList groupByUser returnAllReadData />
          ) : (
            <MessageList returnAllReadData />
          )}
          <ReturnToSkipNavigation />
          <AIStateIndicator />
          <ConfigurableMessageComposer
            additionalTextareaProps={{
              id: CHANNEL_MESSAGE_COMPOSER_TEXTAREA_TARGET_ID,
            }}
            maxRows={10}
            focus
          />
          <ChannelPreviewOverlay />
        </div>
      </WithDragAndDropUpload>
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
const SecondChannelOverlay = ({ channel }: { channel: StreamChannel }) => (
  <SecondarySlotOverlay>
    <SecondChannelContent channel={channel} />
  </SecondarySlotOverlay>
);

// A reply thread shown as a LAYER over the secondary slot — e.g. clicking the replies button inside
// a 2nd channel that occupies the slot. The SDK base policy stacks the thread on top (rather than
// binding it invisibly beneath); here we render that top layer in the shared overlay wrapper.
const ChannelThreadOverlay = ({ thread }: { thread: ThreadType }) => {
  useActiveThread({ activeThread: thread });
  return (
    <SecondarySlotOverlay>
      <Thread thread={thread}>
        {/* The SDK header's back reveals the channel beneath; its close dismisses the whole
            secondary panel. */}
        <ThreadHeader />
        <ThreadMessageList />
        <ConfigurableMessageComposer />
      </Thread>
    </SecondarySlotOverlay>
  );
};

// Whether a click asks to open beside the current content: ⌘ on macOS, ctrl elsewhere.
const isOpenBesideClick = (event: BaseSyntheticEvent) => {
  const nativeEvent = event.nativeEvent as globalThis.MouseEvent | undefined;
  return !!nativeEvent && (nativeEvent.metaKey || nativeEvent.ctrlKey);
};

// The channel member with `userId`: the cached one, or, for a member not loaded yet (a large
// channel, say), the one fetched for it.
const useChannelMember = (channel: StreamChannel, userId: string) => {
  const [member, setMember] = useState<ChannelMemberResponse | undefined>(
    () => channel.state.members[userId],
  );

  useEffect(() => {
    const existing = channel.state.members[userId];
    if (existing) {
      setMember(existing);
      return;
    }
    let cancelled = false;
    channel
      .queryMembers({ payload: { filter_conditions: { id: { $in: [userId] } } } })
      .then((response) => {
        if (!cancelled) setMember(response.members[0]);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [channel, userId]);

  return member;
};

// A member's profile in the secondary slot, opened with a ⌘/ctrl-click on a message avatar or a
// mention in either the primary channel or the reply thread. It renders absolutely over the
// secondary column (`.app-chat-secondary-overlay`), so whatever it covers stays mounted beneath, and
// `close`/back reveal it exactly where it was.
//
// It's the SDK's `userProfile` kind (source `{ userId }`); the member is resolved here from the
// channel it belongs to. `ChannelMemberDetail` is built for the ChannelDetail navigator, so we
// render it inside the `ChannelDetailProvider` it expects: its member actions read the channel from
// it, and its `onClose` closes the profile (the detail header's close button calls it).
const ChannelMemberDetailOverlay = ({
  channel,
  hasContentBeneath,
  userId,
}: {
  channel: StreamChannel;
  /** Whether something sits under the profile in the slot: if so, offer a "back" affordance (both
   *  back and close reveal it). */
  hasContentBeneath: boolean;
  userId: string;
}) => {
  const { close } = useChatViewNavigation();
  const member = useChannelMember(channel, userId);
  const closeOverlay = useCallback(() => close(CHANNEL_THREAD_SLOT), [close]);

  return (
    <SecondarySlotOverlay>
      {member ? (
        <ChannelDetailProvider channel={channel} onClose={closeOverlay}>
          <ChannelMemberDetail
            layout='inline'
            member={member}
            onBack={hasContentBeneath ? closeOverlay : undefined}
          />
        </ChannelDetailProvider>
      ) : null}
    </SecondarySlotOverlay>
  );
};

// A member's profile in a modal, opened with a plain click on a message avatar or a mention.
const ChannelMemberDetailModal = ({
  channel,
  onClose,
  userId,
}: {
  channel: StreamChannel;
  onClose: () => void;
  userId: string;
}) => {
  const { t } = useTranslationContext();
  const { Modal = GlobalModal } = useComponentContext();
  const member = useChannelMember(channel, userId);

  return (
    <Modal
      aria-label={t(asDynamicKey('viteExample.memberDetail.ariaLabel'), 'Member details')}
      dialogRootProps={{ className: 'str-chat__channel-detail-modal' }}
      onClose={onClose}
      open
    >
      {/* The prompt is the modal's surface, styled as the channel details but sized as the user's
          own profile modal. */}
      <Prompt.Root className='str-chat__channel-detail app-member-detail-modal'>
        {member ? (
          <ChannelDetailProvider channel={channel} onClose={onClose}>
            <ChannelMemberDetail layout='tabs' member={member} />
          </ChannelDetailProvider>
        ) : null}
      </Prompt.Root>
    </Modal>
  );
};

// A channel's details in the secondary slot, opened with a ⌘/ctrl-click on the channel header's
// avatar (a plain click opens them in a modal). They are the SDK's `custom` kind, rendered over the
// secondary column like the member profile; closing them reveals what they cover.
const ChannelDetailOverlay = ({ channel }: { channel: StreamChannel }) => {
  const { close } = useChatViewNavigation();
  const closeOverlay = useCallback(() => close(CHANNEL_THREAD_SLOT), [close]);
  // The channel's online status reads the channel from the channel context, which this overlay is
  // outside of.
  const channelContext = useMemo(() => ({ channel }), [channel]);

  return (
    <SecondarySlotOverlay>
      <ChannelInstanceProvider value={channelContext}>
        {/* The secondary column is narrow, so the sections open one at a time. */}
        <ConfiguredChannelDetail
          channel={channel}
          defaultLayout='inline'
          key={channel.cid}
          onClose={closeOverlay}
        />
      </ChannelInstanceProvider>
    </SecondarySlotOverlay>
  );
};

// The user's own profile in the secondary slot, opened with a ⌘/ctrl-click on the sidebar's profile
// button (a plain click opens it in a modal). It's the SDK's `custom` kind, rendered over the
// secondary column like the member profile; closing it reveals what it covers.
const OwnProfileOverlay = () => {
  const { client } = useChatContext();
  const { close } = useChatViewNavigation();
  const [user, setUser] = useOwnUser(client);
  const closeOverlay = useCallback(() => close(CHANNEL_THREAD_SLOT), [close]);

  return (
    <SecondarySlotOverlay>
      {user && (
        <UserDetailDialog onClose={closeOverlay} onUserChange={setUser} user={user} />
      )}
    </SecondarySlotOverlay>
  );
};

// What the secondary slot shows on top, its top layer or else its base, and whether anything sits
// beneath it.
const useSecondarySlotTop = () => {
  const { slotBindings, slotLayers } = useLayoutViewState();
  const base = slotBindings[CHANNEL_THREAD_SLOT];
  const layers = slotLayers?.[CHANNEL_THREAD_SLOT] ?? [];
  return {
    hasContentBeneath: layers.length + (base ? 1 : 0) > 1,
    top: getChatViewEntityBinding(layers.length ? layers[layers.length - 1] : base),
  };
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
  // A member profile or a channel's details can also occupy the secondary slot: as its base when
  // it's empty, or as a layer over a reply thread or a 2nd channel, which stays mounted beneath so
  // closing them returns to it at its exact scroll position. Either shows while it's on top.
  const { hasContentBeneath, top: secondaryTop } = useSecondarySlotTop();
  const memberProfile =
    secondaryTop?.kind === 'userProfile' ? secondaryTop.source : undefined;
  const channelDetail =
    secondaryTop?.kind === 'custom' && isChannelDetailSource(secondaryTop.source)
      ? secondaryTop.source.channel
      : undefined;
  const ownProfile =
    secondaryTop?.kind === 'custom' && isOwnProfileSource(secondaryTop.source);
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
    !!sideChannel ||
    !!replyThread ||
    !!memberProfile ||
    !!channelDetail ||
    ownProfile ||
    !!layerChannel ||
    !!layerThread;
  const virtualized = useVirtualizedMessageList();
  const { close, open } = useChatViewNavigation();
  // A member whose profile is open in a modal.
  const [modalMemberId, setModalMemberId] = useState<string>();

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

  // Opens a member's profile: in a modal on a plain click, in the secondary slot on a ⌘/ctrl-click.
  // There it's the `userProfile` kind, whose `{ userId }` source `ChannelMemberDetailOverlay`
  // resolves back to a channel member.
  const openMemberDetail = useCallback(
    (userId: string | undefined, event: BaseSyntheticEvent) => {
      if (!userId) return;
      if (!isOpenBesideClick(event)) {
        setModalMemberId(userId);
        return;
      }
      open(
        { key: userId, kind: 'userProfile', source: { userId } },
        { slot: CHANNEL_THREAD_SLOT },
      );
    },
    [open],
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
          {/* Each column declares the slot it renders, so its headers' back and close buttons act
              on that slot even when the same channel is open in both. */}
          <WorkspacePanelProvider panel={MAIN_CHANNEL_SLOT}>
            <Channel channel={mainChannel}>
              <WithDragAndDropUpload>
                <ChannelHeader
                  Avatar={ConfiguredAvatarWithChannelDetail}
                  StartContent={HeaderStartWithSidebarToggle}
                />
                <div className='app-chat-view__channel-body'>
                  {virtualized ? (
                    // VirtualizedMessageList drills a narrower prop set and doesn't forward
                    // onUserClick/onMentionsClick — wiring member-detail there would need a custom
                    // Message component. The demo's default list is the standard one below.
                    <VirtualizedMessageList groupByUser returnAllReadData />
                  ) : (
                    <MessageList
                      onMentionsClick={(event, message) =>
                        openMemberDetail(getMentionedUserId(event, message), event)
                      }
                      onUserClick={(event, user) => openMemberDetail(user.id, event)}
                      returnAllReadData
                    />
                  )}
                  <ReturnToSkipNavigation />
                  <AIStateIndicator />
                  <ConfigurableMessageComposer
                    additionalTextareaProps={{
                      id: CHANNEL_MESSAGE_COMPOSER_TEXTAREA_TARGET_ID,
                    }}
                    maxRows={10}
                  />
                  <ChannelPreviewOverlay />
                </div>
              </WithDragAndDropUpload>
            </Channel>
          </WorkspacePanelProvider>
        </div>
      )}
      {/* The resize handle belongs to the SLOT, not its contents: it's rendered once here and
          driven by whether the slot is open (base binding OR a layer such as the member profile),
          so a layer that covers the base — or is the only occupant — stays resizable. */}
      {!mainChannel && !isSideOpen && (
        <div className='app-chat-view__channel-main'>
          <ChatViewEmptyPlaceholder />
        </div>
      )}
      <ThreadResizeHandle isOpen={isSideOpen} />
      {/* The base of the secondary slot (2nd channel or reply thread) is ALWAYS rendered at a
          stable position so it stays mounted — a member-profile layer covers it (below) rather
          than replacing it, and closing that layer reveals it untouched. */}
      <WorkspacePanelProvider panel={CHANNEL_THREAD_SLOT}>
        {sideChannel ? (
          <SecondChannelPanel channel={sideChannel} />
        ) : (
          <ChannelThreadPanel
            onOpenMemberDetail={openMemberDetail}
            thread={replyThread}
          />
        )}
        {memberProfile && mainChannel && (
          <ChannelMemberDetailOverlay
            channel={mainChannel}
            hasContentBeneath={hasContentBeneath}
            userId={memberProfile.userId}
          />
        )}
        {channelDetail && <ChannelDetailOverlay channel={channelDetail} />}
        {ownProfile && <OwnProfileOverlay />}
        {/* A ⌘/ctrl-clicked channel opened as a layer covers the secondary slot; its header's back
          reveals what is beneath, its close dismisses the whole secondary panel. */}
        {layerChannel && <SecondChannelOverlay channel={layerChannel} />}
        {/* A reply thread opened as a layer (e.g. the replies button inside a 2nd channel that holds
          the slot) covers it; its header's back reveals the channel beneath. */}
        {layerThread && <ChannelThreadOverlay thread={layerThread} />}
      </WorkspacePanelProvider>
      {modalMemberId && mainChannel && (
        <ChannelMemberDetailModal
          channel={mainChannel}
          onClose={() => setModalMemberId(undefined)}
          userId={modalMemberId}
        />
      )}
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

  useTagSkipNavigationListbox(
    '.app-chat-sidebar-overlay .str-chat__channel-list [role="listbox"]',
    CHANNEL_LIST_TARGET_ID,
  );

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
            ChannelListItemUI: ChannelListItemUIWithPresence,
            ListItem: CustomChannelListItem,
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

// Renders the "Back to quick navigation" return link above the thread's composer (the SDK renders
// the thread composer internally, so we inject via the MessageComposerUI slot) — matching the
// channel view, where the link sits right above <MessageComposer />.
const ThreadMessageComposerUI = () => (
  <>
    <ReturnToSkipNavigation />
    <DefaultMessageComposerUI />
  </>
);

// Renders the primary open thread, bound to the main thread slot. `ThreadSlot` resolves the bound
// thread, hands it to `<Thread>` and supplies the slot context (so the header's close button knows
// which slot it releases); `useActiveThread` keeps the thread activated with window focus.
const ThreadPanel = ({ thread }: { thread: ThreadType }) => {
  useActiveThread({ activeThread: thread });

  return (
    <ThreadSlot hideIfEmpty={false} slot={MAIN_THREAD_SLOT}>
      <WithDragAndDropUpload className='str-chat__dropzone-root--thread'>
        <WithComponents
          overrides={{
            MessageComposerUI: ThreadMessageComposerUI,
            TypingIndicator,
          }}
        >
          <ThreadHeader StartContent={HeaderStartWithSidebarToggle} />
          <ThreadMessageList />
          <ConfigurableMessageComposer
            additionalTextareaProps={{
              id: THREAD_MESSAGE_COMPOSER_TEXTAREA_TARGET_ID,
            }}
            // Auto-focus the thread composer on mount, matching the channels-view composer.
            focus
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
  useActiveThread({ activeThread: thread });

  return (
    // The panel shell wraps the slot: `ThreadSlot` renders `<Thread>` as its outermost element,
    // and the sizing rules need this box to be a direct child of the threads-main column.
    <div className='app-chat-secondary-panel app-chat-secondary-panel--open'>
      <ThreadSlot hideIfEmpty={false} slot={OPTIONAL_THREAD_SLOT}>
        <WithDragAndDropUpload className='str-chat__dropzone-root--thread'>
          <WithComponents
            overrides={{
              MessageComposerUI: ThreadMessageComposerUI,
              TypingIndicator,
            }}
          >
            <ThreadHeader StartContent={HeaderStartWithSidebarToggle} />
            <ThreadMessageList />
            <ConfigurableMessageComposer />
          </WithComponents>
        </WithDragAndDropUpload>
      </ThreadSlot>
    </div>
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

  useTagSkipNavigationListbox(
    '.app-chat-sidebar-overlay .str-chat__thread-list',
    THREAD_LIST_TARGET_ID,
  );

  return (
    <>
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
            <ChatViewEmptyPlaceholder />
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
