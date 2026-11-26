import type { Thread as ThreadType } from 'stream-chat';
import {
  Thread,
  ThreadHeader,
  TypingIndicator,
  WithComponents,
  WithDragAndDropUpload,
} from 'stream-chat-react';
import { useActiveThread } from 'stream-chat-react/slot-layout';

import { ReturnToSkipNavigation } from '../../AccessibilityNavigation/ReturnToSkipNavigation.tsx';
import { ConfigurableMessageComposer } from '../../ConfigurableMessageComposer';
import { useMemberDetailClickHandlers } from '../MemberDetail';
import { ThreadMessageList } from './ThreadMessageList';

// A reply thread in the channels view's secondary slot, opened from a message: as the slot's base,
// or as a layer over a 2nd channel. The SDK header's back reveals what it covers; its close
// dismisses the whole secondary panel. `useActiveThread` keeps it activated with window focus.
export const ChannelThreadPanel = ({ thread }: { thread: ThreadType }) => {
  useActiveThread({ activeThread: thread });
  const memberDetailClickHandlers = useMemberDetailClickHandlers(thread.channel);

  return (
    <WithComponents overrides={{ TypingIndicator }}>
      <Thread thread={thread}>
        {/* Inside <Thread>, so the dropzone's `useChannel` resolves the thread's channel. */}
        <WithDragAndDropUpload className='str-chat__dropzone-root--thread'>
          <ReturnToSkipNavigation />
          <ThreadHeader />
          <ThreadMessageList {...memberDetailClickHandlers} />
          <ConfigurableMessageComposer />
        </WithDragAndDropUpload>
      </Thread>
    </WithComponents>
  );
};
