import React, { useCallback, useEffect, useRef } from 'react';

import { useAriaLiveOutletContext } from './AriaLiveOutletContext';
import { Portal } from '../Portal/Portal';
import { VisuallyHidden } from '../VisuallyHidden';

export type AriaLiveOutletProps = {
  /**
   * Stacking layer. The {@link AriaLiveAnnouncerProvider} renders into the highest-layer
   * outlet (ties resolve to the most recently registered). Outlets inside an `aria-modal`
   * subtree must use a layer above the root outlet so announcements land inside the modal
   * (assistive technologies suppress live regions outside the active modal). Defaults to `0`.
   */
  layer?: number;
  /**
   * When true, render the live region into a `document.body` portal instead of in place.
   * Use for the root outlet; modal outlets must render in place (omit) so they stay inside
   * the `aria-modal` subtree.
   */
  portal?: boolean;
};

/**
 * Dumb render target for the unified announcer. Registers itself with the nearest
 * {@link AriaLiveAnnouncerProvider} and renders the polite/assertive live regions ONLY when
 * it is the active (innermost) outlet, so exactly one region is live at a time — always in
 * the active accessibility-tree scope. Mount one at the `Chat` root and one inside each
 * `aria-modal` dialog (with a higher `layer`).
 */
export const AriaLiveOutlet = ({ layer = 0, portal = false }: AriaLiveOutletProps) => {
  const context = useAriaLiveOutletContext();

  const idRef = useRef<symbol | null>(null);
  if (idRef.current === null) {
    idRef.current = Symbol('aria-live-outlet');
  }

  const registerOutlet = context?.registerOutlet;
  const unregisterOutlet = context?.unregisterOutlet;

  useEffect(() => {
    const id = idRef.current;
    if (!id || !registerOutlet || !unregisterOutlet) return;

    registerOutlet(id, layer);
    return () => unregisterOutlet(id);
  }, [layer, registerOutlet, unregisterOutlet]);

  const getPortalDestination = useCallback(() => document.body, []);

  if (!context || context.activeOutletId !== idRef.current) return null;

  const { announcementsByPriority } = context;

  const liveRegions = (
    <VisuallyHidden>
      <div
        aria-atomic='false'
        aria-live='polite'
        aria-relevant='additions'
        data-testid='str-chat__aria-live-region--polite'
        role='status'
      >
        {announcementsByPriority.polite.map((announcement) => (
          <div key={announcement.id}>{announcement.message}</div>
        ))}
      </div>
      <div
        aria-atomic='false'
        aria-live='assertive'
        aria-relevant='additions'
        data-testid='str-chat__aria-live-region--assertive'
        role='alert'
      >
        {announcementsByPriority.assertive.map((announcement) => (
          <div key={announcement.id}>{announcement.message}</div>
        ))}
      </div>
    </VisuallyHidden>
  );

  if (!portal) return liveRegions;

  return (
    <Portal getPortalDestination={getPortalDestination} isOpen>
      {liveRegions}
    </Portal>
  );
};
