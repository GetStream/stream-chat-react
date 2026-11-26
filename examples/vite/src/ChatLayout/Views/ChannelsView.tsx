import clsx from 'clsx';
import { useEffect, useRef } from 'react';
import { ChannelAvatar, WithComponents } from 'stream-chat-react';
import {
  type ChatViewSelectorEntry,
  useChatViewNavigation,
  useSlotChannel,
  WorkspaceLayout,
} from 'stream-chat-react/slot-layout';
import {
  resolveRevealAction,
  useRegisterSlotGeometry,
  useSlotGeometry,
} from 'stream-chat-react/slot-geometry';

import { CHANNEL_LIST_TARGET_ID } from '../../AccessibilityNavigation/skipNavigationTargets';
import {
  ChannelListItemUIWithPresence,
  SwitchableChannelNavigation,
} from '../../ChannelList';
import { ChatSidebar } from './ChatSidebar';
import {
  CHANNEL_THREAD_SLOT,
  DESKTOP_LAYOUT_BREAKPOINT,
  MAIN_CHANNEL_SLOT,
} from '../constants';
import { useIsSlotOccupied, useTagSkipNavigationListbox } from '../hooks';
import { MemberDetailProvider } from '../MemberDetail';
import { ThreadResizeHandle } from '../Resize';
import { useSidebar } from '../../Sidebar/SidebarContext.tsx';

// The channels view: the channel list in the sidebar, the primary channel in the main slot, and a
// reply thread or a 2nd channel in the secondary one, where a member's profile, a channel's details
// or the user's own profile can also open. What each slot shows comes from `chatViewSlotRenderers`.
export const ChannelsView = ({
  iconOnly,
  itemSet,
}: {
  iconOnly?: boolean;
  initialChannelId?: string;
  itemSet?: ChatViewSelectorEntry[];
}) => {
  const mainChannel = useSlotChannel({ slot: MAIN_CHANNEL_SLOT });
  const mainChannelId = mainChannel?.id;
  const isSecondaryOpen = useIsSlotOccupied(CHANNEL_THREAD_SLOT);
  const { closeSidebar, sidebarOpen } = useSidebar();
  const channelsLayoutRef = useRef<HTMLDivElement | null>(null);
  const { close } = useChatViewNavigation();
  // Each column is registered with the geometry module, so `isObscured(MAIN_CHANNEL_SLOT)` reflects
  // reality: at narrow widths the open secondary panel collapses the main column to ~0.
  const registerMainSlot = useRegisterSlotGeometry(MAIN_CHANNEL_SLOT);
  const registerSecondarySlot = useRegisterSlotGeometry(CHANNEL_THREAD_SLOT);

  useEffect(() => {
    if (!mainChannelId || typeof window === 'undefined') return;
    if (window.innerWidth >= DESKTOP_LAYOUT_BREAKPOINT) return;
    closeSidebar();
  }, [mainChannelId, closeSidebar]);

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

  useTagSkipNavigationListbox(
    '.app-chat-sidebar-overlay .str-chat__channel-list [role="listbox"]',
    CHANNEL_LIST_TARGET_ID,
  );

  return (
    <MemberDetailProvider>
      <WorkspaceLayout
        className={clsx('app-chat-view__channels-layout', {
          'app-chat-view__channels-layout--channel-selected': !!mainChannel,
          'app-chat-view__channels-layout--secondary-open': isSecondaryOpen,
          'app-chat-view__channels-layout--sidebar-collapsed': !sidebarOpen,
        })}
        ref={channelsLayoutRef}
        // The handle belongs to the secondary slot, whatever it holds: a reply thread, a 2nd
        // channel or a layer over them.
        renderBetweenSlots={() => <ThreadResizeHandle isOpen={isSecondaryOpen} />}
        sidebar={
          <ChatSidebar
            iconOnly={iconOnly}
            itemSet={itemSet}
            layoutRef={channelsLayoutRef}
          >
            <WithComponents
              overrides={{
                Avatar: ChannelAvatar,
                ChannelListItemUI: ChannelListItemUIWithPresence,
              }}
            >
              <SwitchableChannelNavigation />
            </WithComponents>
          </ChatSidebar>
        }
        slots={[
          {
            className: 'app-chat-view__channel-main',
            elementRef: registerMainSlot,
            slot: MAIN_CHANNEL_SLOT,
          },
          {
            className: clsx('app-chat-secondary-panel', {
              'app-chat-secondary-panel--open': isSecondaryOpen,
            }),
            elementRef: registerSecondarySlot,
            slot: CHANNEL_THREAD_SLOT,
          },
        ]}
      />
    </MemberDetailProvider>
  );
};
