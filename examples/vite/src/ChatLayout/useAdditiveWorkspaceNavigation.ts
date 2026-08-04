import { useCallback } from 'react';
import type { DeriveWorkspaceNavigation } from 'stream-chat-react/slot-layout';
import type { WorkspaceNavigationOptions } from 'stream-chat-react';

// ⌘/ctrl held during the triggering event → open beside the current content (secondary slot).
const isAdditive = (event: WorkspaceNavigationOptions['event']) =>
  !!event && (event.metaKey || event.ctrlKey);

/**
 * Returns a stable `deriveWorkspaceNavigation` for `<ChatView>` that makes `openChannel`/`openThread`
 * open *beside* the current content on ⌘/ctrl-click — this app's "open in the secondary slot" UX.
 *
 * Why here (and not in the search item's `onSelect`): overriding `onSelect` replaces the SDK's whole
 * default select handler, which also ingests the channel into the paginator (so it shows up in the
 * list even when it's on an unloaded page). Customizing what *opening* means via the navigation
 * adapter keeps that default — including the ingest — intact.
 *
 * The SDK forwards the triggering DOM event on `options.event`, so we read the modifier straight off
 * it — no global key-state tracking. An explicitly-passed `additive` still wins.
 */
export const useAdditiveWorkspaceNavigation = (): DeriveWorkspaceNavigation =>
  useCallback(
    (base) => ({
      ...base,
      openChannel: (channel, options) =>
        base.openChannel(channel, {
          ...options,
          additive: options?.additive ?? isAdditive(options?.event),
        }),
      openThread: (target, options) =>
        base.openThread(target, {
          ...options,
          additive: options?.additive ?? isAdditive(options?.event),
        }),
    }),
    [],
  );
