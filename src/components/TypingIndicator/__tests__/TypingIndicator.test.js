import React from 'react';

import { cleanup, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { toHaveNoViolations } from 'jest-axe';
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
  useMockedApis,
} from '../../../mock-builders';

expect.extend(toHaveNoViolations);

const me = generateUser();

async function renderComponent(typing = {}, threadList, value = {}) {
  const client = await getTestClientWithUser(me);

  return render(
    <ChatProvider value={{ client }}>
      <ChannelStateProvider value={{ ...value }}>
        <ComponentProvider value={{}}>
          <TypingProvider value={{ typing }}>
            <TypingIndicator threadList={threadList} />
          </TypingProvider>
        </ComponentProvider>
      </ChannelStateProvider>
    </ChatProvider>,
  );
}

describe('TypingIndicator', () => {
  afterEach(cleanup);

  it('should render null without proper context values', () => {
    jest.spyOn(console, 'warn').mockImplementationOnce(() => null);
    const { container } = render(
      <ChatProvider value={{}}>
        <ChannelStateProvider value={{}}>
          <ComponentProvider value={{}}>
            <TypingIndicator />
          </ComponentProvider>
        </ChannelStateProvider>
      </ChatProvider>,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('should render hidden indicator with empty typing', async () => {
    const client = await getTestClientWithUser(me);
    const { container } = render(
      <ChatProvider value={{ client }}>
        <ChannelStateProvider value={{}}>
          <ComponentProvider value={{}}>
            <TypingProvider value={{ typing: {} }}>
              <TypingIndicator />
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
    const client = await getTestClientWithUser();
    const ch = generateChannel({ config: { typing_events: false } });
    useMockedApis(client, [getOrCreateChannelApi(ch)]);
    const channel = client.channel('messaging', ch.id);
    const channelConfig = { typing_events: false };
    await channel.watch();

    const { container } = render(
      <ChatProvider value={{ client }}>
        <ChannelStateProvider value={{ channel, channelConfig }}>
          <ComponentProvider value={{}}>
            <TypingProvider value={{ typing: {} }}>
              <TypingIndicator />
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
      ch = generateChannel({ config: { typing_events: true } });
      useMockedApis(client, [getOrCreateChannelApi(ch)]);
      channel = client.channel('messaging', ch.id);
      await channel.watch();
    });

    afterEach(cleanup);

    it('should render TypingIndicator if user is typing in thread', async () => {
      const { container } = await renderComponent(
        { [otherUserId]: { parent_id, user: otherUserId } },
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
        { [otherUserId]: { parent_id, user: otherUserId } },
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
        { [otherUserId]: { user: otherUserId } },
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
        { example: { parent_id: 'sample-thread-2', user: otherUserId } },
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
