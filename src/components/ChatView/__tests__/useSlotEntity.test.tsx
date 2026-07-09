import React from 'react';
import { StateStore } from 'stream-chat';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

import { ChannelSlot } from '../../Channel';
import { ChatView } from '../ChatView';
import { ThreadSlot } from '../../Thread';
import {
  getLayoutViewState,
  useSlotChannel,
  useSlotEntity,
  useSlotThread,
  useSlotTopLayerEntity,
} from '../hooks';

import { ChatProvider } from '../../../context/ChatContext';
import { TranslationProvider } from '../../../context/TranslationContext';
import { LayoutController } from '../layoutController/LayoutController';

import type { Channel as StreamChannel, Thread as StreamThread } from 'stream-chat';
import type { ChatContextValue } from '../../../context/ChatContext';

vi.mock('../../Channel/Channel', () => ({
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

vi.mock('../../Threads', () => ({
  ThreadProvider: ({ children }: { children?: React.ReactNode }) => (
    <>{children ?? null}</>
  ),
}));

vi.mock('../../Thread/Thread', () => ({
  Thread: () => <div data-testid='mocked-thread-component'>thread-component</div>,
}));

const makeChannel = (cid: string) => ({ cid }) as unknown as StreamChannel;
const makeThread = (id: string) => ({ id }) as unknown as StreamThread;

const createChatContextValue = (): ChatContextValue =>
  ({
    channelsQueryState: {
      error: null,
      queryInProgress: null,
      setError: vi.fn(),
      setQueryInProgress: vi.fn(),
    },
    client: {
      threads: {
        state: new StateStore({
          unreadThreadCount: 0,
        }),
      },
    },
    getAppSettings: vi.fn(() => null),
    latestMessageDatesByChannels: {},
    openMobileNav: vi.fn(),
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

    layoutController.bind('slot1', {
      key: `channel:${channelB.cid}`,
      payload: { key: channelB.cid, kind: 'channel', source: channelB },
    });
    layoutController.bind('slot2', {
      key: `channel:${channelA.cid}`,
      payload: { key: channelA.cid, kind: 'channel', source: channelA },
    });
    layoutController.bind('slot3', {
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

  it('resolves the top layer via useSlotTopLayerEntity without shadowing the base binding', () => {
    const thread = makeThread('thread-under-layer');

    const layoutController = new LayoutController({
      initialState: {
        availableSlots: ['slot1'],
      },
    });

    // Base binding: a thread. Layer on top: a member profile.
    layoutController.bind('slot1', {
      key: `thread:${thread.id}`,
      payload: { key: thread.id, kind: 'thread', source: thread },
    });
    layoutController.pushLayer('slot1', {
      key: 'userProfile:u1',
      payload: { key: 'userProfile:u1', kind: 'userProfile', source: { userId: 'u1' } },
    });

    const Harness = () => {
      const topProfile = useSlotTopLayerEntity({ kind: 'userProfile', slot: 'slot1' });
      // The base binding (thread) is unchanged — a layer never rewrites `slotBindings`.
      const baseThread = useSlotThread({ slot: 'slot1' });
      // Reading the profile as a base binding must NOT find it (it lives in the layer stack).
      const profileAsBase = useSlotEntity({ kind: 'userProfile', slot: 'slot1' });

      return (
        <>
          <div data-testid='top-profile'>{topProfile?.userId}</div>
          <div data-testid='base-thread'>{baseThread?.id}</div>
          <div data-testid='profile-as-base'>{profileAsBase?.userId ?? 'none'}</div>
        </>
      );
    };

    renderWithProviders(
      <ChatView layoutController={layoutController}>
        <Harness />
      </ChatView>,
    );

    expect(screen.getByTestId('top-profile')).toHaveTextContent('u1');
    expect(screen.getByTestId('base-thread')).toHaveTextContent('thread-under-layer');
    expect(screen.getByTestId('profile-as-base')).toHaveTextContent('none');
  });

  it('returns undefined from useSlotTopLayerEntity when the top layer kind does not match', () => {
    const layoutController = new LayoutController({
      initialState: {
        availableSlots: ['slot1'],
      },
    });

    layoutController.pushLayer('slot1', {
      key: 'userProfile:u2',
      payload: { key: 'userProfile:u2', kind: 'userProfile', source: { userId: 'u2' } },
    });

    const Harness = () => {
      const asThread = useSlotTopLayerEntity({ kind: 'thread', slot: 'slot1' });
      const asProfile = useSlotTopLayerEntity({ kind: 'userProfile', slot: 'slot1' });
      return (
        <>
          <div data-testid='as-thread'>{asThread ? 'match' : 'none'}</div>
          <div data-testid='as-profile'>{asProfile?.userId ?? 'none'}</div>
        </>
      );
    };

    renderWithProviders(
      <ChatView layoutController={layoutController}>
        <Harness />
      </ChatView>,
    );

    expect(screen.getByTestId('as-thread')).toHaveTextContent('none');
    expect(screen.getByTestId('as-profile')).toHaveTextContent('u2');
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

    layoutController.bind('slot2', {
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

    layoutController.bind('slot1', {
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
      expect(
        getLayoutViewState(layoutController.state.getLatestValue()).hiddenSlots.slot1,
      ).toBe(true);
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

    layoutController.bind('slot1', {
      key: `thread:${thread.id}`,
      payload: { key: thread.id, kind: 'thread', source: thread },
    });

    renderWithProviders(
      <ChatView layoutController={layoutController}>
        <ThreadSlot slot='slot1' />
      </ChatView>,
    );

    await waitFor(() => {
      expect(
        getLayoutViewState(layoutController.state.getLatestValue()).hiddenSlots.slot1,
      ).toBe(false);
    });
  });
});
