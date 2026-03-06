import React from 'react';
import { StateStore } from 'stream-chat';
import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import { ChatView, useChatViewContext } from '../ChatView';
import { getChatViewEntityBinding } from '../ChatView';
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

describe('useChatViewNavigation', () => {
  it('supports open/close thread flow where close clears thread slot state', () => {
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
    const openChannelState = capturedController?.state.getLatestValue();
    expect(openChannelState?.activeView).toBe('channels');
    expect(getChatViewEntityBinding(openChannelState?.slotBindings.slot1)?.kind).toBe(
      'channel',
    );

    fireEvent.click(screen.getByText('open-thread'));
    const openThreadState = capturedController?.state.getLatestValue();
    expect(openThreadState?.activeView).toBe('channels');
    expect(getChatViewEntityBinding(openThreadState?.slotBindings.slot1)?.kind).toBe(
      'thread',
    );
    expect(getChatViewEntityBinding(openThreadState?.slotHistory.slot1?.[0])?.kind).toBe(
      'channel',
    );

    fireEvent.click(screen.getByText('close-thread'));
    const closeThreadState = capturedController?.state.getLatestValue();
    expect(closeThreadState?.activeView).toBe('channels');
    expect(closeThreadState?.slotBindings.slot1).toBeUndefined();
    expect(closeThreadState?.slotHistory).toEqual({});
    expect(closeThreadState?.slotForwardHistory).toEqual({});
  });

  it('closes thread when opening a new channel', () => {
    const channelA = makeChannel('messaging:channel-a');
    const channelB = makeChannel('messaging:channel-b');
    const thread = makeThread('thread-navigation-switch');
    let capturedController: LayoutController | undefined;

    const Harness = () => {
      const navigation = useChatViewNavigation();
      const { layoutController } = useChatViewContext();
      capturedController = layoutController;

      return (
        <>
          <button onClick={() => navigation.openChannel(channelA)} type='button'>
            open-channel-a
          </button>
          <button onClick={() => navigation.openThread(thread)} type='button'>
            open-thread
          </button>
          <button onClick={() => navigation.openChannel(channelB)} type='button'>
            open-channel-b
          </button>
        </>
      );
    };

    renderWithProviders(
      <ChatView maxSlots={1}>
        <Harness />
      </ChatView>,
    );

    fireEvent.click(screen.getByText('open-channel-a'));
    fireEvent.click(screen.getByText('open-thread'));
    expect(
      getChatViewEntityBinding(
        capturedController?.state.getLatestValue()?.slotBindings.slot1,
      )?.kind,
    ).toBe('thread');

    fireEvent.click(screen.getByText('open-channel-b'));
    const stateAfterSecondChannelOpen = capturedController?.state.getLatestValue();
    expect(
      getChatViewEntityBinding(stateAfterSecondChannelOpen?.slotBindings.slot1)?.kind,
    ).toBe('channel');
    expect(
      getChatViewEntityBinding(stateAfterSecondChannelOpen?.slotBindings.slot1)?.source,
    ).toBe(channelB);
    expect(stateAfterSecondChannelOpen?.slotHistory).toEqual({});
    expect(stateAfterSecondChannelOpen?.slotForwardHistory).toEqual({});
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
      hiddenSlots: {
        slot1: true,
      },
    });

    fireEvent.click(screen.getByText('unhide-list'));
    const unhiddenState = capturedController?.state.getLatestValue();
    expect(unhiddenState?.hiddenSlots.slot1).toBe(false);
    expect(getChatViewEntityBinding(unhiddenState?.slotBindings.slot1)).toMatchObject({
      key: 'channel-list',
      kind: 'channelList',
      source: { view: 'channels' },
    });
  });

  it('openView updates activeView', () => {
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
      activeView: 'threads',
    });
  });

  it('openThread expands available slots up to maxSlots before replacing occupied slot', () => {
    const channel = makeChannel('messaging:expand-channel');
    const thread = makeThread('thread-expand');
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
        </>
      );
    };

    renderWithProviders(
      <ChatView maxSlots={3} minSlots={2}>
        <Harness />
      </ChatView>,
    );

    fireEvent.click(screen.getByText('open-channel'));
    fireEvent.click(screen.getByText('open-thread'));

    const openThreadState = capturedController?.state.getLatestValue();
    expect(openThreadState?.availableSlots).toEqual(['slot1', 'slot2', 'slot3']);
    expect(getChatViewEntityBinding(openThreadState?.slotBindings.slot2)?.kind).toBe(
      'channel',
    );
    expect(getChatViewEntityBinding(openThreadState?.slotBindings.slot3)?.kind).toBe(
      'thread',
    );
  });

  it('openThread uses configured slotNames for expansion', () => {
    const channel = makeChannel('messaging:expand-named');
    const thread = makeThread('thread-expand-named');
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
        </>
      );
    };

    renderWithProviders(
      <ChatView maxSlots={3} minSlots={2} slotNames={['list', 'main', 'thread']}>
        <Harness />
      </ChatView>,
    );

    fireEvent.click(screen.getByText('open-channel'));
    fireEvent.click(screen.getByText('open-thread'));

    const openThreadState = capturedController?.state.getLatestValue();
    expect(openThreadState?.availableSlots).toEqual(['list', 'main', 'thread']);
    expect(getChatViewEntityBinding(openThreadState?.slotBindings.main)?.kind).toBe(
      'channel',
    );
    expect(getChatViewEntityBinding(openThreadState?.slotBindings.thread)?.kind).toBe(
      'thread',
    );
  });
});
