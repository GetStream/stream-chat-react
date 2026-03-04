import React, { useEffect, useState } from 'react';
import { StateStore } from 'stream-chat';
import { act, fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

jest.mock('../../ChannelList', () => ({
  ChannelList: () => <div data-testid='channel-list'>ChannelList</div>,
}));

jest.mock('../../Threads/ThreadList', () => ({
  ThreadList: () => <div data-testid='thread-list'>ThreadList</div>,
}));

import { ChatView, useChatViewContext } from '../ChatView';

import { ChatProvider } from '../../../context/ChatContext';
import { TranslationProvider } from '../../../context/TranslationContext';
import { createLayoutController } from '../layoutController/LayoutController';

import type { Channel as StreamChannel } from 'stream-chat';
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
              layoutController.openChannel(channel, { activate: true });
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
    expect(capturedController?.state.getLatestValue().slotBindings.slot1?.kind).toBe(
      'channel',
    );
  });

  it('renders built-in workspace layout with slotRenderers', () => {
    const channel = makeChannel('messaging:workspace');
    const layoutController = createLayoutController({
      initialState: {
        visibleSlots: ['slot1'],
      },
    });
    layoutController.openChannel(channel);

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
    const layoutController = createLayoutController({
      initialState: {
        visibleSlots: ['slot1', 'slot2'],
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
      layoutController.setEntityListPaneOpen(false);
    });
    expect(
      container.querySelector(
        '.str-chat__chat-view__workspace-layout-entity-list-pane.str-chat__chat-view__slot--hidden',
      ),
    ).toBeInTheDocument();

    act(() => {
      layoutController.setEntityListPaneOpen(true);
    });
    expect(screen.getByTestId('channel-list-counter')).toHaveTextContent('1');
  });

  it('preserves custom children layout when built-in layout is not set', () => {
    const Child = () => {
      const { layoutController } = useChatViewContext();

      useEffect(() => {
        layoutController.openChannel(makeChannel('messaging:custom'));
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
});
