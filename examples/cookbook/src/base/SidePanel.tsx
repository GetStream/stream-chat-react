import { createContext, useCallback, useContext, useEffect, useId, useRef } from 'react';
import type { ComponentType, PropsWithChildren, ReactNode, RefObject } from 'react';
import { Button, useComponentContextIcons } from 'stream-chat-react';
import {
  getLayoutViewState,
  useChatViewContext,
  useChatViewNavigation,
  useSlotEntity,
} from 'stream-chat-react/slot-layout';

/** The side panel's slot in the channels layout, after the channel and the thread. */
export const SIDE_PANEL_SLOT = 'sidePanel';

/** What a recipe opens in the side panel. */
export type SidePanelContent = {
  /** Names what the panel shows, so a button can tell whether its own content is the open one. */
  id: string;
  /** The heading of the panel's title row, and the panel's name for assistive technology. */
  title: string;
  /**
   * The body renders its own title row and close button, as the SDK's `ChannelDetail` does, so the
   * panel leaves its own out and `title` only names it.
   */
  ownHeader?: boolean;
  /** Everything under the title row. It reads its data itself, so it stays current. */
  body: ReactNode;
};

type SidePanelState = {
  /** The element that had focus when the panel opened, to give it back when the panel closes. */
  openerRef: RefObject<HTMLElement | null>;
  /** The panel's `aside` while it's on screen. */
  panelRef: RefObject<HTMLElement | null>;
};

const SidePanelStateContext = createContext<SidePanelState>({
  openerRef: { current: null },
  panelRef: { current: null },
});

/**
 * Holds what the side panel needs to move focus, for the buttons that open it and the panel to
 * share. What the panel shows is held by the layout, in the panel's slot.
 */
export const SidePanelProvider = ({ children }: PropsWithChildren) => {
  const openerRef = useRef<HTMLElement | null>(null);
  const panelRef = useRef<HTMLElement | null>(null);
  const value = useRef<SidePanelState>({ openerRef, panelRef }).current;

  return (
    <SidePanelStateContext.Provider value={value}>
      {children}
    </SidePanelStateContext.Provider>
  );
};

/** The `id` the panel gives a user's profile, so a button can tell whether that profile is open. */
const userProfileId = (userId: string) => `user-profile:${userId}`;

/** Matches base.css: below 768px the panel covers the channels view. */
const COVERS_CHANNELS_QUERY = '(max-width: 767px)';

/** Makes everything beside the panel inert, or interactive again, so focus stays in the panel. */
const setCoveredInert = (
  container: HTMLElement | null | undefined,
  panel: HTMLElement | null,
  inert: boolean,
) => {
  for (const sibling of container?.children ?? []) {
    if (sibling !== panel && sibling instanceof HTMLElement) sibling.inert = inert;
  }
};

/**
 * Where focus goes when the panel closes: the element that opened it, or, when that one is gone
 * (an item of a menu that has closed, say), the open channel's composer.
 */
const focusTargetAfterClose = (opener: HTMLElement | null) =>
  opener?.isConnected
    ? opener
    : document.querySelector<HTMLElement>(
        '.str-chat__channel .str-chat__textarea textarea',
      );

/**
 * What the panel's slot holds: a recipe's content, bound as the SDK's `custom` kind, or a user's
 * profile, bound as its `userProfile` kind.
 */
const useSidePanelSlot = () => {
  const custom = useSlotEntity({ kind: 'custom', slot: SIDE_PANEL_SLOT });
  const profile = useSlotEntity({ kind: 'userProfile', slot: SIDE_PANEL_SLOT });
  // The panel binds only `SidePanelContent` as `custom` content.
  return { content: custom as SidePanelContent | undefined, profile };
};

/**
 * Opens and closes the side panel. It shows one thing at a time: opening anything replaces what it
 * showed. Everything it shows is bound in the panel's slot, so the layout closes it with the other
 * panels, for example when a channel is picked from the list. Use it inside `ChatView`.
 *
 * Opening remembers the element that had focus; closing from inside the panel gives focus back to
 * it.
 */
export const useSidePanel = () => {
  const { openerRef, panelRef } = useContext(SidePanelStateContext);
  const { layoutController } = useChatViewContext();
  const { open, release } = useChatViewNavigation();
  const { content, profile } = useSidePanelSlot();

  // Focus inside the panel means it moved there from the opener, which stays the one to go back to.
  // Focus on the page itself, after a click on something that can't take focus, names no opener.
  const rememberOpener = useCallback(() => {
    const active = document.activeElement;
    if (panelRef.current?.contains(active)) return;
    openerRef.current =
      active instanceof HTMLElement && active !== document.body ? active : null;
  }, [openerRef, panelRef]);

  // Binds `binding` as the only content of the panel's slot. A view without the panel, such as a
  // threads view, would put it in one of its own slots instead, so it opens nothing there.
  const showInPanel = useCallback(
    (binding: Parameters<typeof open>[0]) => {
      const { availableSlots, slotNames } = getLayoutViewState(
        layoutController.state.getLatestValue(),
      );
      if (!(slotNames ?? availableSlots).includes(SIDE_PANEL_SLOT)) return;
      rememberOpener();
      // Empties the slot first, so the new content replaces what it showed rather than stacking.
      release(SIDE_PANEL_SLOT);
      open(binding, { slot: SIDE_PANEL_SLOT });
    },
    [layoutController, open, release, rememberOpener],
  );

  /** Shows `next` in the side panel, in place of whatever it showed. */
  const openSidePanel = useCallback(
    (next: SidePanelContent) =>
      showInPanel({ key: next.id, kind: 'custom', source: next }),
    [showInPanel],
  );

  /** Shows the user's profile in the side panel, in place of whatever it showed. */
  const openUserProfile = useCallback(
    (userId: string) =>
      showInPanel({ key: userId, kind: 'userProfile', source: { userId } }),
    [showInPanel],
  );

  /**
   * Empties the side panel. Focus that was inside it goes back to what opened it. Focus on the page
   * body counts as inside too: some browsers leave it there after a click on a button, so a panel
   * that closes on its own can move focus to the channel's composer.
   */
  const closeSidePanel = useCallback(() => {
    const active = document.activeElement;
    const hadFocus =
      active === document.body || !!(active && panelRef.current?.contains(active));
    // The opener sits beside the panel, which on a phone is inert until the panel unmounts.
    setCoveredInert(panelRef.current?.parentElement, panelRef.current, false);
    release(SIDE_PANEL_SLOT);
    if (hadFocus) focusTargetAfterClose(openerRef.current)?.focus();
    openerRef.current = null;
  }, [openerRef, panelRef, release]);

  /** The id of what the panel shows, or `undefined` while it's closed. */
  const openId = content?.id ?? (profile ? userProfileId(profile.userId) : undefined);

  return { closeSidePanel, openId, openSidePanel, openUserProfile };
};

export type SidePanelProps = {
  /** Renders a user's profile under the title row. Without it, the panel never shows a profile. */
  UserProfile?: ComponentType<{ userId: string }>;
};

/**
 * The column at the far right of the channels view, after the channel and the thread, while its
 * slot holds something to show: a title row with a close button, then the body. Render it as the
 * view's last child.
 */
export const SidePanel = ({ UserProfile }: SidePanelProps) => {
  const { content, profile } = useSidePanelSlot();

  const shown: SidePanelContent | undefined =
    content ??
    (profile && UserProfile
      ? {
          body: <UserProfile userId={profile.userId} />,
          id: userProfileId(profile.userId),
          title: 'Profile',
        }
      : undefined);

  if (!shown) return null;
  // Keyed by what it shows, so other content starts afresh.
  return <SidePanelFrame key={shown.id} {...shown} />;
};

/**
 * The panel around one piece of content: an `aside` named by the title, the title row with its
 * close button (left out when the body brings its own), then the body. It takes focus when it
 * opens: the title, or the whole panel when the body has its own title row.
 */
const SidePanelFrame = ({ body, ownHeader, title }: SidePanelContent) => {
  const { IconXmark } = useComponentContextIcons();
  const { panelRef } = useContext(SidePanelStateContext);
  const { closeSidePanel } = useSidePanel();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const titleId = useId();

  useEffect(() => {
    (ownHeader ? panelRef.current : headingRef.current)?.focus();
  }, [ownHeader, panelRef]);

  // While the panel covers the channel and the thread, keyboard focus can't reach them, including
  // a channel or thread that opens beside it later.
  useEffect(() => {
    const panel = panelRef.current;
    // Kept from the start: the cleanup can run after the panel has left the page.
    const container = panel?.parentElement;
    const coversChannels = window.matchMedia(COVERS_CHANNELS_QUERY);
    const update = () => setCoveredInert(container, panel, coversChannels.matches);
    // When the window narrows until the panel covers the channel, focus left beside it would sit
    // in inert content, so it moves into the panel, as on open. Focus already inside stays.
    const onCoverChange = () => {
      update();
      if (coversChannels.matches && !panel?.contains(document.activeElement)) {
        (ownHeader ? panel : headingRef.current)?.focus();
      }
    };
    const siblingsObserver = new MutationObserver(update);
    update();
    coversChannels.addEventListener('change', onCoverChange);
    if (container) siblingsObserver.observe(container, { childList: true });
    return () => {
      coversChannels.removeEventListener('change', onCoverChange);
      siblingsObserver.disconnect();
      setCoveredInert(container, panel, false);
    };
  }, [ownHeader, panelRef]);

  return (
    <aside
      aria-label={ownHeader ? title : undefined}
      aria-labelledby={ownHeader ? undefined : titleId}
      className='cookbook-side-panel'
      id='cookbook-side-panel'
      ref={panelRef}
      tabIndex={ownHeader ? -1 : undefined}
    >
      {!ownHeader && (
        <header className='cookbook-side-panel__header'>
          <h2
            className='cookbook-side-panel__title'
            id={titleId}
            ref={headingRef}
            tabIndex={-1}
          >
            {title}
          </h2>
          <Button
            appearance='ghost'
            aria-label={`Close ${title}`}
            circular
            onClick={closeSidePanel}
            size='md'
            variant='secondary'
          >
            <IconXmark />
          </Button>
        </header>
      )}
      <div className='cookbook-side-panel__body'>{body}</div>
    </aside>
  );
};
