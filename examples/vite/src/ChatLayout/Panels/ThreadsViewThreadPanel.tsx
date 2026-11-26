import type { Thread as ThreadType } from 'stream-chat';
import {
  MessageComposerUI as DefaultMessageComposerUI,
  Thread,
  ThreadHeader,
  TypingIndicator,
  WithComponents,
  WithDragAndDropUpload,
} from 'stream-chat-react';
import { useActiveThread } from 'stream-chat-react/slot-layout';

import { ReturnToSkipNavigation } from '../../AccessibilityNavigation/ReturnToSkipNavigation.tsx';
import { THREAD_MESSAGE_COMPOSER_TEXTAREA_TARGET_ID } from '../../AccessibilityNavigation/skipNavigationTargets';
import { ConfigurableMessageComposer } from '../../ConfigurableMessageComposer';
import { HeaderStartWithSidebarToggle } from '../../Sidebar/HeaderContent.tsx';
import { ThreadMessageList } from './ThreadMessageList';

// Renders the "Back to quick navigation" return link above the thread's composer (the SDK renders
// the thread composer internally, so we inject via the MessageComposerUI slot) — matching the
// channel view, where the link sits right above <MessageComposer />.
const ThreadMessageComposerUI = () => (
  <>
    <ReturnToSkipNavigation />
    <DefaultMessageComposerUI />
  </>
);

// A thread in the threads view: the primary one, opened from the thread list, or a 2nd one opened
// beside it with a ⌘/ctrl-click. Its header's close button releases the slot it is in.
// `useActiveThread` keeps it activated with window focus.
export const ThreadsViewThreadPanel = ({
  focusComposer,
  thread,
}: {
  focusComposer?: boolean;
  thread: ThreadType;
}) => {
  useActiveThread({ activeThread: thread });

  return (
    <Thread thread={thread}>
      <WithDragAndDropUpload className='str-chat__dropzone-root--thread'>
        <WithComponents
          overrides={{
            MessageComposerUI: ThreadMessageComposerUI,
            TypingIndicator,
          }}
        >
          <ThreadHeader StartContent={HeaderStartWithSidebarToggle} />
          <ThreadMessageList />
          <ConfigurableMessageComposer
            additionalTextareaProps={
              focusComposer
                ? { id: THREAD_MESSAGE_COMPOSER_TEXTAREA_TARGET_ID }
                : undefined
            }
            focus={focusComposer}
          />
        </WithComponents>
      </WithDragAndDropUpload>
    </Thread>
  );
};
