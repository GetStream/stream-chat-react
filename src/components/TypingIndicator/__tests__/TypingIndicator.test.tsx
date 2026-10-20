import React from 'react';
import { fromPartial } from '@total-typescript/shoehorn';
import type { ChannelConfigWithInfo } from 'stream-chat';

import { cleanup, render, screen } from '@testing-library/react';
import { axe } from '../../../../axe-helper';
import { TypingIndicator } from '../TypingIndicator';

import { ChannelInstanceProvider } from '../../../context/ChannelInstanceContext';
import { ChatProvider } from '../../../context/ChatContext';
import { ComponentProvider } from '../../../context/ComponentContext';
import { ThreadProvider } from '../../Threads/ThreadContext';

import {
  generateChannel,
  generateUser,
  getOrCreateChannelApi,
  initClientWithChannels,
  useMockedApis,
} from '../../../mock-builders';

const me = generateUser();

// Minimal StateStore stub for useStateStore (`getLatestValue` and `subscribeWithSelector`).
const makeStore = (value: unknown) => ({
  getLatestValue: () => value,
  subscribeWithSelector: () => () => null,
});

// In thread mode the typing users come from the thread's own `messageComposer.textComposer` state,
// the parent message from `thread.state`, and the channel config from `messageComposer.channel`,
// so the thread stub carries a composer that references the real channel.
const makeThread = (
  parentMessageId?: string,
  typing: Record<string, unknown> = {},
  channel?: any,
) =>
  parentMessageId
    ? {
        messageComposer: {
          channel,
          contextType: 'thread',
          registerSubscriptions: () => () => null,
          tag: `thread-${parentMessageId}`,
          textComposer: { state: makeStore({ typing }) },
        },
        state: makeStore({ parentMessage: { id: parentMessageId } }),
      }
    : undefined;

async function renderComponent(
  typing: Record<string, unknown> = {},
  value: { channel?: any; channelConfig?: any; client?: any } = {},
  threadParentId?: string,
) {
  const {
    channels: [defaultChannel],
    client,
  } = await initClientWithChannels({ customUser: me });
  const channel = value.channel || defaultChannel;
  channel.messageComposer.textComposer.typing = typing;
  const channelConfig = value.channelConfig ?? channel.serverConfig;

  client.channelServerConfigsStore.partialNext({
    // Keyed by cid: a channel's own `config_overrides` narrow its type's settings for that channel
    // alone, so the LLC caches one entry per channel rather than per type.
    configs: { [channel.cid]: channelConfig },
  });

  return render(
    <ChatProvider value={{ client } as any}>
      <ChannelInstanceProvider value={{ channel } as any}>
        <ComponentProvider value={{} as any}>
          <ThreadProvider thread={makeThread(threadParentId, typing, channel) as any}>
            <TypingIndicator />
          </ThreadProvider>
        </ComponentProvider>
      </ChannelInstanceProvider>
    </ChatProvider>,
  );
}

describe('TypingIndicator', () => {
  afterEach(cleanup);

  it('should throw without proper context values', () => {
    // Without a channel or client in context the component throws while resolving the message
    // composer, so the test only asserts that rendering throws.
    expect(() =>
      render(
        <ChatProvider value={{} as any}>
          <ComponentProvider value={{} as any}>
            <TypingIndicator />
          </ComponentProvider>
        </ChatProvider>,
      ),
    ).toThrow();
  });

  it('should render hidden indicator with empty typing', async () => {
    const {
      channels: [channel],
      client,
    } = await initClientWithChannels();
    channel.messageComposer.textComposer.typing = {};
    const { container } = render(
      <ChatProvider value={{ client } as any}>
        <ChannelInstanceProvider value={{ channel } as any}>
          <ComponentProvider value={{} as any}>
            <TypingIndicator />
          </ComponentProvider>
        </ChannelInstanceProvider>
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
      jessica: { user: { id: 'jessica', image: 'jessica.jpg' } },
    });

    expect(container.firstChild).toHaveClass('str-chat__typing-indicator--typing');
    expect(screen.getByTestId('typing-indicator-status')).toHaveTextContent(
      'jessica is typing',
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should render TypingIndicator when you and someone else are typing', async () => {
    const otherUser = { user: { id: 'jessica', image: 'jessica.jpg' } };
    const { container } = await renderComponent({
      alice: { user: me },
      jessica: otherUser,
    });

    expect(container.firstChild).toHaveClass('str-chat__typing-indicator--typing');
    // Own typing entry is filtered out, so a single (foreign) typer remains.
    expect(screen.getByTestId('typing-indicator-status')).toHaveTextContent(
      'jessica is typing',
    );
    expect(screen.getAllByTestId('avatar')).toHaveLength(1);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should render TypingIndicator when two other users are typing', async () => {
    const { container } = await renderComponent({
      alice: { user: me },
      jessica: { user: { id: 'jessica', image: 'jessica.jpg' } },
      joris: { user: { id: 'joris', image: 'joris.jpg' } },
    });
    expect(screen.getByTestId('typing-indicator-status')).toHaveTextContent(
      'jessica and joris are typing',
    );
    expect(screen.getAllByTestId('avatar')).toHaveLength(2);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should render TypingIndicator when multiple users are typing', async () => {
    const { container } = await renderComponent({
      alice: { user: me },
      jessica: { user: { id: 'jessica', image: 'jessica.jpg' } },
      joris: { user: { id: 'joris', image: 'joris.jpg' } },
      margriet: { user: { id: 'margriet', image: 'margriet.jpg' } },
    });
    expect(screen.getByTestId('typing-indicator-status')).toHaveTextContent(
      '3 people are typing',
    );
    // 3 foreign typers equal the AvatarStack cap, so all avatars render without an overflow badge.
    expect(screen.getAllByTestId('avatar')).toHaveLength(3);
    expect(screen.queryByTestId('avatar-stack-count-badge')).not.toBeInTheDocument();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should render TypingIndicator when larger amount of users are typing', async () => {
    const { container } = await renderComponent({
      alice: { user: me },
      axel: { user: { id: 'axel', image: 'axel.jpg' } },
      jessica: { user: { id: 'jessica', image: 'jessica.jpg' } },
      joris: { user: { id: 'joris', image: 'joris.jpg' } },
      margriet: { user: { id: 'margriet', image: 'margriet.jpg' } },
    });
    expect(screen.getByTestId('typing-indicator-status')).toHaveTextContent(
      '4 people are typing',
    );
    // 4 foreign typers exceed the AvatarStack cap of 3, so the remainder is an overflow badge.
    expect(screen.getAllByTestId('avatar')).toHaveLength(3);
    expect(screen.getByTestId('avatar-stack-count-badge')).toHaveTextContent('+1');
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should render null if typing_events is disabled', async () => {
    // A foreign user is typing (same setup that renders the indicator above), so a null render can
    // only come from the disabled `typing_events` config.
    const { container } = await renderComponent(
      { jessica: { user: { id: 'jessica', image: 'jessica.jpg' } } },
      { channelConfig: fromPartial<ChannelConfigWithInfo>({ typing_events: false }) },
    );

    expect(container).toBeEmptyDOMElement();
  });

  describe('TypingIndicator in thread', () => {
    let client: any;
    let ch: any;
    let channel: any;
    const parent_id = 'sample-thread';
    const otherUserId = 'test-user';

    beforeEach(async () => {
      const setup = await initClientWithChannels();
      client = setup.client;
      ch = generateChannel({
        channel: { config: fromPartial<ChannelConfigWithInfo>({ typing_events: true }) },
      });
      useMockedApis(client, [getOrCreateChannelApi(ch)]);
      channel = client.channelManager.ensure({ id: ch.id, type: 'messaging' });
      await channel.watch();
    });

    afterEach(cleanup);

    it('should render TypingIndicator if user is typing in thread', async () => {
      const { container } = await renderComponent(
        { [otherUserId]: { parent_id, user: otherUserId } },
        {
          channel,
          client,
        },
        parent_id,
      );

      expect(container.firstChild).toHaveClass('str-chat__typing-indicator--typing');
    });

    it('should not render TypingIndicator in main channel if user is typing in thread', async () => {
      const { container } = await renderComponent(
        { [otherUserId]: { parent_id, user: otherUserId } },
        {
          channel,
          client,
        },
      );

      expect(container).toBeEmptyDOMElement();
    });

    it('should not render TypingIndicator in thread if user is typing in main channel', async () => {
      const { container } = await renderComponent(
        { [otherUserId]: { user: otherUserId } },
        {
          channel,
          client,
        },
        parent_id,
      );

      expect(container).toBeEmptyDOMElement();
    });

    it('should not render TypingIndicator in thread if user is typing in another thread', async () => {
      const { container } = await renderComponent(
        { example: { parent_id: 'sample-thread-2', user: otherUserId } },
        {
          channel,
          client,
        },
        parent_id,
      );

      expect(container).toBeEmptyDOMElement();
    });
  });
});
