import type { PropsWithChildren, RefObject } from 'react';
import { ChatView, type ChatViewSelectorEntry } from 'stream-chat-react/slot-layout';

import { SidebarResizeHandle } from '../Resize';

// The sidebar of both views: the view selector, the view's list and the handle that resizes them.
export const ChatSidebar = ({
  children,
  iconOnly,
  itemSet,
  layoutRef,
}: PropsWithChildren<{
  iconOnly?: boolean;
  itemSet?: ChatViewSelectorEntry[];
  layoutRef: RefObject<HTMLDivElement | null>;
}>) => (
  <>
    <div className='app-chat-sidebar-overlay'>
      <ChatView.Selector iconOnly={iconOnly} itemSet={itemSet} />
      {children}
    </div>
    <SidebarResizeHandle layoutRef={layoutRef} />
  </>
);
