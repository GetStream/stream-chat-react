import React, { useCallback, useEffect, useRef } from 'react';

import { useAriaLiveOutletContext } from './AriaLiveOutletContext';
import { Portal } from '../Portal/Portal';
import { VisuallyHidden } from '../VisuallyHidden';

export type AriaLiveOutletProps = {
  /**
   * Stacking layer: the highest-layer outlet renders the live regions, ties go to the most recently
   * registered. An outlet inside an `aria-modal` subtree needs a layer above the root outlet,
   * because assistive technology ignores live regions outside the active modal. Defaults to `0`.
   */
  layer?: number;
  /**
   * Renders the live regions into a `document.body` portal instead of in place. Meant for the root
   * outlet; modal outlets render in place to stay inside the `aria-modal` subtree. Defaults to
   * `false`.
   */
  portal?: boolean;
};

/**
 * Registers with the nearest {@link AriaLiveAnnouncerProvider} and renders the polite and assertive
 * live regions only while it is the active (highest-layer) outlet. `Chat` mounts the root one; each
 * `aria-modal` dialog needs its own with a higher `layer`.
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
