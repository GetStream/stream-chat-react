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

// MERGE-RECONCILE (test migration): PR #2909 rewrote TypingIndicator as a no-props component that
// reads typing users from `channel.messageComposer.textComposer.typing`, the channel from
// ChannelInstanceContext (via useChannel), the thread from ThreadContext, and the typing_events
// config from `client.configsStore`. The former TypingContext/ChannelStateContext providers and
// scrollToBottom/threadList props are gone. The visible text is now a visually-hidden
// `typing-indicator-status` live region whose content comes from `getTypingStatusMessage`
// ('{{ typing }} is typing' / '{{ typing }} are typing' / '{{ count }} people are typing'), so
// assertions match those keys plus the AvatarStack (capped at 3, with a "+N" overflow badge).
// (This replaces the stale TypingIndicator.test.js, whose JSX-in-.js content could not be parsed.)

const me = generateUser();

// Minimal StateStore stub compatible with useStateStore (getLatestValue + subscribeWithSelector).
const makeStore = (value: unknown) => ({
  getLatestValue: () => value,
  subscribeWithSelector: () => () => null,
});

// In thread mode the source reads typing users from the THREAD's own messageComposer.textComposer
// state and the parent message from thread.state, and resolves the channel config via
// messageComposer.channel.cid — so the thread stub carries a composer referencing the real channel.
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
  const channelConfig = value.channelConfig ?? channel.getConfig();

  client.configsStore.partialNext({
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
    // MERGE-RECONCILE: without a channel/client in context the component now throws while resolving
    // the message composer (useMessageComposerController) rather than from useChannel directly, so
    // we only assert that rendering throws.
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
      '{{ typing }} is typing',
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
      '{{ typing }} is typing',
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
      '{{ typing }} are typing',
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
      '{{ count }} people are typing',
    );
    // 3 foreign typers == AvatarStack cap, so all avatars render without an overflow badge.
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
      '{{ count }} people are typing',
    );
    // 4 foreign typers exceed the AvatarStack cap of 3 -> overflow badge for the remainder.
    expect(screen.getAllByTestId('avatar')).toHaveLength(3);
    expect(screen.getByTestId('avatar-stack-count-badge')).toHaveTextContent('+1');
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should render null if typing_events is disabled', async () => {
    // A foreign user IS typing (same setup that renders the indicator above), so a null render can
    // only be attributed to the disabled `typing_events` config — otherwise the test would pass
    // regardless of the config (e.g. simply because nobody is typing).
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
