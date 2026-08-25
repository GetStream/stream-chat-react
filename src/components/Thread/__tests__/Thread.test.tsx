import { act, cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import React from 'react';
import { fromPartial } from '@total-typescript/shoehorn';
import { StateStore } from 'stream-chat';
import type {
  ChannelConfig,
  LocalMessage,
  StreamChat,
  Thread as StreamThread,
  ThreadState,
} from 'stream-chat';

import { ChatProvider, ComponentProvider } from '../../../context';

import {
  generateMessage,
  generateUser,
  initClientWithChannels,
  mockChatContext,
  mockComponentContext,
} from '../../../mock-builders';

import { MessageComposer as MessageInputMock } from '../../MessageComposer/MessageComposer';
import { MessageList as MessageListMock } from '../../MessageList';
import { Thread } from '../Thread';
import type { ThreadProps } from '../Thread';
import type { ComponentContextValue } from '../../../context';

// MERGE-RECONCILE (test migration): PR #2909 / v14 rewrote Thread to read from a Thread instance
// in ThreadContext (not the deleted ChannelStateContext/ChannelActionContext). The parent message,
// reply pagination and loading now live on `threadInstance.state` / `threadInstance.messagePaginator`,
// the thread-manager list on `client.threads.state`, and closing a thread calls
// `threadInstance.deactivate()` (plus ChatView slot navigation). Obsolete assertions that referenced
// the removed MessageList props (`hasMore`/`loadMore`/`messages`/`threadList`) and the
// ChannelActionContext `loadMoreThread`/`closeThread` handlers are updated to the current contract.

vi.mock('../../Message/Message', () => ({
  Message: vi.fn(() => <div />),
}));
vi.mock('../../MessageList/MessageList', () => ({
  MessageList: vi.fn(() => <div />),
}));
vi.mock('../../MessageList/VirtualizedMessageList', () => ({
  VirtualizedMessageList: vi.fn(() => <div />),
}));
vi.mock('../../MessageComposer/MessageComposer', () => ({
  MessageComposer: vi.fn(() => <div />),
}));
vi.mock('../ThreadHeader', () => ({
  ThreadHeader: vi.fn(({ closeThread }) => (
    <button data-testid='close-thread-button' onClick={closeThread} type='button' />
  )),
}));
vi.mock('../../Threads', () => ({
  useThreadContext: vi.fn(() => undefined),
}));

import { useThreadContext } from '../../Threads';

let chatClient: StreamChat;
const alice = generateUser({ id: 'alice', name: 'alice' });
const bob = generateUser({ id: 'bob', name: 'bob' });
const parentMessage = generateMessage({ reply_count: 2, user: alice });
const reply1 = generateMessage({ parent_id: parentMessage.id, user: bob });
const reply2 = generateMessage({ parent_id: parentMessage.id, user: alice });

const makeThread = (
  opts: {
    isLoading?: boolean;
    isStateStale?: boolean;
    items?: LocalMessage[] | undefined;
    parentMessage?: LocalMessage;
    replies?: boolean;
  } = {},
) => {
  const { isLoading = false, isStateStale = false, replies = true } = opts;
  const parent = opts.parentMessage ?? parentMessage;
  // Distinguish "not provided" (default to loaded replies) from an explicit `undefined`
  // (replies not fetched yet) — a destructuring default cannot tell them apart.
  const items = 'items' in opts ? opts.items : [reply1, reply2];
  const deactivate = vi.fn();
  const reload = vi.fn(() => Promise.resolve());
  const thread = fromPartial<StreamThread>({
    channel: fromPartial({
      cid: 'messaging:thread-test',
      // A real store: `Thread` subscribes to the resolved configuration rather than reading the
      // non-reactive `channel.config` getter, so a stub with only `getLatestValue` is not enough.
      configState: new StateStore(
        fromPartial<ChannelConfig>({ replies: { enabled: replies } }),
      ),
    }),
    configState: undefined,
    deactivate,
    id: parent.id,
    messagePaginator: {
      state: new StateStore(fromPartial({ isLoading, items, lastQueryError: undefined })),
    },
    reload,
    state: new StateStore<ThreadState>(
      fromPartial<ThreadState>({ isStateStale, parentMessage: parent }),
    ),
  });
  return { deactivate, reload, thread };
};

const renderComponent = (
  opts: {
    componentOverrides?: Partial<ComponentContextValue>;
    threadInstance?: StreamThread | undefined;
    threadProps?: Partial<ThreadProps> & Record<string, unknown>;
  } = {},
) => {
  const { componentOverrides = {}, threadProps = {} } = opts;
  // Distinguish "not provided" (use a default thread) from an explicit `undefined`
  // (simulate an absent thread context) — a destructuring default cannot tell them apart.
  const threadInstance =
    'threadInstance' in opts ? opts.threadInstance : makeThread().thread;
  vi.mocked(useThreadContext).mockReturnValue(threadInstance);
  return render(
    <ChatProvider
      value={mockChatContext({ client: chatClient, latestMessageDatesByChannels: {} })}
    >
      <ComponentProvider value={mockComponentContext({ ...componentOverrides })}>
        <Thread {...threadProps} />
      </ComponentProvider>
    </ChatProvider>,
  );
};

describe('Thread', () => {
  beforeAll(async () => {
    ({ client: chatClient } = await initClientWithChannels());
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('should render the MessageList component with the correct props without date separators', () => {
    const additionalMessageListProps = {
      loadingMore: false,
    };
    renderComponent({ threadProps: { additionalMessageListProps } });

    expect(MessageListMock).toHaveBeenCalledWith(
      expect.objectContaining({
        disableDateSeparator: true,
        head: expect.objectContaining({
          type: expect.objectContaining({ name: 'ThreadHead' }),
        }),
        messageActions: expect.any(Array),
        ...additionalMessageListProps,
      }),
      undefined,
    );
  });

  it('should render the MessageList component with date separators if enabled', () => {
    const additionalMessageListProps = {
      loadingMore: false,
    };
    renderComponent({
      threadProps: { additionalMessageListProps, enableDateSeparator: true },
    });

    expect(MessageListMock).toHaveBeenCalledWith(
      expect.objectContaining({
        disableDateSeparator: false,
        head: expect.objectContaining({
          type: expect.objectContaining({ name: 'ThreadHead' }),
        }),
        messageActions: expect.any(Array),
        ...additionalMessageListProps,
      }),
      undefined,
    );
  });

  it('should render the MessageComposer with correct default props', () => {
    const props: Partial<ThreadProps> & Record<string, unknown> = {
      additionalMessageComposerProps: fromPartial({ propName: 'value' }),
      autoFocus: true,
    };
    renderComponent({ threadProps: props });

    expect(MessageInputMock).toHaveBeenCalledWith(
      expect.objectContaining({
        focus: props.autoFocus,
        parent: expect.objectContaining(parentMessage),
        ...props.additionalMessageComposerProps,
      }),
      undefined,
    );
  });

  it('should pass additionalMessageComposerProps to MessageComposer', () => {
    const props: Partial<ThreadProps> & Record<string, unknown> = {
      additionalMessageComposerProps: fromPartial({
        propName: 'value',
      }),
      autoFocus: true,
    };

    renderComponent({ threadProps: props });

    expect(MessageInputMock).toHaveBeenCalledWith(
      expect.objectContaining({
        focus: props.autoFocus,
        parent: expect.objectContaining(parentMessage),
        ...props.additionalMessageComposerProps,
      }),
      undefined,
    );
  });

  it('should render a custom ThreadHeader if it is passed via ComponentContext', async () => {
    const CustomThreadHeader = vi.fn(() => <div data-testid='custom-thread-header' />);

    const { getByTestId } = renderComponent({
      componentOverrides: { ThreadHeader: CustomThreadHeader },
    });

    await waitFor(() => {
      expect(getByTestId('custom-thread-header')).toBeInTheDocument();
      expect(CustomThreadHeader).toHaveBeenCalledWith(
        expect.objectContaining({
          closeThread: expect.any(Function),
          thread: expect.objectContaining(parentMessage),
        }),
        undefined,
      );
    });
  });

  it('should deactivate the thread when the close button is pressed', () => {
    const { deactivate, thread } = makeThread();
    const { getByTestId } = renderComponent({ threadInstance: thread });

    fireEvent.click(getByTestId('close-thread-button'));

    expect(deactivate).toHaveBeenCalledTimes(1);
  });

  it('should pass messageActions prop to the used messageList', () => {
    const messageActions = ['edit', 'reply', 'delete'];
    renderComponent({
      threadProps: {
        messageActions,
      },
    });

    expect(MessageListMock).toHaveBeenCalledWith(
      expect.objectContaining({
        messageActions,
      }),
      undefined,
    );
  });

  it('should assign str-chat__thread--virtualized class to the root in virtualized mode', () => {
    const { container } = renderComponent({
      threadProps: { virtualized: true },
    });
    expect(container.querySelector('.str-chat__thread--virtualized')).toBeInTheDocument();
  });

  it('should not assign str-chat__thread--virtualized class to the root in non-virtualized mode', () => {
    const { container } = renderComponent({
      threadProps: { virtualized: false },
    });
    expect(
      container.querySelector('.str-chat__thread--virtualized'),
    ).not.toBeInTheDocument();
  });

  it('should not render anything if there is no thread instance in context', () => {
    const { container } = renderComponent({ threadInstance: undefined });

    expect(container.querySelector('.str-chat__thread')).not.toBeInTheDocument();
  });

  it('should reload the thread on mount when replies have not been fetched yet', () => {
    // Use a unique parent id so the thread is not already tracked in the shared
    // client.threads manager state (which would short-circuit the reload effect).
    const { reload, thread } = makeThread({
      items: undefined,
      parentMessage: generateMessage({
        id: 'reload-parent',
        reply_count: 2,
        user: alice,
      }),
    });
    renderComponent({ threadInstance: thread });

    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('should render null if replies is disabled', () => {
    const { thread } = makeThread({ replies: false });
    const { container } = renderComponent({ threadInstance: thread });

    expect(container).toBeEmptyDOMElement();
  });

  it('should stop rendering when replies is disabled after mount', () => {
    // Guards the subscription: reading the non-reactive `channel.config` getter would leave an open
    // thread rendered after `client.config` disabled replies.
    const { thread } = makeThread({ replies: true });
    const { container } = renderComponent({ threadInstance: thread });
    expect(container).not.toBeEmptyDOMElement();

    act(() => {
      thread.channel.configState.partialNext(
        fromPartial<ChannelConfig>({ replies: { enabled: false } }),
      );
    });

    expect(container).toBeEmptyDOMElement();
  });
});
