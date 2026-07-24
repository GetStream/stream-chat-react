import React, { createContext, useContext } from 'react';

import type { PropsWithChildren } from 'react';
import type {
  LocalMessage,
  Channel as StreamChannel,
  Thread as StreamThread,
} from 'stream-chat';

/**
 * Target for {@link WorkspaceNavigation.openThread}: an existing thread instance, or the channel +
 * parent message from which one is derived.
 */
export type OpenThreadTarget =
  | StreamThread
  | { channel: StreamChannel; message: LocalMessage };

/**
 * A DOM event that may have triggered a workspace navigation. Restricted to the React event types
 * that expose modifier keys (`metaKey`/`ctrlKey`/…) — the reason the event is forwarded at all — so
 * overrides can read them without narrowing. `PointerEvent`, `DragEvent`, and `WheelEvent` extend
 * `MouseEvent` and are accepted through it; `TouchEvent` and `KeyboardEvent` are the other carriers.
 */
export type WorkspaceNavigationTriggerEvent =
  | React.MouseEvent
  | React.KeyboardEvent
  | React.TouchEvent;

/** Options shared by the workspace navigation operations. */
export type WorkspaceNavigationOptions = {
  /**
   * Open *beside* the current content (e.g. ctrl/⌘-click) instead of replacing it, when the active
   * workspace layout has room for a secondary panel. Ignored in single-panel layouts.
   */
  additive?: boolean;
  /**
   * The DOM event that triggered the navigation, when there is one. Forwarded by the SDK components
   * that initiate navigation from a user gesture (channel-list / search-result selection, …) so a
   * consumer overriding these operations (e.g. via `ChatView`'s `deriveWorkspaceNavigation`) can read
   * modifier keys — deciding `additive` from ⌘/ctrl-click — without tracking key state globally.
   */
  event?: WorkspaceNavigationTriggerEvent;
  /**
   * Open *over* the current content as a transient layer instead of replacing it; dismissing the
   * entity restores what was beneath. Ignored by layouts that do not support layering.
   */
  layer?: boolean;
};

/**
 * Slot-agnostic, intent-level navigation abstraction that core components depend on instead of the
 * ChatView slot system (D1). The `slot-layout` plugin implements it over its layout controller; with
 * no plugin installed the default is an inert no-op (D2) — core renders, navigation does nothing.
 */
export type WorkspaceNavigation = {
  /**
   * Dismiss a thread from the workspace. With `threadId`, dismiss that thread's panel; otherwise the
   * active thread panel. Does not deactivate the thread instance — the caller owns that. Accepts the
   * triggering event (see {@link WorkspaceNavigationOptions.event}).
   */
  closeThread: (threadId?: string, options?: WorkspaceNavigationOptions) => void;
  /** Whether a channel with `cid` is currently open in the workspace. */
  isChannelActive: (cid?: string) => boolean;
  /** Whether a thread with `threadId` is currently open in the workspace. */
  isThreadActive: (threadId?: string) => boolean;
  /**
   * Whether the thread panel for `threadId` (or the active thread) can be dismissed by the user —
   * i.e. it is a closable side/secondary panel rather than the primary thread surface.
   */
  isThreadDismissable: (threadId?: string) => boolean;
  /** Whether the thread-list ("threads") workspace view is the active one. */
  isThreadsView: boolean;
  /** Open `channel` in the workspace. */
  openChannel: (channel: StreamChannel, options?: WorkspaceNavigationOptions) => void;
  /** Channels currently open in the workspace (empty when none / no plugin). */
  openChannels: StreamChannel[];
  /** Open a thread — by instance, or derived from `{ channel, message }`. */
  openThread: (target: OpenThreadTarget, options?: WorkspaceNavigationOptions) => void;
  /** Threads currently open in the workspace (empty when none / no plugin). */
  openThreads: StreamThread[];
};

const NOOP_OPEN_CHANNELS: WorkspaceNavigation['openChannels'] = [];
const NOOP_OPEN_THREADS: WorkspaceNavigation['openThreads'] = [];

/** Inert no-op default (D2): used when no `slot-layout` plugin provides an implementation. */
export const defaultWorkspaceNavigation: WorkspaceNavigation = {
  closeThread: () => undefined,
  isChannelActive: () => false,
  isThreadActive: () => false,
  isThreadDismissable: () => false,
  isThreadsView: false,
  openChannel: () => undefined,
  openChannels: NOOP_OPEN_CHANNELS,
  openThread: () => undefined,
  openThreads: NOOP_OPEN_THREADS,
};

const WorkspaceNavigationContext = createContext<WorkspaceNavigation>(
  defaultWorkspaceNavigation,
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
 * Access the workspace navigation abstraction. Returns the inert no-op default outside a
 * `slot-layout` provider, so callers can navigate unconditionally without guarding for a provider.
 */
export const useWorkspaceNavigation = (): WorkspaceNavigation =>
  useContext(WorkspaceNavigationContext);
