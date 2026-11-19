import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { ComponentType, PropsWithChildren, ReactNode, RefObject } from 'react';
import { Button, useComponentContextIcons } from 'stream-chat-react';
import { useChatViewNavigation, useSlotEntity } from 'stream-chat-react/slot-layout';

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
  content?: SidePanelContent;
  /** The element that had focus when the panel opened, to give it back when the panel closes. */
  openerRef: RefObject<HTMLElement | null>;
  /** The panel's `aside` while it's on screen. */
  panelRef: RefObject<HTMLElement | null>;
  setContent: (content?: SidePanelContent) => void;
};

const SidePanelStateContext = createContext<SidePanelState>({
  openerRef: { current: null },
  panelRef: { current: null },
  setContent: () => undefined,
});

/** Holds the content the side panel shows, for the buttons that open it and the panel to share. */
export const SidePanelProvider = ({ children }: PropsWithChildren) => {
  const [content, setContent] = useState<SidePanelContent>();
  const openerRef = useRef<HTMLElement | null>(null);
  const panelRef = useRef<HTMLElement | null>(null);
  const value = useMemo(() => ({ content, openerRef, panelRef, setContent }), [content]);

  return (
    <SidePanelStateContext.Provider value={value}>
      {children}
    </SidePanelStateContext.Provider>
  );
};

/** The `id` the panel gives a user's profile, so a button can tell whether that profile is open. */
const userProfileId = (userId: string) => `user-profile:${userId}`;

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
 * Opens and closes the side panel. It shows one thing at a time: opening anything replaces what it
 * showed. A user's profile is the SDK's `userProfile` kind, bound in the panel's slot; everything
 * else is content held by `SidePanelProvider`. Use it inside `ChatView`.
 *
 * Opening remembers the element that had focus; closing from inside the panel gives focus back to
 * it.
 */
export const useSidePanel = () => {
  const { content, openerRef, panelRef, setContent } = useContext(SidePanelStateContext);
  const { open, release } = useChatViewNavigation();
  const profile = useSlotEntity({ kind: 'userProfile', slot: SIDE_PANEL_SLOT });

  // Focus inside the panel means it moved there from the opener, which stays the one to go back to.
  // Focus on the page itself, after a click on something that can't take focus, names no opener.
  const rememberOpener = useCallback(() => {
    const active = document.activeElement;
    if (panelRef.current?.contains(active)) return;
    openerRef.current =
      active instanceof HTMLElement && active !== document.body ? active : null;
  }, [openerRef, panelRef]);

  /** Shows `next` in the side panel, in place of whatever it showed. */
  const openSidePanel = useCallback(
    (next: SidePanelContent) => {
      rememberOpener();
      // Empties the slot of any profile and every layer on it.
      release(SIDE_PANEL_SLOT);
      setContent(next);
    },
    [release, rememberOpener, setContent],
  );

  /** Shows the user's profile in the side panel, in place of whatever it showed. */
  const openUserProfile = useCallback(
    (userId: string) => {
      rememberOpener();
      setContent(undefined);
      open(
        { key: userId, kind: 'userProfile', source: { userId } },
        { slot: SIDE_PANEL_SLOT },
      );
    },
    [open, rememberOpener, setContent],
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
    release(SIDE_PANEL_SLOT);
    setContent(undefined);
    if (hadFocus) focusTargetAfterClose(openerRef.current)?.focus();
    openerRef.current = null;
  }, [openerRef, panelRef, release, setContent]);

  /** The id of what the panel shows, or `undefined` while it's closed. */
  const openId = content?.id ?? (profile ? userProfileId(profile.userId) : undefined);

  return { closeSidePanel, openId, openSidePanel, openUserProfile };
};

export type SidePanelProps = {
  /** Renders a user's profile under the title row. Without it, the panel never shows a profile. */
  UserProfile?: ComponentType<{ userId: string }>;
};

/**
 * The column at the far right of the channels view, after the channel and the thread, while it has
 * something to show: a title row with a close button, then the body. Render it as the view's last
 * child.
 */
export const SidePanel = ({ UserProfile }: SidePanelProps) => {
  const { content } = useContext(SidePanelStateContext);
  const profile = useSlotEntity({ kind: 'userProfile', slot: SIDE_PANEL_SLOT });

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
