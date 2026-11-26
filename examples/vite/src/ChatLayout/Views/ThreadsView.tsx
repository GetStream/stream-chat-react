import clsx from 'clsx';
import { useRef } from 'react';
import { ThreadList } from 'stream-chat-react';
import {
  type ChatViewSelectorEntry,
  WorkspaceLayout,
} from 'stream-chat-react/slot-layout';

import { THREAD_LIST_TARGET_ID } from '../../AccessibilityNavigation/skipNavigationTargets';
import { ChatSidebar } from './ChatSidebar';
import { MAIN_THREAD_SLOT, OPTIONAL_THREAD_SLOT } from '../constants';
import { useIsSlotOccupied, useTagSkipNavigationListbox } from '../hooks';
import { ThreadResizeHandle } from '../Resize';
import { useSidebar } from '../../Sidebar/SidebarContext.tsx';

// The threads view: the thread list in the sidebar, the primary thread in the main column and an
// optional 2nd thread (ctrl/⌘-click) in the resizable secondary column beside it. What each slot
// shows comes from `chatViewSlotRenderers`.
export const ThreadsView = ({
  iconOnly,
  itemSet,
}: {
  iconOnly?: boolean;
  itemSet?: ChatViewSelectorEntry[];
}) => {
  const { sidebarOpen } = useSidebar();
  const isMainOpen = useIsSlotOccupied(MAIN_THREAD_SLOT);
  const isSecondaryOpen = useIsSlotOccupied(OPTIONAL_THREAD_SLOT);
  const threadsLayoutRef = useRef<HTMLDivElement | null>(null);

  useTagSkipNavigationListbox(
    '.app-chat-sidebar-overlay .str-chat__thread-list',
    THREAD_LIST_TARGET_ID,
  );

  return (
    <WorkspaceLayout
      className={clsx('app-chat-view__threads-layout', {
        'app-chat-view__threads-layout--secondary-open': isSecondaryOpen,
        'app-chat-view__threads-layout--sidebar-collapsed': !sidebarOpen,
        'app-chat-view__threads-layout--thread-selected': isMainOpen || isSecondaryOpen,
      })}
      ref={threadsLayoutRef}
      renderBetweenSlots={() => <ThreadResizeHandle isOpen={isSecondaryOpen} />}
      sidebar={
        <ChatSidebar iconOnly={iconOnly} itemSet={itemSet} layoutRef={threadsLayoutRef}>
          <ThreadList />
        </ChatSidebar>
      }
      slots={[
        { className: 'app-chat-view__thread-main', slot: MAIN_THREAD_SLOT },
        {
          className: clsx('app-chat-secondary-panel', {
            'app-chat-secondary-panel--open': isSecondaryOpen,
          }),
          slot: OPTIONAL_THREAD_SLOT,
        },
      ]}
    />
  );
};
