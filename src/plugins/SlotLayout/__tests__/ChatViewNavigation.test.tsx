import React from 'react';
import type { TranslationContextValue } from '../../../context/TranslationContext';
import { StateStore } from '@stream-io/state-store';
import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import { ChatView, useChatViewContext } from '../ChatView';
import { getChatViewEntityBinding } from '../ChatView';
import { createChatViewSlotBinding } from '../slotBinding';
import { useChatViewNavigation } from '../ChatViewNavigationContext';
import { getLayoutViewState } from '../hooks';
import {
  useWorkspaceNavigation,
  useWorkspacePanel,
} from '../../../context/WorkspaceNavigationContext';
import { Slot } from '../layout/Slot';

import { ChatProvider } from '../../../context/ChatContext';
import { TranslationProvider } from '../../../context/TranslationContext';

import type { Channel as StreamChannel, Thread as StreamThread } from 'stream-chat';
import type { ChatContextValue } from '../../../context/ChatContext';
import type { LayoutController } from '../layoutController/layoutControllerTypes';
import { mockT } from '../../../mock-builders/translator';

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
    client: {
      threads: {
        state: new StateStore({
          unreadThreadCount: 0,
        }),
      },
    },
    getAppSettings: vi.fn(() => null),
    openMobileNav: vi.fn(),
    searchController: {},
    theme: 'str-chat__theme-light',
    useImageFlagEmojisOnWindows: false,
  }) as unknown as ChatContextValue;

const renderWithProviders = (ui: React.ReactNode) =>
  render(
    <ChatProvider value={createChatContextValue()}>
      <TranslationProvider
        value={{ t: mockT, userLanguage: 'en' } as TranslationContextValue}
      >
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

  describe('replacing the primary channel', () => {
    const primaryChannel = makeChannel('messaging:primary');
    const nextChannel = makeChannel('messaging:next');
    const secondaryChannel = makeChannel('messaging:secondary');
    const replyThread = {
      channel: primaryChannel,
      id: 'reply-thread',
    } as unknown as StreamThread;
    let capturedController: LayoutController | undefined;

    const channelBinding = (channel: StreamChannel) => ({
      key: channel.cid ?? undefined,
      kind: 'channel' as const,
      source: channel,
    });

    const Harness = () => {
      const navigation = useChatViewNavigation();
      const { layoutController } = useChatViewContext();
      capturedController = layoutController;

      return (
        <>
          <button
            onClick={() => navigation.open(channelBinding(primaryChannel))}
            type='button'
          >
            open-primary
          </button>
          <button
            onClick={() =>
              navigation.open(channelBinding(secondaryChannel), { additive: true })
            }
            type='button'
          >
            open-secondary
          </button>
          <button
            onClick={() =>
              navigation.open({
                key: replyThread.id,
                kind: 'thread',
                source: replyThread,
              })
            }
            type='button'
          >
            open-reply-thread
          </button>
          <button
            onClick={() => navigation.open(channelBinding(nextChannel))}
            type='button'
          >
            open-next
          </button>
        </>
      );
    };

    const renderHarness = () =>
      renderWithProviders(
        <ChatView maxSlots={2} minSlots={2}>
          <Harness />
        </ChatView>,
      );

    it('keeps a channel stacked over its reply thread, as the slot base', () => {
      renderHarness();
      fireEvent.click(screen.getByText('open-primary'));
      fireEvent.click(screen.getByText('open-reply-thread'));
      fireEvent.click(screen.getByText('open-secondary'));
      // The 2nd channel covers the reply thread in slot2.
      expect(viewState(capturedController)?.slotLayers?.slot2).toHaveLength(1);

      fireEvent.click(screen.getByText('open-next'));

      const state = viewState(capturedController);
      expect(getChatViewEntityBinding(state?.slotBindings.slot1)?.source).toBe(
        nextChannel,
      );
      // The reply thread of the replaced channel is gone; the channel above it stays.
      expect(getChatViewEntityBinding(state?.slotBindings.slot2)?.source).toBe(
        secondaryChannel,
      );
      expect(state?.slotLayers?.slot2 ?? []).toHaveLength(0);
    });

    it('closes its reply thread stacked over another channel, revealing that channel', () => {
      renderHarness();
      fireEvent.click(screen.getByText('open-primary'));
      fireEvent.click(screen.getByText('open-secondary'));
      fireEvent.click(screen.getByText('open-reply-thread'));
      // The reply thread covers the 2nd channel in slot2.
      expect(
        getChatViewEntityBinding(viewState(capturedController)?.slotLayers?.slot2?.[0])
          ?.source,
      ).toBe(replyThread);

      fireEvent.click(screen.getByText('open-next'));

      const state = viewState(capturedController);
      expect(getChatViewEntityBinding(state?.slotBindings.slot1)?.source).toBe(
        nextChannel,
      );
      expect(getChatViewEntityBinding(state?.slotBindings.slot2)?.source).toBe(
        secondaryChannel,
      );
      expect(state?.slotLayers?.slot2 ?? []).toHaveLength(0);
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

  // Base policy: opening a reply thread while both slots are occupied by channels must NOT evict
  // either channel. The primary/anchor channel stays put, and — since the only remaining target is
  // the occupied secondary slot — the thread STACKS as a layer over the 2nd channel instead of
  // replacing it. `close`/`popLayer` on that slot restores the 2nd channel.
  it('layers a thread over the secondary channel instead of evicting it', () => {
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
    const slot2TopLayer = getChatViewEntityBinding(state?.slotLayers?.slot2?.[0]);

    // Primary channel stays put in slot1; the 2nd channel stays as slot2's base with the thread
    // stacked on top as a layer.
    expect(slot1Binding?.kind).toBe('channel');
    expect(slot1Binding?.source).toBe(primaryChannel);
    expect(slot2Binding?.kind).toBe('channel');
    expect(slot2Binding?.source).toBe(secondaryChannel);
    expect(state?.slotLayers?.slot2).toHaveLength(1);
    expect(slot2TopLayer?.kind).toBe('thread');
    expect(slot2TopLayer?.source).toBe(thread);
  });

  // A thread stacked over a channel in the secondary slot offers two actions: `goBack` removes just
  // the thread, revealing the channel; `closeThread` dismisses the whole secondary panel.
  describe('a thread stacked over a channel beside the primary one', () => {
    const primaryChannel = makeChannel('messaging:primary');
    const secondaryChannel = makeChannel('messaging:secondary');
    const thread = makeThread('thread-from-primary');
    let capturedController: LayoutController | undefined;

    const Harness = () => {
      const navigation = useChatViewNavigation();
      const workspaceNavigation = useWorkspaceNavigation();
      const { layoutController } = useChatViewContext();
      capturedController = layoutController;

      return (
        <>
          <span data-testid='can-go-back'>
            {String(workspaceNavigation.canGoBack(thread.id))}
          </span>
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
          <button onClick={() => workspaceNavigation.goBack(thread.id)} type='button'>
            go-back
          </button>
          <button
            onClick={() => workspaceNavigation.closeThread(thread.id)}
            type='button'
          >
            close-thread
          </button>
        </>
      );
    };

    const openThreadOverSecondary = () => {
      renderWithProviders(
        <ChatView maxSlots={2} minSlots={2}>
          <Harness />
        </ChatView>,
      );
      fireEvent.click(screen.getByText('open-primary'));
      fireEvent.click(screen.getByText('open-secondary'));
      fireEvent.click(screen.getByText('open-thread'));
      expect(viewState(capturedController)?.slotLayers?.slot2).toHaveLength(1);
    };

    it('goes back to the channel beneath', () => {
      openThreadOverSecondary();
      expect(screen.getByTestId('can-go-back')).toHaveTextContent('true');

      fireEvent.click(screen.getByText('go-back'));

      const state = viewState(capturedController);
      expect(state?.slotLayers?.slot2 ?? []).toHaveLength(0);
      expect(getChatViewEntityBinding(state?.slotBindings.slot2)?.source).toBe(
        secondaryChannel,
      );
      expect(getChatViewEntityBinding(state?.slotBindings.slot1)?.source).toBe(
        primaryChannel,
      );
    });

    it('closes the whole secondary panel', () => {
      openThreadOverSecondary();

      fireEvent.click(screen.getByText('close-thread'));

      const state = viewState(capturedController);
      expect(state?.slotBindings.slot2).toBeUndefined();
      expect(state?.slotLayers?.slot2 ?? []).toHaveLength(0);
      expect(getChatViewEntityBinding(state?.slotBindings.slot1)?.source).toBe(
        primaryChannel,
      );
    });
  });

  // ⌘/ctrl-clicking a channel into a secondary slot that already shows a channel stacks it, so the
  // header can step back to the previous one or close the whole panel.
  describe('a channel opened beside the primary one over another channel', () => {
    const primaryChannel = makeChannel('messaging:primary');
    const firstBeside = makeChannel('messaging:first-beside');
    const secondBeside = makeChannel('messaging:second-beside');
    let capturedController: LayoutController | undefined;

    const Harness = () => {
      const navigation = useChatViewNavigation();
      const workspaceNavigation = useWorkspaceNavigation();
      const { layoutController } = useChatViewContext();
      capturedController = layoutController;
      const openChannel = (channel: StreamChannel, additive?: boolean) =>
        navigation.open(
          { key: channel.cid ?? undefined, kind: 'channel', source: channel },
          { additive },
        );

      return (
        <>
          <span data-testid='can-go-back'>
            {[primaryChannel, secondBeside]
              .map((channel) => workspaceNavigation.canGoBack(channel.cid))
              .join(',')}
          </span>
          <span data-testid='active'>
            {[primaryChannel, firstBeside, secondBeside]
              .map((channel) => workspaceNavigation.isChannelActive(channel.cid))
              .join(',')}
          </span>
          <button onClick={() => openChannel(primaryChannel)} type='button'>
            open-primary
          </button>
          <button onClick={() => openChannel(firstBeside, true)} type='button'>
            open-first-beside
          </button>
          <button onClick={() => openChannel(secondBeside, true)} type='button'>
            open-second-beside
          </button>
          <button onClick={() => openChannel(primaryChannel, true)} type='button'>
            open-primary-beside
          </button>
          <button
            onClick={() => workspaceNavigation.goBack(secondBeside.cid)}
            type='button'
          >
            go-back
          </button>
          <button
            onClick={() => workspaceNavigation.closeChannel(secondBeside.cid)}
            type='button'
          >
            close-second-beside
          </button>
        </>
      );
    };

    const openBothBeside = () => {
      renderWithProviders(
        <ChatView maxSlots={2} minSlots={2}>
          <Harness />
        </ChatView>,
      );
      fireEvent.click(screen.getByText('open-primary'));
      fireEvent.click(screen.getByText('open-first-beside'));
      fireEvent.click(screen.getByText('open-second-beside'));
    };

    it('stacks the second channel over the first', () => {
      openBothBeside();

      const state = viewState(capturedController);
      expect(getChatViewEntityBinding(state?.slotBindings.slot2)?.source).toBe(
        firstBeside,
      );
      expect(getChatViewEntityBinding(state?.slotLayers?.slot2?.[0])?.source).toBe(
        secondBeside,
      );
      expect(screen.getByTestId('can-go-back')).toHaveTextContent('false,true');
      // The covered channel is not the active one; the one shown over it is.
      expect(screen.getByTestId('active')).toHaveTextContent('true,false,true');
    });

    it('goes back to the first channel', () => {
      openBothBeside();

      fireEvent.click(screen.getByText('go-back'));

      const state = viewState(capturedController);
      expect(getChatViewEntityBinding(state?.slotBindings.slot2)?.source).toBe(
        firstBeside,
      );
      expect(state?.slotLayers?.slot2 ?? []).toHaveLength(0);
      expect(screen.getByTestId('active')).toHaveTextContent('true,true,false');
    });

    it('closes the whole secondary panel', () => {
      openBothBeside();

      fireEvent.click(screen.getByText('close-second-beside'));

      const state = viewState(capturedController);
      expect(state?.slotBindings.slot2).toBeUndefined();
      expect(state?.slotLayers?.slot2 ?? []).toHaveLength(0);
      expect(getChatViewEntityBinding(state?.slotBindings.slot1)?.source).toBe(
        primaryChannel,
      );
    });

    // The secondary slot shows what was opened beside last, whether or not that channel is open
    // elsewhere: its stack stays intact beneath.
    const stackOfSlot2 = () => {
      const state = viewState(capturedController);
      return [state?.slotBindings.slot2, ...(state?.slotLayers?.slot2 ?? [])].map(
        (binding) => getChatViewEntityBinding(binding)?.source,
      );
    };

    it('stacks a channel open in another slot on top', () => {
      openBothBeside();

      fireEvent.click(screen.getByText('open-primary-beside'));

      expect(stackOfSlot2()).toEqual([firstBeside, secondBeside, primaryChannel]);
      expect(
        getChatViewEntityBinding(viewState(capturedController)?.slotBindings.slot1)
          ?.source,
      ).toBe(primaryChannel);
    });

    it('stacks a channel lower in the stack on top again', () => {
      openBothBeside();

      fireEvent.click(screen.getByText('open-first-beside'));

      expect(stackOfSlot2()).toEqual([firstBeside, secondBeside, firstBeside]);
    });

    it('changes nothing when opening the channel already shown on top', () => {
      openBothBeside();

      fireEvent.click(screen.getByText('open-second-beside'));

      expect(stackOfSlot2()).toEqual([firstBeside, secondBeside]);
    });
  });

  // `ChannelHeader` shows its close button from `isChannelDismissable`: only a channel opened beside
  // another one can be dismissed, and `closeChannel` releases its slot without touching the primary.
  it('lets only a channel opened beside another be dismissed, and closes it', () => {
    const primaryChannel = makeChannel('messaging:primary');
    const secondaryChannel = makeChannel('messaging:secondary');
    let capturedController: LayoutController | undefined;

    const Harness = () => {
      const navigation = useChatViewNavigation();
      const workspaceNavigation = useWorkspaceNavigation();
      const { layoutController } = useChatViewContext();
      capturedController = layoutController;

      return (
        <>
          <span data-testid='dismissable'>
            {[primaryChannel, secondaryChannel]
              .map((channel) => workspaceNavigation.isChannelDismissable(channel.cid))
              .join(',')}
          </span>
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
            open-secondary
          </button>
          <button
            onClick={() => workspaceNavigation.closeChannel(secondaryChannel.cid)}
            type='button'
          >
            close-secondary
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
    expect(screen.getByTestId('dismissable')).toHaveTextContent('false,false');

    fireEvent.click(screen.getByText('open-secondary'));
    expect(screen.getByTestId('dismissable')).toHaveTextContent('false,true');

    fireEvent.click(screen.getByText('close-secondary'));
    const state = viewState(capturedController);
    expect(state?.slotBindings.slot2).toBeUndefined();
    expect(getChatViewEntityBinding(state?.slotBindings.slot1)?.source).toBe(
      primaryChannel,
    );
    expect(screen.getByTestId('dismissable')).toHaveTextContent('false,false');
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

  it('pushLayer stacks over the base binding and popLayer removes it', () => {
    const channel = makeChannel('messaging:layer-base');
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
              navigation.pushLayer('slot1', {
                key: 'u1',
                kind: 'userProfile',
                source: { userId: 'u1' },
              })
            }
            type='button'
          >
            push-layer
          </button>
          <button onClick={() => navigation.popLayer('slot1')} type='button'>
            pop-layer
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
    fireEvent.click(screen.getByText('push-layer'));

    const layered = viewState(capturedController);
    // Base binding is untouched; the profile lives in the layer stack on top of it.
    expect(getChatViewEntityBinding(layered?.slotBindings.slot1)?.kind).toBe('channel');
    expect(layered?.slotLayers?.slot1).toHaveLength(1);
    expect(getChatViewEntityBinding(layered?.slotLayers?.slot1?.[0])?.kind).toBe(
      'userProfile',
    );

    fireEvent.click(screen.getByText('pop-layer'));

    const popped = viewState(capturedController);
    expect(popped?.slotLayers?.slot1).toBeUndefined();
    expect(getChatViewEntityBinding(popped?.slotBindings.slot1)?.kind).toBe('channel');
  });

  it('close pops the top layer first and releases the base only when no layers remain', () => {
    const channel = makeChannel('messaging:layer-close');
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
              navigation.pushLayer('slot1', {
                key: 'u1',
                kind: 'userProfile',
                source: { userId: 'u1' },
              })
            }
            type='button'
          >
            push-layer
          </button>
          <button onClick={() => navigation.close('slot1')} type='button'>
            close
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
    fireEvent.click(screen.getByText('push-layer'));

    // First close: pops the layer, base channel stays bound.
    fireEvent.click(screen.getByText('close'));
    const afterFirstClose = viewState(capturedController);
    expect(afterFirstClose?.slotLayers?.slot1).toBeUndefined();
    expect(getChatViewEntityBinding(afterFirstClose?.slotBindings.slot1)?.kind).toBe(
      'channel',
    );

    // Second close: no layers left, so the base binding is released.
    fireEvent.click(screen.getByText('close'));
    expect(viewState(capturedController)?.slotBindings.slot1).toBeUndefined();
  });

  // Regression: `open(binding, { additive: true, layer: true })` stacks the binding as a layer on
  // top of the (occupied) secondary slot instead of evicting it, and does NOT run the channel's
  // dependent thread-release — so ⌘/ctrl-clicking a channel beside an open reply thread covers the
  // thread without closing it.
  it('layers a channel over an open thread without releasing it', () => {
    const channelA = makeChannel('messaging:layer-primary');
    const channelB = makeChannel('messaging:layer-secondary');
    const thread = makeThread('thread-under-channel-layer');
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
          <button
            onClick={() =>
              navigation.open(
                {
                  key: channelB.cid ?? undefined,
                  kind: 'channel',
                  source: channelB,
                },
                { additive: true, layer: true },
              )
            }
            type='button'
          >
            layer-channel
          </button>
        </>
      );
    };

    renderWithProviders(
      <ChatView maxSlots={2} minSlots={2}>
        <Harness />
      </ChatView>,
    );

    fireEvent.click(screen.getByText('open-channel'));
    fireEvent.click(screen.getByText('open-thread'));
    fireEvent.click(screen.getByText('layer-channel'));

    const state = viewState(capturedController);
    // slot2's base binding is still the thread; the 2nd channel sits on top as a layer.
    expect(getChatViewEntityBinding(state?.slotBindings.slot2)?.kind).toBe('thread');
    expect(state?.slotLayers?.slot2).toHaveLength(1);
    const topLayer = getChatViewEntityBinding(state?.slotLayers?.slot2?.[0]);
    expect(topLayer?.kind).toBe('channel');
    expect(topLayer?.source).toBe(channelB);
    // The primary channel is untouched (dependent thread-release did not fire).
    expect(getChatViewEntityBinding(state?.slotBindings.slot1)?.source).toBe(channelA);
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

describe('ChatView deriveWorkspaceNavigation', () => {
  it('lets the app override openChannel on the workspace navigation adapter', () => {
    const channel = makeChannel('messaging:derive');
    const customOpenChannel = vi.fn();
    let capturedController: LayoutController | undefined;

    const Harness = () => {
      const navigation = useWorkspaceNavigation();
      const { layoutController } = useChatViewContext();
      capturedController = layoutController;
      return (
        <button onClick={() => navigation.openChannel(channel)} type='button'>
          open-channel
        </button>
      );
    };

    renderWithProviders(
      <ChatView
        deriveWorkspaceNavigation={(base) => ({
          ...base,
          openChannel: customOpenChannel,
        })}
        maxSlots={1}
      >
        <Harness />
      </ChatView>,
    );

    fireEvent.click(screen.getByText('open-channel'));

    // The app-provided openChannel ran instead of the adapter's default...
    expect(customOpenChannel).toHaveBeenCalledTimes(1);
    expect(customOpenChannel.mock.calls[0][0]).toBe(channel);
    // ...and since it did not delegate to the base, no slot was bound.
    expect(
      getChatViewEntityBinding(viewState(capturedController)?.slotBindings.slot1),
    ).toBeUndefined();
  });

  it('keeps every member the override leaves out, without spreading the base', () => {
    const channel = makeChannel('messaging:partial');
    const openThreadSpy = vi.fn();

    const Harness = () => {
      const navigation = useWorkspaceNavigation();
      return (
        <>
          <span data-testid='active'>
            {String(navigation.isChannelActive(channel.cid))}
          </span>
          <span data-testid='close-channel'>{typeof navigation.closeChannel}</span>
          <button onClick={() => navigation.openChannel(channel)} type='button'>
            open-channel
          </button>
        </>
      );
    };

    renderWithProviders(
      <ChatView
        deriveWorkspaceNavigation={() => ({
          // An explicitly undefined member keeps the default too.
          closeChannel: undefined,
          // Only `openThread` is overridden; `openChannel`/`isChannelActive` stay the SDK's.
          openThread: openThreadSpy,
        })}
      >
        <Harness />
      </ChatView>,
    );

    fireEvent.click(screen.getByText('open-channel'));

    expect(screen.getByTestId('active')).toHaveTextContent('true');
    expect(screen.getByTestId('close-channel')).toHaveTextContent('function');
  });

  it('lets the app decorate openChannel (e.g. inject options) while delegating to the base', () => {
    const channel = makeChannel('messaging:decorate');
    const seenOptions: unknown[] = [];
    let capturedController: LayoutController | undefined;

    const Harness = () => {
      const navigation = useWorkspaceNavigation();
      const { layoutController } = useChatViewContext();
      capturedController = layoutController;
      return (
        <button onClick={() => navigation.openChannel(channel)} type='button'>
          open-channel
        </button>
      );
    };

    renderWithProviders(
      <ChatView
        deriveWorkspaceNavigation={(base) => ({
          ...base,
          openChannel: (ch, options) => {
            seenOptions.push({ ...options, additive: true });
            base.openChannel(ch, { ...options, additive: true });
          },
        })}
        maxSlots={1}
      >
        <Harness />
      </ChatView>,
    );

    fireEvent.click(screen.getByText('open-channel'));

    // The decorator ran and delegated to the base, so the channel was actually opened.
    expect(seenOptions).toEqual([{ additive: true }]);
    expect(
      getChatViewEntityBinding(viewState(capturedController)?.slotBindings.slot1)?.kind,
    ).toBe('channel');
  });
});

describe('stacked panels', () => {
  const channelBinding = (channel: StreamChannel) => ({
    key: channel.cid ?? undefined,
    kind: 'channel' as const,
    source: channel,
  });
  const threadBinding = (thread: StreamThread) => ({
    key: thread.id ?? undefined,
    kind: 'thread' as const,
    source: thread,
  });

  // The primary slot is the workspace's main panel: a thread's close there steps back one layer,
  // so the channel beneath stays, rather than emptying the panel.
  it("steps a thread's close back one layer in the primary slot", () => {
    const channel = makeChannel('messaging:primary-only');
    const thread = { channel, id: 'thread-over-primary' } as unknown as StreamThread;
    let capturedController: LayoutController | undefined;

    const Harness = () => {
      const navigation = useChatViewNavigation();
      const workspaceNavigation = useWorkspaceNavigation();
      const { layoutController } = useChatViewContext();
      capturedController = layoutController;

      return (
        <>
          <button onClick={() => navigation.open(channelBinding(channel))} type='button'>
            open-channel
          </button>
          <button
            onClick={() => navigation.open(threadBinding(thread), { layer: true })}
            type='button'
          >
            stack-thread
          </button>
          <button
            onClick={() => workspaceNavigation.closeThread(thread.id)}
            type='button'
          >
            close-thread
          </button>
        </>
      );
    };

    renderWithProviders(
      <ChatView>
        <Harness />
      </ChatView>,
    );

    fireEvent.click(screen.getByText('open-channel'));
    fireEvent.click(screen.getByText('stack-thread'));
    expect(viewState(capturedController)?.slotLayers?.slot1).toHaveLength(1);

    fireEvent.click(screen.getByText('close-thread'));

    const state = viewState(capturedController);
    expect(state?.slotLayers?.slot1 ?? []).toHaveLength(0);
    expect(getChatViewEntityBinding(state?.slotBindings.slot1)?.source).toBe(channel);
  });

  // `ThreadListItemUI` highlights from `isThreadActive`: a thread covered by a channel stacked over
  // it is not the active one until stepping back reveals it.
  it('reports a thread covered by a stacked channel as not active', () => {
    const primaryChannel = makeChannel('messaging:primary');
    const besideChannel = makeChannel('messaging:beside');
    const thread = {
      channel: primaryChannel,
      id: 'reply-thread',
    } as unknown as StreamThread;

    const Harness = () => {
      const navigation = useChatViewNavigation();
      const workspaceNavigation = useWorkspaceNavigation();

      return (
        <>
          <span data-testid='thread-active'>
            {String(workspaceNavigation.isThreadActive(thread.id))}
          </span>
          <button
            onClick={() => navigation.open(channelBinding(primaryChannel))}
            type='button'
          >
            open-primary
          </button>
          <button onClick={() => navigation.open(threadBinding(thread))} type='button'>
            open-thread
          </button>
          <button
            onClick={() =>
              navigation.open(channelBinding(besideChannel), { additive: true })
            }
            type='button'
          >
            open-beside
          </button>
          <button
            onClick={() => workspaceNavigation.goBack(besideChannel.cid)}
            type='button'
          >
            go-back
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
    fireEvent.click(screen.getByText('open-thread'));
    expect(screen.getByTestId('thread-active')).toHaveTextContent('true');

    fireEvent.click(screen.getByText('open-beside'));
    expect(screen.getByTestId('thread-active')).toHaveTextContent('false');

    fireEvent.click(screen.getByText('go-back'));
    expect(screen.getByTestId('thread-active')).toHaveTextContent('true');
  });

  // Replacing the primary channel closes only its own reply threads; a thread opened from the
  // channel beside it stays where it is.
  it('keeps a reply thread of another channel when the primary channel is replaced', () => {
    const primaryChannel = makeChannel('messaging:primary');
    const nextChannel = makeChannel('messaging:next');
    const besideChannel = makeChannel('messaging:beside');
    const besideThread = {
      channel: besideChannel,
      id: 'beside-thread',
    } as unknown as StreamThread;
    let capturedController: LayoutController | undefined;

    const Harness = () => {
      const navigation = useChatViewNavigation();
      const { layoutController } = useChatViewContext();
      capturedController = layoutController;

      return (
        <>
          <button
            onClick={() => navigation.open(channelBinding(primaryChannel))}
            type='button'
          >
            open-primary
          </button>
          <button
            onClick={() =>
              navigation.open(channelBinding(besideChannel), { additive: true })
            }
            type='button'
          >
            open-beside
          </button>
          <button
            onClick={() => navigation.open(threadBinding(besideThread))}
            type='button'
          >
            open-beside-thread
          </button>
          <button
            onClick={() => navigation.open(channelBinding(nextChannel))}
            type='button'
          >
            open-next
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
    fireEvent.click(screen.getByText('open-beside'));
    fireEvent.click(screen.getByText('open-beside-thread'));
    expect(
      getChatViewEntityBinding(viewState(capturedController)?.slotLayers?.slot2?.[0])
        ?.source,
    ).toBe(besideThread);

    fireEvent.click(screen.getByText('open-next'));

    const state = viewState(capturedController);
    expect(getChatViewEntityBinding(state?.slotBindings.slot1)?.source).toBe(nextChannel);
    expect(getChatViewEntityBinding(state?.slotBindings.slot2)?.source).toBe(
      besideChannel,
    );
    expect(getChatViewEntityBinding(state?.slotLayers?.slot2?.[0])?.source).toBe(
      besideThread,
    );
  });

  // The same channel can be open in both slots (the default duplicate policy allows it). The panel
  // a header renders in then decides which slot its back and close buttons act on.
  it('resolves a channel open in both slots by the panel asking', () => {
    const channel = makeChannel('messaging:twice');
    let capturedController: LayoutController | undefined;

    const Harness = () => {
      const navigation = useChatViewNavigation();
      const workspaceNavigation = useWorkspaceNavigation();
      const { layoutController } = useChatViewContext();
      capturedController = layoutController;

      return (
        <>
          <span data-testid='dismissable'>
            {[undefined, 'slot1', 'slot2']
              .map((panel) =>
                workspaceNavigation.isChannelDismissable(channel.cid, panel),
              )
              .join(',')}
          </span>
          <button onClick={() => navigation.open(channelBinding(channel))} type='button'>
            open
          </button>
          <button
            onClick={() => navigation.open(channelBinding(channel), { slot: 'slot2' })}
            type='button'
          >
            open-again-beside
          </button>
          <button
            onClick={() =>
              workspaceNavigation.closeChannel(channel.cid, { panel: 'slot2' })
            }
            type='button'
          >
            close-beside
          </button>
        </>
      );
    };

    renderWithProviders(
      <ChatView maxSlots={2} minSlots={2}>
        <Harness />
      </ChatView>,
    );

    fireEvent.click(screen.getByText('open'));
    fireEvent.click(screen.getByText('open-again-beside'));
    const bothOpen = viewState(capturedController);
    expect(getChatViewEntityBinding(bothOpen?.slotBindings.slot1)?.source).toBe(channel);
    expect(getChatViewEntityBinding(bothOpen?.slotBindings.slot2)?.source).toBe(channel);
    // Looked up by cid alone, the first (primary) slot is found; the panel names the other one.
    expect(screen.getByTestId('dismissable')).toHaveTextContent('false,false,true');

    fireEvent.click(screen.getByText('close-beside'));

    const closed = viewState(capturedController);
    expect(getChatViewEntityBinding(closed?.slotBindings.slot1)?.source).toBe(channel);
    expect(closed?.slotBindings.slot2).toBeUndefined();
  });

  // `<Slot>` tells what it shows which panel it is in.
  it('provides its slot as the panel of what it renders', () => {
    const channel = makeChannel('messaging:in-slot');
    const PanelProbe = () => <span data-testid='panel'>{useWorkspacePanel()}</span>;

    const Harness = () => {
      const navigation = useChatViewNavigation();
      return (
        <>
          <button
            onClick={() => navigation.open(channelBinding(channel), { slot: 'slot2' })}
            type='button'
          >
            open-beside
          </button>
          <Slot slot='slot2' />
        </>
      );
    };

    renderWithProviders(
      <ChatView
        maxSlots={2}
        minSlots={2}
        slotRenderers={{ channel: () => <PanelProbe /> }}
      >
        <Harness />
      </ChatView>,
    );

    fireEvent.click(screen.getByText('open-beside'));

    expect(screen.getByTestId('panel')).toHaveTextContent('slot2');
  });

  // Like `close`, `release` never removes a nav-rail list: its slot is hide-only.
  it('does not release a slot holding a list', () => {
    let capturedController: LayoutController | undefined;

    const Harness = () => {
      const navigation = useChatViewNavigation();
      const { layoutController } = useChatViewContext();
      capturedController = layoutController;

      return (
        <>
          <button
            onClick={() =>
              layoutController.bind(
                'slot1',
                createChatViewSlotBinding({
                  key: 'list',
                  kind: 'channelList',
                  source: {},
                }),
              )
            }
            type='button'
          >
            bind-list
          </button>
          <button onClick={() => navigation.release('slot1')} type='button'>
            release-list
          </button>
        </>
      );
    };

    renderWithProviders(
      <ChatView>
        <Harness />
      </ChatView>,
    );

    fireEvent.click(screen.getByText('bind-list'));
    fireEvent.click(screen.getByText('release-list'));

    expect(
      getChatViewEntityBinding(viewState(capturedController)?.slotBindings.slot1)?.kind,
    ).toBe('channelList');
  });
});
