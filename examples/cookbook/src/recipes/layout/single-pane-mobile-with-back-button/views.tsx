import type { ReactNode } from 'react';
import type { Thread as StreamThread } from 'stream-chat';
import {
  Button,
  Channel,
  ChannelHeader,
  MessageComposer,
  MessageList,
  Thread,
  ThreadHeader,
  useChannelInstanceContext,
  useComponentContextIcons,
  useThreadContext,
  useWorkspaceNavigation,
  useWorkspacePanel,
  WorkspaceNavigationBackButton,
} from 'stream-chat-react';
import {
  ChatView,
  Slot,
  useActiveThread,
  useLayoutViewState,
} from 'stream-chat-react/slot-layout';
import type {
  ChatViewSlotRenderers,
  DeriveWorkspaceNavigation,
  LayoutDescriptor,
} from 'stream-chat-react/slot-layout';
import './layout.css';

// Each view has a single slot. A channel or a thread opens there, at full width.
export const layouts: LayoutDescriptor[] = [
  { id: 'channels', slots: ['main'] },
  { id: 'threads', slots: ['main'] },
];

// In the channels view, a thread opens on top of its channel, so back returns
// to the channel. In the threads view, it replaces the thread before it.
export const deriveWorkspaceNavigation: DeriveWorkspaceNavigation = (base) => ({
  openThread: (target, options) =>
    base.openThread(target, {
      ...options,
      layer: options?.layer ?? !base.isThreadsView,
    }),
});

// Goes back one step. Over a channel, the SDK's back button removes the thread
// on top. Anywhere else, back closes the panel, and the list shows again.
const BackButton = () => {
  const { IconArrowLeft } = useComponentContextIcons();
  const { canGoBack, closeChannel, closeThread } = useWorkspaceNavigation();
  const panel = useWorkspacePanel();
  const thread = useThreadContext();
  const { channel } = useChannelInstanceContext();

  if (canGoBack(thread ? thread.id : channel?.cid, panel)) {
    return <WorkspaceNavigationBackButton />;
  }

  return (
    <Button
      appearance='ghost'
      aria-label='Back to the list'
      circular
      onClick={(event) => {
        if (thread) closeThread(thread.id, { event, panel });
        else closeChannel(channel?.cid, { event, panel });
      }}
      size='md'
      variant='secondary'
    >
      <IconArrowLeft />
    </Button>
  );
};

// Takes the place of the thread header's close button, which would do what back does.
const NoButton = () => null;

const ThreadContent = ({ thread }: { thread: StreamThread }) => {
  // Marks the thread as on screen while the window is visible and focused.
  useActiveThread({ activeThread: thread });
  return (
    <Thread thread={thread}>
      <ThreadHeader EndContent={NoButton} StartContent={BackButton} />
      <MessageList />
      <MessageComposer />
    </Thread>
  );
};

export const slotRenderers: ChatViewSlotRenderers = {
  channel: ({ source }) => (
    <Channel channel={source}>
      <ChannelHeader StartContent={BackButton} />
      <MessageList />
      <MessageComposer />
    </Channel>
  ),
  thread: ({ source }) => <ThreadContent thread={source} />,
};

// Shows the view's list until something opens in its slot, then only the slot.
export const SinglePane = ({ list }: { list: ReactNode }) => {
  const { slotBindings } = useLayoutViewState();

  if (slotBindings.main) return <Slot slot='main' />;

  return (
    <>
      <ChatView.Selector />
      {list}
    </>
  );
};
