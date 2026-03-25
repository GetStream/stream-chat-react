import React from 'react';

import { cleanup, render, screen } from '@testing-library/react';
import { axe } from '../../../../axe-helper';
import { TypingIndicator } from '../TypingIndicator';

import { ChannelStateProvider } from '../../../context/ChannelStateContext';
import { ChatProvider } from '../../../context/ChatContext';
import { ComponentProvider } from '../../../context/ComponentContext';
import { TypingProvider } from '../../../context/TypingContext';

import {
  generateChannel,
  generateUser,
  getOrCreateChannelApi,
  getTestClientWithUser,
  mockChannelStateContext,
  mockChatContext,
  mockComponentContext,
  mockTypingContext,
  useMockedApis,
} from '../../../mock-builders';

vi.mock('../../Threads', () => ({
  useThreadContext: vi.fn(() => undefined),
}));

const me = generateUser();
const scrollToBottom = vi.fn();

async function renderComponent(
  typing = {},
  threadList?: any,
  value: any = {},
  typingIndicatorProps: any = {},
) {
  const client = await getTestClientWithUser(me);

  return render(
    <ChatProvider value={mockChatContext({ client })}>
      <ChannelStateProvider value={mockChannelStateContext({ ...value })}>
        <ComponentProvider value={mockComponentContext()}>
          <TypingProvider value={mockTypingContext({ typing })}>
            <TypingIndicator
              scrollToBottom={scrollToBottom}
              threadList={threadList}
              {...typingIndicatorProps}
            />
          </TypingProvider>
        </ComponentProvider>
      </ChannelStateProvider>
    </ChatProvider>,
  );
}

describe('TypingIndicator', () => {
  afterEach(() => {
    cleanup();
    scrollToBottom.mockClear();
  });

  it('should render null without proper context values', () => {
    vi.spyOn(console, 'warn').mockImplementationOnce(() => null);
    const { container } = render(
      <ChatProvider value={mockChatContext()}>
        <ChannelStateProvider value={mockChannelStateContext()}>
          <ComponentProvider value={mockComponentContext()}>
            <TypingIndicator scrollToBottom={scrollToBottom} />
          </ComponentProvider>
        </ChannelStateProvider>
      </ChatProvider>,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('should render hidden indicator with empty typing', async () => {
    const client = await getTestClientWithUser(me);
    const { container } = render(
      <ChatProvider value={mockChatContext({ client })}>
        <ChannelStateProvider value={mockChannelStateContext()}>
          <ComponentProvider value={mockComponentContext()}>
            <TypingProvider value={mockTypingContext({ typing: {} })}>
              <TypingIndicator scrollToBottom={scrollToBottom} />
            </TypingProvider>
          </ComponentProvider>
        </ChannelStateProvider>
      </ChatProvider>,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("should not render TypingIndicator when it's just you typing", async () => {
    const { container } = await renderComponent({ alice: { user: me } });
    expect(container).toBeEmptyDOMElement();
  });

  it('should render TypingIndicator when someone else is typing', async () => {
    const { container } = await renderComponent({
      jessica: { user: { id: 'jessica', image: 'jessica.jpg', name: 'Jessica' } },
    });

    expect(container.firstChild).toHaveClass('str-chat__typing-indicator--typing');
    expect(screen.getByTestId('typing-indicator')).toBeInTheDocument();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should render TypingIndicator when you and someone else are typing', async () => {
    const otherUser = { user: { id: 'jessica', image: 'jessica.jpg', name: 'Jessica' } };
    const { container } = await renderComponent({
      alice: { user: me },
      jessica: otherUser,
    });

    expect(container.firstChild).toHaveClass('str-chat__typing-indicator--typing');
    expect(screen.getByTestId('typing-indicator')).toBeInTheDocument();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should render TypingIndicator when multiple users are typing', async () => {
    const { container } = await renderComponent({
      alice: { user: me },
      jessica: { user: { id: 'jessica', image: 'jessica.jpg', name: 'Jessica' } },
      joris: { user: { id: 'joris', image: 'joris.jpg', name: 'Joris' } },
      margriet: { user: { id: 'margriet', image: 'margriet.jpg', name: 'Margriet' } },
    });
    expect(screen.getByTestId('typing-indicator')).toBeInTheDocument();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should render TypingIndicator when larger amount of users are typing', async () => {
    const { container } = await renderComponent({
      alice: { user: me },
      axel: { user: { id: 'axel', image: 'axel.jpg', name: 'Axel' } },
      jessica: { user: { id: 'jessica', image: 'jessica.jpg', name: 'Jessica' } },
      joris: { user: { id: 'joris', image: 'joris.jpg', name: 'Joris' } },
      margriet: { user: { id: 'margriet', image: 'margriet.jpg', name: 'Margriet' } },
    });
    expect(screen.getByTestId('typing-indicator')).toBeInTheDocument();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should render null when isMessageListScrolledToBottom is false', async () => {
    const { container } = await renderComponent(
      { jessica: { user: { id: 'jessica', image: 'jessica.jpg', name: 'Jessica' } } },
      false,
      {},
      { isMessageListScrolledToBottom: false },
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('should render null if typing_events is disabled', async () => {
    const client = await getTestClientWithUser();
    const ch = generateChannel({ config: { typing_events: false } } as any);
    useMockedApis(client, [getOrCreateChannelApi(ch)]);
    const channel = client.channel('messaging', ch['id']);
    const channelConfig = { typing_events: false } as any;
    await channel.watch();

    const { container } = render(
      <ChatProvider value={mockChatContext({ client })}>
        <ChannelStateProvider value={mockChannelStateContext({ channel, channelConfig })}>
          <ComponentProvider value={mockComponentContext()}>
            <TypingProvider value={mockTypingContext({ typing: {} })}>
              <TypingIndicator scrollToBottom={scrollToBottom} />
            </TypingProvider>
          </ComponentProvider>
        </ChannelStateProvider>
      </ChatProvider>,
    );

    expect(container).toBeEmptyDOMElement();
  });

  describe('TypingIndicator in thread', () => {
    let client;
    let ch;
    let channel;
    const parent_id = 'sample-thread';
    const otherUserId = 'test-user';

    beforeEach(async () => {
      client = await getTestClientWithUser();
      ch = generateChannel({ config: { typing_events: true } } as any);
      useMockedApis(client, [getOrCreateChannelApi(ch)]);
      channel = client.channel('messaging', ch.id);
      await channel.watch();
    });

    afterEach(cleanup);

    it('should render TypingIndicator if user is typing in thread', async () => {
      const { container } = await renderComponent(
        { [otherUserId]: { parent_id, user: { id: otherUserId } } },
        true,
        {
          channel,
          client,
          thread: { id: parent_id },
        },
      );

      expect(container.firstChild).toHaveClass('str-chat__typing-indicator--typing');
    });

    it('should not render TypingIndicator in main channel if user is typing in thread', async () => {
      const { container } = await renderComponent(
        { [otherUserId]: { parent_id, user: { id: otherUserId } } },
        false,
        {
          channel,
          client,
          thread: { id: parent_id },
        },
      );

      expect(container).toBeEmptyDOMElement();
    });

    it('should not render TypingIndicator in thread if user is typing in main channel', async () => {
      const { container } = await renderComponent(
        { [otherUserId]: { user: { id: otherUserId } } },
        true,
        {
          channel,
          client,
          thread: { id: parent_id },
        },
      );

      expect(container).toBeEmptyDOMElement();
    });

    it('should not render TypingIndicator in thread if user is typing in another thread', async () => {
      const { container } = await renderComponent(
        { example: { parent_id: 'sample-thread-2', user: { id: otherUserId } } },
        true,
        {
          channel,
          client,
          thread: { id: parent_id },
        },
      );

      expect(container).toBeEmptyDOMElement();
    });
  });
});
