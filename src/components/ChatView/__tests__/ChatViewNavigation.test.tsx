import React from 'react';
import { StateStore } from 'stream-chat';
import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import { ChatView, useChatViewContext } from '../ChatView';
import { getChatViewEntityBinding } from '../ChatView';
import { useChatViewNavigation } from '../ChatViewNavigationContext';
import { getLayoutViewState } from '../hooks';

import { ChatProvider } from '../../../context/ChatContext';
import { TranslationProvider } from '../../../context/TranslationContext';

import type { Channel as StreamChannel, Thread as StreamThread } from 'stream-chat';
import type { ChatContextValue } from '../../../context/ChatContext';
import type { LayoutController } from '../layoutController/layoutControllerTypes';

const makeChannel = (cid: string) => ({ cid }) as unknown as StreamChannel;
const makeThread = (id: string) => ({ id }) as unknown as StreamThread;

// D7 — active-view slot state lives under `layouts[activeView]`; project it (plus the
// top-level `activeView`) into one object so assertions can read both.
const viewState = (controller?: LayoutController | null) => {
  if (!controller) return undefined;
  const state = controller.state.getLatestValue();
  return { ...getLayoutViewState(state), activeView: state.activeView };
};

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
          <button
            onClick={() =>
              navigation.open({
                key: channel.cid ?? undefined,
                kind: 'channel',
                source: channel,
              })
            }
            type='button'
          >
            open-channel
          </button>
          <button
            onClick={() =>
              navigation.open({
                key: thread.id ?? undefined,
                kind: 'thread',
                source: thread,
              })
            }
            type='button'
          >
            open-thread
          </button>
          <button onClick={() => navigation.close('slot1')} type='button'>
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
    const openChannelState = viewState(capturedController);
    expect(openChannelState?.activeView).toBe('channels');
    expect(getChatViewEntityBinding(openChannelState?.slotBindings.slot1)?.kind).toBe(
      'channel',
    );

    fireEvent.click(screen.getByText('open-thread'));
    const openThreadState = viewState(capturedController);
    expect(openThreadState?.activeView).toBe('channels');
    expect(getChatViewEntityBinding(openThreadState?.slotBindings.slot1)?.kind).toBe(
      'thread',
    );
    expect(getChatViewEntityBinding(openThreadState?.slotHistory.slot1?.[0])?.kind).toBe(
      'channel',
    );

    fireEvent.click(screen.getByText('close-thread'));
    const closeThreadState = viewState(capturedController);
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
          <button
            onClick={() =>
              navigation.open({
                key: channelA.cid ?? undefined,
                kind: 'channel',
                source: channelA,
              })
            }
            type='button'
          >
            open-channel-a
          </button>
          <button
            onClick={() =>
              navigation.open({
                key: thread.id ?? undefined,
                kind: 'thread',
                source: thread,
              })
            }
            type='button'
          >
            open-thread
          </button>
          <button
            onClick={() =>
              navigation.open({
                key: channelB.cid ?? undefined,
                kind: 'channel',
                source: channelB,
              })
            }
            type='button'
          >
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
      getChatViewEntityBinding(viewState(capturedController)?.slotBindings.slot1)?.kind,
    ).toBe('thread');

    fireEvent.click(screen.getByText('open-channel-b'));
    const stateAfterSecondChannelOpen = viewState(capturedController);
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
          <button onClick={() => navigation.hide('slot1')} type='button'>
            hide-list
          </button>
          <button onClick={() => navigation.unhide('slot1')} type='button'>
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
    expect(viewState(capturedController)).toMatchObject({
      hiddenSlots: {
        slot1: true,
      },
    });

    fireEvent.click(screen.getByText('unhide-list'));
    expect(viewState(capturedController)?.hiddenSlots.slot1).toBe(false);
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
    expect(viewState(capturedController)).toMatchObject({
      activeView: 'threads',
    });
  });

  it('opens a thread into the next free slot alongside an open channel', () => {
    const channel = makeChannel('messaging:expand-channel');
    const thread = makeThread('thread-expand');
    let capturedController: LayoutController | undefined;

    const Harness = () => {
      const navigation = useChatViewNavigation();
      const { layoutController } = useChatViewContext();
      capturedController = layoutController;

      return (
        <>
          <button
            onClick={() =>
              navigation.open({
                key: channel.cid ?? undefined,
                kind: 'channel',
                source: channel,
              })
            }
            type='button'
          >
            open-channel
          </button>
          <button
            onClick={() =>
              navigation.open({
                key: thread.id ?? undefined,
                kind: 'thread',
                source: thread,
              })
            }
            type='button'
          >
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

    const openThreadState = viewState(capturedController);
    expect(openThreadState?.availableSlots).toEqual(['slot1', 'slot2']);
    expect(getChatViewEntityBinding(openThreadState?.slotBindings.slot1)?.kind).toBe(
      'channel',
    );
    expect(getChatViewEntityBinding(openThreadState?.slotBindings.slot2)?.kind).toBe(
      'thread',
    );
  });

  // Regression: opening two channels side-by-side (⌘/ctrl-click a channel in the list opens it
  // into the secondary slot beside the primary channel). This relies on the layout holding two
  // `channel` bindings in two slots at once. The second channel must open into an EXPLICIT slot
  // — the default same-kind resolution would otherwise replace the channel already open — and
  // doing so must leave the first channel's slot untouched.
  it('keeps two channels bound side-by-side when the second opens into an explicit slot', () => {
    const primaryChannel = makeChannel('messaging:primary');
    const secondaryChannel = makeChannel('messaging:secondary');
    let capturedController: LayoutController | undefined;

    const Harness = () => {
      const navigation = useChatViewNavigation();
      const { layoutController } = useChatViewContext();
      capturedController = layoutController;

      return (
        <>
          <button
            onClick={() =>
              navigation.open({
                key: primaryChannel.cid ?? undefined,
                kind: 'channel',
                source: primaryChannel,
              })
            }
            type='button'
          >
            open-primary
          </button>
          <button
            onClick={() =>
              navigation.open(
                {
                  key: secondaryChannel.cid ?? undefined,
                  kind: 'channel',
                  source: secondaryChannel,
                },
                { slot: 'slot2' },
              )
            }
            type='button'
          >
            open-secondary
          </button>
        </>
      );
    };

    renderWithProviders(
      <ChatView maxSlots={2} minSlots={2}>
        <Harness />
      </ChatView>,
    );

    fireEvent.click(screen.getByText('open-primary'));
    fireEvent.click(screen.getByText('open-secondary'));

    const state = viewState(capturedController);
    const slot1Binding = getChatViewEntityBinding(state?.slotBindings.slot1);
    const slot2Binding = getChatViewEntityBinding(state?.slotBindings.slot2);

    // Both channels stay bound at once — the second did not replace the first.
    expect(slot1Binding?.kind).toBe('channel');
    expect(slot1Binding?.source).toBe(primaryChannel);
    expect(slot2Binding?.kind).toBe('channel');
    expect(slot2Binding?.source).toBe(secondaryChannel);
    expect(state?.activeView).toBe('channels');
  });

  // Regression: opening a reply thread while both slots are occupied by channels must NOT
  // evict the primary (first) channel. The thread takes the last non-persistent slot, so the
  // primary channel stays put. (Reported: the first channel disappeared when opening a thread
  // with two channels open side-by-side.)
  it('opens a thread into the last slot without evicting the primary channel', () => {
    const primaryChannel = makeChannel('messaging:primary');
    const secondaryChannel = makeChannel('messaging:secondary');
    const thread = makeThread('thread-from-primary');
    let capturedController: LayoutController | undefined;

    const Harness = () => {
      const navigation = useChatViewNavigation();
      const { layoutController } = useChatViewContext();
      capturedController = layoutController;

      return (
        <>
          <button
            onClick={() =>
              navigation.open({
                key: primaryChannel.cid ?? undefined,
                kind: 'channel',
                source: primaryChannel,
              })
            }
            type='button'
          >
            open-primary
          </button>
          <button
            onClick={() =>
              navigation.open(
                {
                  key: secondaryChannel.cid ?? undefined,
                  kind: 'channel',
                  source: secondaryChannel,
                },
                { slot: 'slot2' },
              )
            }
            type='button'
          >
            open-secondary
          </button>
          <button
            onClick={() =>
              navigation.open({
                key: thread.id ?? undefined,
                kind: 'thread',
                source: thread,
              })
            }
            type='button'
          >
            open-thread
          </button>
        </>
      );
    };

    renderWithProviders(
      <ChatView maxSlots={2} minSlots={2}>
        <Harness />
      </ChatView>,
    );

    fireEvent.click(screen.getByText('open-primary'));
    fireEvent.click(screen.getByText('open-secondary'));
    fireEvent.click(screen.getByText('open-thread'));

    const state = viewState(capturedController);
    const slot1Binding = getChatViewEntityBinding(state?.slotBindings.slot1);
    const slot2Binding = getChatViewEntityBinding(state?.slotBindings.slot2);

    // Primary channel stays put in slot1; the thread replaced the 2nd channel in slot2.
    expect(slot1Binding?.kind).toBe('channel');
    expect(slot1Binding?.source).toBe(primaryChannel);
    expect(slot2Binding?.kind).toBe('thread');
    expect(slot2Binding?.source).toBe(thread);
  });

  // Regression: `open(binding, { additive: true })` — used by ctrl/⌘-click on channel-list and
  // search results — opens beside the current channel instead of replacing it. Without
  // `additive`, a same-kind open resolves to the occupied primary slot and replaces it; with
  // `additive` it must skip that and land in the free secondary slot.
  it('opens additively into the secondary slot without replacing the primary channel', () => {
    const primaryChannel = makeChannel('messaging:primary');
    const secondaryChannel = makeChannel('messaging:secondary');
    let capturedController: LayoutController | undefined;

    const Harness = () => {
      const navigation = useChatViewNavigation();
      const { layoutController } = useChatViewContext();
      capturedController = layoutController;

      return (
        <>
          <button
            onClick={() =>
              navigation.open({
                key: primaryChannel.cid ?? undefined,
                kind: 'channel',
                source: primaryChannel,
              })
            }
            type='button'
          >
            open-primary
          </button>
          <button
            onClick={() =>
              navigation.open(
                {
                  key: secondaryChannel.cid ?? undefined,
                  kind: 'channel',
                  source: secondaryChannel,
                },
                { additive: true },
              )
            }
            type='button'
          >
            open-additive
          </button>
        </>
      );
    };

    renderWithProviders(
      <ChatView maxSlots={2} minSlots={2}>
        <Harness />
      </ChatView>,
    );

    fireEvent.click(screen.getByText('open-primary'));
    fireEvent.click(screen.getByText('open-additive'));

    const state = viewState(capturedController);
    const slot1Binding = getChatViewEntityBinding(state?.slotBindings.slot1);
    const slot2Binding = getChatViewEntityBinding(state?.slotBindings.slot2);

    // The additive open landed in the free secondary slot; the primary is untouched.
    expect(slot1Binding?.source).toBe(primaryChannel);
    expect(slot2Binding?.source).toBe(secondaryChannel);
  });

  it('opens channel and thread into configured slotNames in order', () => {
    const channel = makeChannel('messaging:expand-named');
    const thread = makeThread('thread-expand-named');
    let capturedController: LayoutController | undefined;

    const Harness = () => {
      const navigation = useChatViewNavigation();
      const { layoutController } = useChatViewContext();
      capturedController = layoutController;

      return (
        <>
          <button
            onClick={() =>
              navigation.open({
                key: channel.cid ?? undefined,
                kind: 'channel',
                source: channel,
              })
            }
            type='button'
          >
            open-channel
          </button>
          <button
            onClick={() =>
              navigation.open({
                key: thread.id ?? undefined,
                kind: 'thread',
                source: thread,
              })
            }
            type='button'
          >
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

    const openThreadState = viewState(capturedController);
    expect(openThreadState?.availableSlots).toEqual(['list', 'main']);
    expect(getChatViewEntityBinding(openThreadState?.slotBindings.list)?.kind).toBe(
      'channel',
    );
    expect(getChatViewEntityBinding(openThreadState?.slotBindings.main)?.kind).toBe(
      'thread',
    );
  });
});
