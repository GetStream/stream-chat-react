import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { StateStore } from 'stream-chat';
import { fromPartial } from '@total-typescript/shoehorn';

import { ThreadStart } from '../ThreadStart';

import { ChatProvider, TranslationProvider } from '../../../context';
import { ThreadProvider } from '../../Threads';

import type { LocalMessage, StreamChat, Thread, ThreadState } from 'stream-chat';
import {
  generateMessage,
  getTestClientWithUser,
  mockChatContext,
  mockTranslationContextValue,
} from '../../../mock-builders';

// MERGE-RECONCILE (test migration): ThreadStart moved off the deleted ChannelStateContext.
// It now reads the parent message from the thread instance in ThreadContext via
// `useStateStore(thread.state, ...)`. Provide a thread instance whose `.state` StateStore
// exposes `parentMessage` instead of passing `thread` through ChannelStateContext.
let client: StreamChat;

const makeThread = (parentMessage: LocalMessage) =>
  fromPartial<Thread>({
    state: new StateStore<ThreadState>(fromPartial<ThreadState>({ parentMessage })),
  });

const i18nMock = {
  t: vi.fn((key: string, props: any) => {
    if (key === 'replyCount' && props.count === 1) return '1 reply';
    else if (key === 'replyCount' && props.count > 1) return '2 replies';
    return key;
  }),
};

const renderComponent = ({ client, parentMessage }: any) =>
  render(
    <ChatProvider value={mockChatContext({ client, latestMessageDatesByChannels: {} })}>
      <TranslationProvider value={mockTranslationContextValue(i18nMock)}>
        <ThreadProvider thread={makeThread(parentMessage)}>
          <ThreadStart />
        </ThreadProvider>
      </TranslationProvider>
    </ChatProvider>,
  );

describe('ThreadStart', () => {
  beforeEach(async () => {
    client = await getTestClientWithUser();
    i18nMock.t.mockClear();
  });

  afterEach(cleanup);

  it('does not render if no replies', () => {
    const parentMessage = generateMessage();
    const { container } = renderComponent({ client, parentMessage });
    expect(container.children).toHaveLength(0);
  });
  it('renders if replies exist', () => {
    const parentMessage = generateMessage({ reply_count: 1 });
    renderComponent({ client, parentMessage });
    expect(i18nMock.t).toHaveBeenCalledWith('replyCount', {
      count: parentMessage.reply_count,
    });
    expect(screen.queryByText('1 reply')).toBeInTheDocument();
  });
});
