import React from 'react';

import { cleanup, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { toHaveNoViolations } from 'jest-axe';
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

expect.extend(toHaveNoViolations);

const me = generateUser();
const makeThread = (parentMessageId) =>
  parentMessageId
    ? {
        state: {
          getLatestValue: () => ({ parentMessage: { id: parentMessageId } }),
          subscribeWithSelector: () => () => null,
        },
      }
    : undefined;

async function renderComponent(typing = {}, value = {}, threadParentId) {
  const {
    channels: [defaultChannel],
    client,
  } = await initClientWithChannels();
  const channel = value.channel || defaultChannel;
  channel.messageComposer.textComposer.typing = typing;
  const channelConfig = value.channelConfig ?? channel.getConfig();

  client.configsStore.partialNext({
    configs: { [channel.cid]: channelConfig },
  });

  return render(
    <ChatProvider value={{ client }}>
      <ChannelInstanceProvider value={{ channel }}>
        <ComponentProvider value={{}}>
          <ThreadProvider thread={makeThread(threadParentId)}>
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
    expect(() =>
      render(
        <ChatProvider value={{}}>
          <ComponentProvider value={{}}>
            <TypingIndicator />
          </ComponentProvider>
        </ChatProvider>,
      ),
    ).toThrow('The useChannel hook could not resolve a channel.');
  });

  it('should render hidden indicator with empty typing', async () => {
    const {
      channels: [channel],
      client,
    } = await initClientWithChannels();
    channel.messageComposer.textComposer.typing = {};
    const { container } = render(
      <ChatProvider value={{ client }}>
        <ChannelInstanceProvider value={{ channel }}>
          <ComponentProvider value={{}}>
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
    expect(screen.getByText('{{ user }} is typing...')).toBeInTheDocument();
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
    expect(screen.getByText('{{ user }} is typing...')).toBeInTheDocument();
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
    expect(
      screen.getByText('{{ users }} and {{ user }} are typing...'),
    ).toBeInTheDocument();
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
    expect(screen.getByText('{{ users }} and more are typing...')).toBeInTheDocument();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should render null if typing_events is disabled', async () => {
    const {
      channels: [defaultChannel],
      client,
    } = await initClientWithChannels();
    defaultChannel.messageComposer.textComposer.typing = {};
    const ch = generateChannel({ config: { typing_events: false } });
    useMockedApis(client, [getOrCreateChannelApi(ch)]);
    const channel = client.channel('messaging', ch.id);
    const channelConfig = { typing_events: false };
    await channel.watch();
    client.configsStore.partialNext({
      configs: { [channel.cid]: channelConfig },
    });

    const { container } = render(
      <ChatProvider value={{ client }}>
        <ChannelInstanceProvider value={{ channel }}>
          <ComponentProvider value={{}}>
            <TypingIndicator />
          </ComponentProvider>
        </ChannelInstanceProvider>
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
      const setup = await initClientWithChannels();
      client = setup.client;
      ch = generateChannel({ config: { typing_events: true } });
      useMockedApis(client, [getOrCreateChannelApi(ch)]);
      channel = client.channel('messaging', ch.id);
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
