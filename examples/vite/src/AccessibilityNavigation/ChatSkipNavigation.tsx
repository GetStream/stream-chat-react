import { useEffect, useMemo, useState } from 'react';
import { SkipNavigation } from 'stream-chat-react';

import {
  CHANNEL_LIST_TARGET_ID,
  CHANNEL_MESSAGE_COMPOSER_TEXTAREA_TARGET_ID,
  CHANNELS_SELECTOR_BUTTON_TARGET_QUERY,
  THREAD_LIST_TARGET_ID,
  THREAD_MESSAGE_COMPOSER_TEXTAREA_TARGET_ID,
} from '../ChatLayout/Panels.tsx';

export const CHAT_SKIP_NAVIGATION_TARGET_ID = 'app-chat-skip-navigation';

// The list skip-link should land on the FIRST item (a focusable role="option" button with a visible
// focus ring), not on the listbox container — focusing a container gives no visual focus cue.
// Returns whether an option was actually focused: an empty/loading list has no `role="option"`, in
// which case the caller must NOT preventDefault, letting SkipNavigation fall back to focusing the
// list container (otherwise the link would be a dead end).
const focusFirstListOption = (listTargetId: string): boolean => {
  const option = document.querySelector<HTMLElement>(`#${listTargetId} [role="option"]`);
  option?.focus();
  return !!option;
};

const isLinkFor = (target: EventTarget | null, targetId: string) =>
  target instanceof HTMLAnchorElement && target.getAttribute('href') === `#${targetId}`;

const isActivationKey = (key: string) =>
  key === 'Enter' || key === ' ' || key === 'Spacebar';

const getSkipNavigationLinkLabel = (targetId: string) => {
  if (
    targetId === CHANNEL_MESSAGE_COMPOSER_TEXTAREA_TARGET_ID ||
    targetId === THREAD_MESSAGE_COMPOSER_TEXTAREA_TARGET_ID
  ) {
    return 'Skip to message composer';
  }
  if (targetId === CHANNEL_LIST_TARGET_ID) {
    return 'Skip to channel list';
  }
  if (targetId === THREAD_LIST_TARGET_ID) {
    return 'Skip to thread list';
  }

  return 'Skip to sidebar';
};

export const ChatSkipNavigation = () => {
  // Skip targets are tagged imperatively onto SDK-owned DOM and depend on the active view (the
  // channel list shows in the channels view, the thread list in the threads view) and the layout, so
  // resolve them from the live DOM and keep them in sync via a MutationObserver. Only links whose
  // target currently exists are rendered, so there are never dead skip links.
  const [composerTargetId, setComposerTargetId] = useState<string | null>(null);
  const [listTargetId, setListTargetId] = useState<string | null>(null);
  const [selectorButtonTargetId, setSelectorButtonTargetId] = useState<string | null>(
    null,
  );

  useEffect(() => {
    const syncTargets = () => {
      // The channel composer (channels view) and the thread composer (threads view) carry different
      // ids; whichever is currently mounted is the composer skip target.
      setComposerTargetId(
        document.getElementById(CHANNEL_MESSAGE_COMPOSER_TEXTAREA_TARGET_ID)
          ? CHANNEL_MESSAGE_COMPOSER_TEXTAREA_TARGET_ID
          : document.getElementById(THREAD_MESSAGE_COMPOSER_TEXTAREA_TARGET_ID)
            ? THREAD_MESSAGE_COMPOSER_TEXTAREA_TARGET_ID
            : null,
      );
      // Exactly one of the two lists is mounted at a time, depending on the active view.
      setListTargetId(
        document.getElementById(THREAD_LIST_TARGET_ID)
          ? THREAD_LIST_TARGET_ID
          : document.getElementById(CHANNEL_LIST_TARGET_ID)
            ? CHANNEL_LIST_TARGET_ID
            : null,
      );
      setSelectorButtonTargetId(
        document.querySelector<HTMLElement>(CHANNELS_SELECTOR_BUTTON_TARGET_QUERY)?.id ??
          null,
      );
    };

    syncTargets();

    const observer = new MutationObserver(syncTargets);
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['id'],
      childList: true,
      subtree: true,
    });

    return () => observer.disconnect();
  }, []);

  // Ordered by keyboard priority: composer, then the active list, then the sidebar selector.
  const targetIds = useMemo(
    () =>
      [composerTargetId, listTargetId, selectorButtonTargetId].filter(
        (id): id is string => !!id,
      ),
    [composerTargetId, listTargetId, selectorButtonTargetId],
  );

  return (
    <nav aria-label='Chat quick navigation' id={CHAT_SKIP_NAVIGATION_TARGET_ID}>
      <SkipNavigation
        getLinkLabel={getSkipNavigationLinkLabel}
        // Intercept the active list link (SkipNavigation's documented `onClick`/`onKeyDown` +
        // `preventDefault` escape hatch) to focus the first item instead of the listbox container.
        // Other links fall through to SkipNavigation's default focus handling.
        onClick={(event) => {
          if (!listTargetId || !isLinkFor(event.currentTarget, listTargetId)) return;
          // Only take over when there is an option to focus; otherwise let SkipNavigation focus the
          // list container so the link is never a dead end.
          if (focusFirstListOption(listTargetId)) event.preventDefault();
        }}
        onKeyDown={(event) => {
          if (
            !listTargetId ||
            !isLinkFor(event.currentTarget, listTargetId) ||
            !isActivationKey(event.key)
          )
            return;
          if (focusFirstListOption(listTargetId)) event.preventDefault();
        }}
        targetIds={targetIds}
      />
    </nav>
  );
};
