import React from 'react';
import { StateStore } from 'stream-chat';
import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import { ChatView, useChatViewContext } from '../ChatView';
import { useChatViewNavigation } from '../ChatViewNavigationContext';

import { ChatProvider } from '../../../context/ChatContext';
import { TranslationProvider } from '../../../context/TranslationContext';

import type { Channel as StreamChannel, Thread as StreamThread } from 'stream-chat';
import type { ChatContextValue } from '../../../context/ChatContext';
import type { LayoutController } from '../layoutController/layoutControllerTypes';

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
    closeMobileNav: jest.fn(),
    getAppSettings: jest.fn(() => null),
    latestMessageDatesByChannels: {},
    openMobileNav: jest.fn(),
    searchController: {},
    setActiveChannel: jest.fn(),
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

describe('useChatViewNavigation', () => {
  it('supports open/close thread flow with one-slot history restoration', () => {
    const channel = makeChannel('messaging:navigation');
    const thread = makeThread('thread-navigation');
    let capturedController: LayoutController | undefined;

    const Harness = () => {
      const navigation = useChatViewNavigation();
      const { layoutController } = useChatViewContext();
      capturedController = layoutController;

      return (
        <>
          <button onClick={() => navigation.openChannel(channel)} type='button'>
            open-channel
          </button>
          <button onClick={() => navigation.openThread(thread)} type='button'>
            open-thread
          </button>
          <button onClick={() => navigation.closeThread()} type='button'>
            close-thread
          </button>
        </>
      );
    };

    renderWithProviders(
      <ChatView maxSlots={1}>
        <Harness />
      </ChatView>,
    );

    fireEvent.click(screen.getByText('open-channel'));
    expect(capturedController?.state.getLatestValue()).toMatchObject({
      activeView: 'channels',
      slotBindings: {
        slot1: { kind: 'channel' },
      },
    });

    fireEvent.click(screen.getByText('open-thread'));
    expect(capturedController?.state.getLatestValue()).toMatchObject({
      activeView: 'threads',
      slotBindings: {
        slot1: { kind: 'thread' },
      },
      slotHistory: {
        slot1: [{ kind: 'channel' }],
      },
    });

    fireEvent.click(screen.getByText('close-thread'));
    expect(capturedController?.state.getLatestValue()).toMatchObject({
      activeView: 'threads',
      slotBindings: {
        slot1: { kind: 'channel' },
      },
      slotHistory: {},
    });
  });

  it('hides and unhides channelList slot without requiring existing binding', () => {
    let capturedController: LayoutController | undefined;

    const Harness = () => {
      const navigation = useChatViewNavigation();
      const { layoutController } = useChatViewContext();
      capturedController = layoutController;

      return (
        <>
          <button
            onClick={() => navigation.hideChannelList({ slot: 'slot1' })}
            type='button'
          >
            hide-list
          </button>
          <button
            onClick={() => navigation.unhideChannelList({ slot: 'slot1' })}
            type='button'
          >
            unhide-list
          </button>
        </>
      );
    };

    renderWithProviders(
      <ChatView maxSlots={1}>
        <Harness />
      </ChatView>,
    );

    fireEvent.click(screen.getByText('hide-list'));
    expect(capturedController?.state.getLatestValue()).toMatchObject({
      entityListPaneOpen: false,
      hiddenSlots: {
        slot1: true,
      },
    });

    fireEvent.click(screen.getByText('unhide-list'));
    expect(capturedController?.state.getLatestValue()).toMatchObject({
      entityListPaneOpen: true,
      hiddenSlots: {
        slot1: false,
      },
      slotBindings: {
        slot1: {
          key: 'channel-list',
          kind: 'channelList',
          source: { view: 'channels' },
        },
      },
    });
  });

  it('openView can activate provided slot', () => {
    let capturedController: LayoutController | undefined;

    const Harness = () => {
      const navigation = useChatViewNavigation();
      const { layoutController } = useChatViewContext();
      capturedController = layoutController;

      return (
        <button
          onClick={() => navigation.openView('threads', { slot: 'slot2' })}
          type='button'
        >
          open-threads-slot2
        </button>
      );
    };

    renderWithProviders(
      <ChatView maxSlots={2} minSlots={2}>
        <Harness />
      </ChatView>,
    );

    fireEvent.click(screen.getByText('open-threads-slot2'));
    expect(capturedController?.state.getLatestValue()).toMatchObject({
      activeSlot: 'slot2',
      activeView: 'threads',
    });
  });
});
