import React, { createContext, useContext } from 'react';

import type { PropsWithChildren } from 'react';
import type {
  LocalMessage,
  Channel as StreamChannel,
  Thread as StreamThread,
} from 'stream-chat';

/**
 * Target for {@link WorkspaceNavigation.openThread}: a thread instance, or the channel and parent
 * message the thread is derived from.
 */
export type OpenThreadTarget =
  | StreamThread
  | { channel: StreamChannel; message: LocalMessage };

/**
 * A DOM event that may have triggered a workspace navigation. Limited to the React event types that
 * expose modifier keys (`metaKey`, `ctrlKey`, ...), so overrides can read them without narrowing.
 */
export type WorkspaceNavigationTriggerEvent =
  | React.MouseEvent
  | React.KeyboardEvent
  | React.TouchEvent;

/** Identifies a panel of the workspace layout (for the slot layout, a slot name). */
export type WorkspacePanelId = string;

const WorkspacePanelContext = createContext<WorkspacePanelId | undefined>(undefined);

/**
 * Declares the panel its subtree renders in, so controls inside (e.g. a header's back and close
 * buttons) act on their own panel even when the same channel or thread is open in more than one.
 */
export const WorkspacePanelProvider = ({
  children,
  panel,
}: PropsWithChildren<{ panel?: WorkspacePanelId }>) => (
  <WorkspacePanelContext.Provider value={panel}>
    {children}
  </WorkspacePanelContext.Provider>
);

/** The panel the calling component renders in, or `undefined` outside one. */
export const useWorkspacePanel = (): WorkspacePanelId | undefined =>
  useContext(WorkspacePanelContext);

/** Options shared by the workspace navigation operations. */
export type WorkspaceNavigationOptions = {
  /**
   * Open beside the current content (e.g. on ctrl/⌘-click) instead of replacing it, when the layout
   * has room for a secondary panel. Ignored in single-panel layouts.
   */
  additive?: boolean;
  /**
   * The DOM event that triggered the navigation, if any. SDK components forward it from user
   * gestures (e.g. channel list and search result selection) so an override, e.g. through
   * `ChatView`'s `deriveWorkspaceNavigation`, can read modifier keys to decide `additive`.
   */
  event?: WorkspaceNavigationTriggerEvent;
  /**
   * Open over the current content as a transient layer instead of replacing it; dismissing the
   * entity restores what was beneath. Ignored by layouts that do not support layering.
   */
  layer?: boolean;
  /**
   * The panel the operation is triggered from (see {@link WorkspacePanelProvider}). Picks the panel
   * when the same channel or thread is open in more than one; without it, the first panel showing
   * the entity is used.
   */
  panel?: WorkspacePanelId;
};

/**
 * Slot-agnostic, intent-level navigation that core components use instead of the ChatView slot
 * system. The `slot-layout` plugin implements it; without a provider, navigation does nothing.
 */
export type WorkspaceNavigation = {
  /**
   * Whether the panel showing the channel or thread with `key` (a channel's `cid`, a thread's ID)
   * is stacked over other content that {@link WorkspaceNavigation.goBack} would reveal.
   */
  canGoBack: (key?: string, panel?: WorkspacePanelId) => boolean;
  /**
   * Dismiss the channel with `cid` from the workspace. A panel opened beside the main one closes
   * whole, with anything stacked in it; the main panel only steps back one layer.
   */
  closeChannel: (cid?: string, options?: WorkspaceNavigationOptions) => void;
  /**
   * Dismiss a thread from the workspace: the panel of `threadId`, or the active thread panel when
   * omitted. Panels close as in {@link WorkspaceNavigation.closeChannel}. Does not deactivate the
   * thread instance; the caller owns that.
   */
  closeThread: (threadId?: string, options?: WorkspaceNavigationOptions) => void;
  /**
   * Step back from the channel or thread with `key`, revealing what it is stacked over. Does
   * nothing when {@link WorkspaceNavigation.canGoBack} is false.
   */
  goBack: (key?: string, options?: WorkspaceNavigationOptions) => void;
  /**
   * Whether the channel with `cid` is shown in the workspace: open in a panel and not covered by
   * something stacked over it there.
   */
  isChannelActive: (cid?: string) => boolean;
  /**
   * Whether the channel panel for `cid` can be dismissed by the user: it is a secondary panel
   * opened beside another channel, not the primary channel surface.
   */
  isChannelDismissable: (cid?: string, panel?: WorkspacePanelId) => boolean;
  /**
   * Whether the thread with `threadId` is shown in the workspace: open in a panel and not covered
   * by something stacked over it there.
   */
  isThreadActive: (threadId?: string) => boolean;
  /**
   * Whether the thread panel for `threadId` (or the active thread) can be dismissed by the user:
   * it is a side or secondary panel, not the primary thread surface.
   */
  isThreadDismissable: (threadId?: string, panel?: WorkspacePanelId) => boolean;
  /** Whether the threads view is the active workspace view. */
  isThreadsView: boolean;
  /** Open `channel` in the workspace. */
  openChannel: (channel: StreamChannel, options?: WorkspaceNavigationOptions) => void;
  /** Channels open in the workspace. */
  openChannels: StreamChannel[];
  /** Open a thread, given as an instance or as `{ channel, message }`. */
  openThread: (target: OpenThreadTarget, options?: WorkspaceNavigationOptions) => void;
  /** Threads open in the workspace. */
  openThreads: StreamThread[];
};

const NOOP_OPEN_CHANNELS: WorkspaceNavigation['openChannels'] = [];
const NOOP_OPEN_THREADS: WorkspaceNavigation['openThreads'] = [];

/** Inert navigation: every operation does nothing and no channels or threads are open. */
export const defaultWorkspaceNavigation: WorkspaceNavigation = {
  canGoBack: () => false,
  closeChannel: () => undefined,
  closeThread: () => undefined,
  goBack: () => undefined,
  isChannelActive: () => false,
  isChannelDismissable: () => false,
  isThreadActive: () => false,
  isThreadDismissable: () => false,
  isThreadsView: false,
  openChannel: () => undefined,
  openChannels: NOOP_OPEN_CHANNELS,
  openThread: () => undefined,
  openThreads: NOOP_OPEN_THREADS,
};

type WorkspaceNavigationAction =
  | 'closeChannel'
  | 'closeThread'
  | 'goBack'
  | 'openChannel'
  | 'openThread';

const warnedUnprovidedActions = new Set<WorkspaceNavigationAction>();

const warnUnprovided = (action: WorkspaceNavigationAction) => {
  if (warnedUnprovidedActions.has(action)) return;
  warnedUnprovidedActions.add(action);
  console.warn(
    `stream-chat-react: WorkspaceNavigation.${action}() did nothing because no workspace navigation is provided. ` +
      'Render the component inside ChatView (stream-chat-react/slot-layout), or provide your own navigation with WorkspaceNavigationProvider.',
  );
};

// The context default: `defaultWorkspaceNavigation` with operations that warn once each, since a
// click that silently does nothing is hard to trace to a missing `ChatView`. The exported default
// stays silent because integrators spread it into their own provider value.
const unprovidedWorkspaceNavigation: WorkspaceNavigation = {
  ...defaultWorkspaceNavigation,
  closeChannel: () => warnUnprovided('closeChannel'),
  closeThread: () => warnUnprovided('closeThread'),
  goBack: () => warnUnprovided('goBack'),
  openChannel: () => warnUnprovided('openChannel'),
  openThread: () => warnUnprovided('openThread'),
};

const WorkspaceNavigationContext = createContext<WorkspaceNavigation>(
  unprovidedWorkspaceNavigation,
);

export const WorkspaceNavigationProvider = ({
  children,
  value,
}: PropsWithChildren<{ value: WorkspaceNavigation }>) => (
  <WorkspaceNavigationContext.Provider value={value}>
    {children}
  </WorkspaceNavigationContext.Provider>
);

/**
 * Returns the workspace navigation. Outside a provider the navigation actions do nothing and each
 * logs a console warning once, so callers can navigate without guarding for a provider.
 */
export const useWorkspaceNavigation = (): WorkspaceNavigation =>
  useContext(WorkspaceNavigationContext);
