import React, { useEffect, useState } from 'react';
import { StateStore } from 'stream-chat';
import { act, fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

jest.mock('../../ChannelList', () => ({
  ChannelList: () => <div data-testid='channel-list'>ChannelList</div>,
  ChannelListSlot: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}));

jest.mock('../../Threads/ThreadList', () => ({
  ThreadList: () => <div data-testid='thread-list'>ThreadList</div>,
  ThreadListSlot: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}));

import {
  ChatView,
  createChatViewSlotBinding,
  getChatViewEntityBinding,
  useChatViewContext,
} from '../ChatView';

import { ChatProvider } from '../../../context/ChatContext';
import { TranslationProvider } from '../../../context/TranslationContext';
import { ChannelListSlot } from '../../ChannelList';
import { ThreadListSlot } from '../../Threads/ThreadList';
import { LayoutController } from '../layoutController/LayoutController';

import type { Channel as StreamChannel, Thread as StreamThread } from 'stream-chat';
import type { ChatContextValue } from '../../../context/ChatContext';
import type { LayoutController } from '../layoutController/layoutControllerTypes';

const makeChannel = (cid: string) => ({ cid }) as unknown as StreamChannel;

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

describe('ChatView', () => {
  it('switches from threads to channels and opens channel in slot via layoutController', () => {
    const channel = makeChannel('messaging:target');
    let capturedController: LayoutController | undefined;

    const ViewReplyInChannelAction = () => {
      const { activeView, layoutController } = useChatViewContext();
      capturedController = layoutController;

      return (
        <>
          <div data-testid='active-view'>{activeView}</div>
          <button onClick={() => layoutController.setActiveView('threads')} type='button'>
            enter-threads
          </button>
          <button
            onClick={() => {
              layoutController.setActiveView('channels');
              layoutController.openInLayout(
                createChatViewSlotBinding({
                  key: channel.cid ?? undefined,
                  kind: 'channel',
                  source: channel,
                }),
                { activate: true },
              );
            }}
            type='button'
          >
            view-in-channel
          </button>
        </>
      );
    };

    renderWithProviders(
      <ChatView maxSlots={1}>
        <ViewReplyInChannelAction />
      </ChatView>,
    );

    fireEvent.click(screen.getByText('enter-threads'));
    expect(screen.getByTestId('active-view')).toHaveTextContent('threads');

    fireEvent.click(screen.getByText('view-in-channel'));
    expect(screen.getByTestId('active-view')).toHaveTextContent('channels');
    expect(
      getChatViewEntityBinding(
        capturedController?.state.getLatestValue().slotBindings.slot1,
      )?.kind,
    ).toBe('channel');
  });

  it('clears channel/thread bindings in the view being left when switching view', () => {
    const channel = makeChannel('messaging:leave-view');
    const threadBinding = createChatViewSlotBinding({
      key: 'thread-1',
      kind: 'thread',
      source: { id: 'thread-1' } as unknown as StreamThread,
    });
    const layoutController = new LayoutController({
      initialState: {
        activeView: 'channels',
        availableSlots: ['slot1', 'slot2'],
        slotBindings: {
          slot1: createChatViewSlotBinding({
            key: channel.cid ?? undefined,
            kind: 'channel',
            source: channel,
          }),
          slot2: threadBinding,
        },
      },
    });

    const Harness = () => {
      const { setActiveView } = useChatViewContext();
      return (
        <button onClick={() => setActiveView('threads')} type='button'>
          switch-to-threads
        </button>
      );
    };

    renderWithProviders(
      <ChatView layoutController={layoutController}>
        <Harness />
      </ChatView>,
    );

    fireEvent.click(screen.getByText('switch-to-threads'));

    const state = layoutController.state.getLatestValue();
    expect(state.slotBindingsByView?.channels?.slot1).toBeUndefined();
    expect(state.slotBindingsByView?.channels?.slot2).toBeUndefined();
  });

  it('renders built-in workspace layout with slotRenderers', () => {
    const channel = makeChannel('messaging:workspace');
    const layoutController = new LayoutController({
      initialState: {
        availableSlots: ['slot1', 'slot2'],
      },
    });
    layoutController.openInLayout(
      createChatViewSlotBinding({
        key: channel.cid ?? undefined,
        kind: 'channel',
        source: channel,
      }),
    );

    renderWithProviders(
      <ChatView
        layout='nav-rail-entity-list-workspace'
        layoutController={layoutController}
        slotRenderers={{
          channel: ({ source }) => <div data-testid='channel-slot'>{source.cid}</div>,
        }}
      />,
    );

    expect(screen.getByTestId('channel-list')).toBeInTheDocument();
    expect(screen.getByTestId('channel-slot')).toHaveTextContent('messaging:workspace');
  });

  it('renders fallback workspace content when minSlots reserves an empty slot', () => {
    renderWithProviders(
      <ChatView layout='nav-rail-entity-list-workspace' maxSlots={2} minSlots={2} />,
    );

    expect(screen.getByTestId('channel-list')).toBeInTheDocument();
    expect(screen.getByText('Select a channel to start messaging')).toBeInTheDocument();
  });

  it('keeps channelList slot mounted when hidden/unhidden', () => {
    const layoutController = new LayoutController({
      initialState: {
        availableSlots: ['slot1', 'slot2'],
      },
    });

    const StatefulChannelList = () => {
      const [count, setCount] = useState(0);

      return (
        <button
          data-testid='channel-list-counter'
          onClick={() => setCount((value) => value + 1)}
          type='button'
        >
          {count}
        </button>
      );
    };

    const { container } = renderWithProviders(
      <ChatView
        layout='nav-rail-entity-list-workspace'
        layoutController={layoutController}
        maxSlots={2}
        minSlots={2}
        slotRenderers={{
          channelList: () => <StatefulChannelList />,
        }}
      />,
    );

    fireEvent.click(screen.getByTestId('channel-list-counter'));
    expect(screen.getByTestId('channel-list-counter')).toHaveTextContent('1');

    act(() => {
      layoutController.hide('slot1');
    });
    expect(
      container.querySelector('[data-slot="slot1"].str-chat__chat-view__slot--hidden'),
    ).toBeInTheDocument();

    act(() => {
      layoutController.unhide('slot1');
    });
    expect(screen.getByTestId('channel-list-counter')).toHaveTextContent('1');
  });

  it('preserves custom children layout when built-in layout is not set', () => {
    const Child = () => {
      const { layoutController } = useChatViewContext();

      useEffect(() => {
        const channel = makeChannel('messaging:custom');
        layoutController.openInLayout(
          createChatViewSlotBinding({
            key: channel.cid ?? undefined,
            kind: 'channel',
            source: channel,
          }),
        );
      }, [layoutController]);

      return <div data-testid='custom-layout'>custom-layout</div>;
    };

    renderWithProviders(
      <ChatView maxSlots={1}>
        <Child />
      </ChatView>,
    );

    expect(screen.getByTestId('custom-layout')).toBeInTheDocument();
  });

  it('binds list slot in ChannelListSlot and renders content in that slot', () => {
    const layoutController = new LayoutController({
      initialState: {
        availableSlots: ['slot1', 'slot2'],
      },
    });

    const { container } = renderWithProviders(
      <ChatView layoutController={layoutController}>
        <ChatView.Channels>
          <ChannelListSlot>
            <div data-testid='channels-list-pane'>list</div>
          </ChannelListSlot>
          <div data-testid='channels-workspace'>workspace</div>
        </ChatView.Channels>
      </ChatView>,
    );

    expect(
      getChatViewEntityBinding(
        layoutController.state.getLatestValue().slotBindings.slot1,
      ),
    ).toMatchObject({
      kind: 'channelList',
      source: { view: 'channels' },
    });
    expect(
      container.querySelector('[data-slot="slot1"] [data-testid="channels-list-pane"]'),
    ).toBeInTheDocument();
    expect(screen.getByTestId('channels-workspace')).toBeInTheDocument();
  });

  it('initializes available slots from slotNames and minSlots', () => {
    let capturedController: LayoutController | undefined;

    const Harness = () => {
      const { layoutController } = useChatViewContext();
      capturedController = layoutController;
      return null;
    };

    renderWithProviders(
      <ChatView maxSlots={3} minSlots={2} slotNames={['list', 'main', 'thread']}>
        <Harness />
      </ChatView>,
    );

    expect(capturedController?.state.getLatestValue()).toMatchObject({
      availableSlots: ['list', 'main'],
      maxSlots: 3,
      minSlots: 2,
      slotNames: ['list', 'main', 'thread'],
    });
  });

  it('uses ChatView.Channels slots order when channels view is active', () => {
    let capturedController: LayoutController | undefined;

    const Harness = () => {
      const { layoutController } = useChatViewContext();
      capturedController = layoutController;
      return null;
    };

    renderWithProviders(
      <ChatView maxSlots={3} minSlots={3}>
        <Harness />
        <ChatView.Channels slots={['slot3', 'slot1', 'slot2']}>
          <div />
        </ChatView.Channels>
      </ChatView>,
    );

    expect(capturedController?.state.getLatestValue().availableSlots).toEqual([
      'slot3',
      'slot1',
      'slot2',
    ]);
  });

  it('switches availableSlots order according to active view slots props', () => {
    let capturedController: LayoutController | undefined;

    const Harness = () => {
      const { layoutController, setActiveView } = useChatViewContext();
      capturedController = layoutController;

      return (
        <button onClick={() => setActiveView('threads')} type='button'>
          show-threads
        </button>
      );
    };

    renderWithProviders(
      <ChatView maxSlots={3} minSlots={3}>
        <Harness />
        <ChatView.Channels slots={['slot1', 'slot2', 'slot3']}>
          <div />
        </ChatView.Channels>
        <ChatView.Threads slots={['slot3', 'slot2', 'slot1']}>
          <div />
        </ChatView.Threads>
      </ChatView>,
    );

    expect(capturedController?.state.getLatestValue().availableSlots).toEqual([
      'slot1',
      'slot2',
      'slot3',
    ]);

    fireEvent.click(screen.getByText('show-threads'));

    expect(capturedController?.state.getLatestValue().availableSlots).toEqual([
      'slot3',
      'slot2',
      'slot1',
    ]);
  });

  it('claims requested slot when ChannelListSlot slot prop is provided', () => {
    const layoutController = new LayoutController({
      initialState: {
        availableSlots: ['slot1', 'slot2'],
      },
    });

    const { container } = renderWithProviders(
      <ChatView layoutController={layoutController}>
        <ChatView.Channels>
          <ChannelListSlot slot='slot2'>
            <div data-testid='channels-list-pane'>list</div>
          </ChannelListSlot>
          <div data-testid='channels-workspace'>workspace</div>
        </ChatView.Channels>
      </ChatView>,
    );

    expect(
      getChatViewEntityBinding(
        layoutController.state.getLatestValue().slotBindings.slot2,
      ),
    ).toMatchObject({
      kind: 'channelList',
      source: { view: 'channels' },
    });
    expect(
      container.querySelector('[data-slot="slot2"] [data-testid="channels-list-pane"]'),
    ).toBeInTheDocument();
  });

  it('falls back to first available slot when ChannelListSlot slot is not visible', () => {
    const layoutController = new LayoutController({
      initialState: {
        availableSlots: ['slot1'],
      },
    });

    const { container } = renderWithProviders(
      <ChatView layoutController={layoutController}>
        <ChatView.Channels>
          <ChannelListSlot slot='slot2'>
            <div data-testid='channels-list-pane'>list</div>
          </ChannelListSlot>
          <div data-testid='channels-workspace'>workspace</div>
        </ChatView.Channels>
      </ChatView>,
    );

    expect(
      getChatViewEntityBinding(
        layoutController.state.getLatestValue().slotBindings.slot1,
      ),
    ).toMatchObject({
      kind: 'channelList',
      source: { view: 'channels' },
    });
    expect(
      container.querySelector('[data-slot="slot1"] [data-testid="channels-list-pane"]'),
    ).toBeInTheDocument();
  });

  it('binds list slot in ThreadListSlot inside ChatView.Threads', () => {
    const layoutController = new LayoutController({
      initialState: {
        activeView: 'threads',
        availableSlots: ['slot1', 'slot2'],
      },
    });

    const { container } = renderWithProviders(
      <ChatView layoutController={layoutController}>
        <ChatView.Threads>
          <ThreadListSlot slot='slot1'>
            <div data-testid='threads-list-pane'>list</div>
          </ThreadListSlot>
          <div data-testid='threads-workspace'>workspace</div>
        </ChatView.Threads>
      </ChatView>,
    );

    expect(
      getChatViewEntityBinding(
        layoutController.state.getLatestValue().slotBindings.slot1,
      ),
    ).toMatchObject({
      kind: 'threadList',
      source: { view: 'threads' },
    });
    expect(
      container.querySelector('[data-slot="slot1"] [data-testid="threads-list-pane"]'),
    ).toBeInTheDocument();
    expect(screen.getByTestId('threads-workspace')).toBeInTheDocument();
  });
});
