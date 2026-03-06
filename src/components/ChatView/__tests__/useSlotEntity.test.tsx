import React from 'react';
import { StateStore } from 'stream-chat';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

import { ChannelSlot } from '../../Channel';
import { ChatView, getChatViewEntityBinding } from '../ChatView';
import { ThreadSlot } from '../../Thread';
import { useSlotChannel, useSlotEntity, useSlotThread } from '../hooks';

import { ChatProvider } from '../../../context/ChatContext';
import { TranslationProvider } from '../../../context/TranslationContext';
import { LayoutController } from '../layoutController/LayoutController';

import type { Channel as StreamChannel, Thread as StreamThread } from 'stream-chat';
import type { ChatContextValue } from '../../../context/ChatContext';

jest.mock('../../Channel/Channel', () => ({
  Channel: ({
    channel,
    children,
  }: {
    channel: StreamChannel;
    children?: React.ReactNode;
  }) => (
    <div data-testid='mocked-channel'>
      {channel.cid}
      {children}
    </div>
  ),
}));

jest.mock('../../Threads', () => ({
  ThreadProvider: ({ children }: { children?: React.ReactNode }) => (
    <>{children ?? null}</>
  ),
}));

jest.mock('../../Thread/Thread', () => ({
  Thread: () => <div data-testid='mocked-thread-component'>thread-component</div>,
}));

const makeChannel = (cid: string) => ({ cid }) as unknown as StreamChannel;
const makeThread = (id: string) => ({ id }) as unknown as StreamThread;

const createChatContextValue = (): ChatContextValue =>
  ({
    channelsQueryState: {
      error: null,
      queryInProgress: null,
      setError: jest.fn(),
      setQueryInProgress: jest.fn(),
    },
    client: {
      threads: {
        state: new StateStore({
          unreadThreadCount: 0,
        }),
      },
    },
    getAppSettings: jest.fn(() => null),
    latestMessageDatesByChannels: {},
    openMobileNav: jest.fn(),
    searchController: {},
    theme: 'str-chat__theme-light',
    useImageFlagEmojisOnWindows: false,
  }) as unknown as ChatContextValue;

const renderWithProviders = (ui: React.ReactNode) =>
  render(
    <ChatProvider value={createChatContextValue()}>
      <TranslationProvider value={{ t: (key: string) => key, userLanguage: 'en' }}>
        {ui}
      </TranslationProvider>
    </ChatProvider>,
  );

describe('useSlotEntity hooks', () => {
  it('resolves first matching entity from availableSlots and supports explicit slot', () => {
    const channelA = makeChannel('messaging:active');
    const channelB = makeChannel('messaging:secondary');
    const thread = makeThread('thread-1');

    const layoutController = new LayoutController({
      initialState: {
        availableSlots: ['slot1', 'slot2', 'slot3'],
      },
    });

    layoutController.setSlotBinding('slot1', {
      key: `channel:${channelB.cid}`,
      payload: { key: channelB.cid, kind: 'channel', source: channelB },
    });
    layoutController.setSlotBinding('slot2', {
      key: `channel:${channelA.cid}`,
      payload: { key: channelA.cid, kind: 'channel', source: channelA },
    });
    layoutController.setSlotBinding('slot3', {
      key: `thread:${thread.id}`,
      payload: { key: thread.id, kind: 'thread', source: thread },
    });

    const Harness = () => {
      const channel = useSlotEntity({ kind: 'channel' });
      const channelInSlot1 = useSlotChannel({ slot: 'slot1' });
      const resolvedThread = useSlotThread();

      return (
        <>
          <div data-testid='resolved-channel'>{channel?.cid}</div>
          <div data-testid='resolved-channel-slot1'>{channelInSlot1?.cid}</div>
          <div data-testid='resolved-thread'>{resolvedThread?.id}</div>
        </>
      );
    };

    renderWithProviders(
      <ChatView layoutController={layoutController}>
        <Harness />
      </ChatView>,
    );

    expect(screen.getByTestId('resolved-channel')).toHaveTextContent(
      'messaging:secondary',
    );
    expect(screen.getByTestId('resolved-channel-slot1')).toHaveTextContent(
      'messaging:secondary',
    );
    expect(screen.getByTestId('resolved-thread')).toHaveTextContent('thread-1');
  });
});

describe('slot adapters', () => {
  it('renders ChannelSlot fallback when no channel entity is bound', () => {
    const layoutController = new LayoutController({
      initialState: {
        availableSlots: ['slot1'],
      },
    });

    renderWithProviders(
      <ChatView layoutController={layoutController}>
        <ChannelSlot fallback={<div data-testid='channel-fallback'>no-channel</div>} />
      </ChatView>,
    );

    expect(screen.getByTestId('channel-fallback')).toBeInTheDocument();
  });

  it('renders ChannelSlot with the channel bound to explicit slot', () => {
    const channel = makeChannel('messaging:slot2');
    const layoutController = new LayoutController({
      initialState: {
        availableSlots: ['slot1', 'slot2'],
      },
    });

    layoutController.setSlotBinding('slot2', {
      key: `channel:${channel.cid}`,
      payload: { key: channel.cid, kind: 'channel', source: channel },
    });

    renderWithProviders(
      <ChatView layoutController={layoutController}>
        <ChannelSlot slot='slot2'>
          <div data-testid='channel-child'>child</div>
        </ChannelSlot>
      </ChatView>,
    );

    expect(screen.getByTestId('mocked-channel')).toHaveTextContent('messaging:slot2');
    expect(screen.getByTestId('channel-child')).toBeInTheDocument();
  });

  it('claims explicit slot for ChannelSlot by moving an existing channel binding', () => {
    const channel = makeChannel('messaging:move-channel');
    const layoutController = new LayoutController({
      initialState: {
        availableSlots: ['slot1', 'slot2'],
      },
    });

    layoutController.setSlotBinding('slot2', {
      key: `channel:${channel.cid}`,
      payload: { key: channel.cid, kind: 'channel', source: channel },
    });

    renderWithProviders(
      <ChatView layoutController={layoutController}>
        <ChannelSlot slot='slot1' />
      </ChatView>,
    );

    expect(
      getChatViewEntityBinding(
        layoutController.state.getLatestValue().slotBindings.slot1,
      ),
    ).toMatchObject({
      kind: 'channel',
      source: channel,
    });
  });

  it('renders ThreadSlot fallback when no thread entity is bound', () => {
    const layoutController = new LayoutController({
      initialState: {
        availableSlots: ['slot1'],
      },
    });

    renderWithProviders(
      <ChatView layoutController={layoutController}>
        <ThreadSlot fallback={<div data-testid='thread-fallback'>no-thread</div>} />
      </ChatView>,
    );

    expect(screen.getByTestId('thread-fallback')).toBeInTheDocument();
  });

  it('renders ThreadSlot with bound thread using default Thread component', () => {
    const thread = makeThread('thread-slot');
    const layoutController = new LayoutController({
      initialState: {
        availableSlots: ['slot1'],
      },
    });

    layoutController.setSlotBinding('slot1', {
      key: `thread:${thread.id}`,
      payload: { key: thread.id, kind: 'thread', source: thread },
    });

    renderWithProviders(
      <ChatView layoutController={layoutController}>
        <ThreadSlot />
      </ChatView>,
    );

    expect(screen.getByTestId('mocked-thread-component')).toBeInTheDocument();
  });

  it('claims explicit slot for ThreadSlot by moving an existing thread binding', () => {
    const thread = makeThread('thread-move');
    const layoutController = new LayoutController({
      duplicateEntityPolicy: 'move',
      initialState: {
        availableSlots: ['slot1', 'slot2'],
      },
    });

    layoutController.setSlotBinding('slot2', {
      key: `thread:${thread.id}`,
      payload: { key: thread.id, kind: 'thread', source: thread },
    });

    renderWithProviders(
      <ChatView layoutController={layoutController}>
        <ThreadSlot hideIfEmpty={false} slot='slot1' />
      </ChatView>,
    );

    expect(
      getChatViewEntityBinding(
        layoutController.state.getLatestValue().slotBindings.slot1,
      ),
    ).toMatchObject({
      kind: 'thread',
      source: thread,
    });
  });

  it('hides explicit slot when ThreadSlot has no thread', async () => {
    const layoutController = new LayoutController({
      initialState: {
        availableSlots: ['slot1'],
        hiddenSlots: { slot1: false },
      },
    });

    renderWithProviders(
      <ChatView layoutController={layoutController}>
        <ThreadSlot slot='slot1' />
      </ChatView>,
    );

    await waitFor(() => {
      expect(layoutController.state.getLatestValue().hiddenSlots.slot1).toBe(true);
    });
  });

  it('unhides explicit slot when ThreadSlot has a bound thread', async () => {
    const thread = makeThread('thread-visible');
    const layoutController = new LayoutController({
      initialState: {
        availableSlots: ['slot1'],
        hiddenSlots: { slot1: true },
      },
    });

    layoutController.setSlotBinding('slot1', {
      key: `thread:${thread.id}`,
      payload: { key: thread.id, kind: 'thread', source: thread },
    });

    renderWithProviders(
      <ChatView layoutController={layoutController}>
        <ThreadSlot slot='slot1' />
      </ChatView>,
    );

    await waitFor(() => {
      expect(layoutController.state.getLatestValue().hiddenSlots.slot1).toBe(false);
    });
  });
});
