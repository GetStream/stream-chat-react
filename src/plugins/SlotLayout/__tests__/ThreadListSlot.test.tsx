import React from 'react';
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import { fromPartial } from '@total-typescript/shoehorn';

import { ChatProvider, TranslationProvider } from '../../../context';
import {
  getTestClientWithUser,
  mockTranslationContextValue,
} from '../../../mock-builders';
import { ChatView } from '../ChatView';
import { ThreadListSlot } from '../ThreadListSlot';
import { LayoutController } from '../layoutController/LayoutController';
import { createChatViewSlotBinding, getChatViewEntityBinding } from '../slotBinding';

import type { ComponentProps, ReactNode } from 'react';
import type { StreamChat } from 'stream-chat';

vi.mock('../../../components/Threads/ThreadList', () => ({
  ThreadList: () => <div data-testid='thread-list' />,
}));

describe('ThreadListSlot', () => {
  let client: StreamChat;

  beforeEach(async () => {
    client = await getTestClientWithUser();
  });

  afterEach(cleanup);

  const renderTree = (
    children: ReactNode,
    chatViewProps: Partial<ComponentProps<typeof ChatView>> = {},
  ) => (
    <ChatProvider
      value={{
        client,
        getAppSettings: vi.fn(),
        mutes: [],
        searchController: fromPartial({}),
        theme: 'messaging light',
        useImageFlagEmojisOnWindows: false,
      }}
    >
      <TranslationProvider value={mockTranslationContextValue()}>
        <ChatView {...chatViewProps}>{children}</ChatView>
      </TranslationProvider>
    </ChatProvider>
  );

  const renderInChatView = (
    children: ReactNode,
    chatViewProps: Partial<ComponentProps<typeof ChatView>> = {},
  ) => render(renderTree(children, chatViewProps));

  const createLayoutController = (availableSlots: string[]) =>
    new LayoutController({ initialState: { availableSlots } });

  const boundKind = (layoutController: LayoutController, slot: string) => {
    const state = layoutController.state.getLatestValue();
    return getChatViewEntityBinding(state.layouts?.[state.activeView]?.slotBindings[slot])
      ?.kind;
  };

  it('binds a thread list into the first free slot and renders <ThreadList/>', async () => {
    const layoutController = createLayoutController(['slot1', 'slot2']);

    renderInChatView(<ThreadListSlot />, { layoutController });

    expect(await screen.findByTestId('thread-list')).toBeInTheDocument();
    expect(boundKind(layoutController, 'slot1')).toBe('threadList');
  });

  it('renders the thread list, not `fallback`, once the list is bound', async () => {
    const layoutController = createLayoutController(['slot1']);

    renderInChatView(<ThreadListSlot fallback={<div data-testid='fallback' />} />, {
      layoutController,
    });

    expect(await screen.findByTestId('thread-list')).toBeInTheDocument();
    expect(screen.queryByTestId('fallback')).not.toBeInTheDocument();
  });

  it('renders `children` instead of the thread list', async () => {
    const layoutController = createLayoutController(['slot1']);

    renderInChatView(
      <ThreadListSlot fallback={<div data-testid='fallback' />}>
        <div data-testid='custom-list' />
      </ThreadListSlot>,
      { layoutController },
    );

    expect(await screen.findByTestId('custom-list')).toBeInTheDocument();
    expect(screen.queryByTestId('thread-list')).not.toBeInTheDocument();
    expect(screen.queryByTestId('fallback')).not.toBeInTheDocument();
  });

  it("renders the app's `threadList` renderer from `slotRenderers`", async () => {
    const layoutController = createLayoutController(['slot1']);

    renderInChatView(<ThreadListSlot />, {
      layoutController,
      slotRenderers: { threadList: () => <div data-testid='app-thread-list' /> },
    });

    expect(await screen.findByTestId('app-thread-list')).toBeInTheDocument();
    expect(screen.queryByTestId('thread-list')).not.toBeInTheDocument();
  });

  it('renders `fallback` while the layout has no slot for the list', () => {
    const layoutController = createLayoutController([]);

    renderInChatView(<ThreadListSlot fallback={<div data-testid='fallback' />} />, {
      layoutController,
    });

    expect(screen.getByTestId('fallback')).toBeInTheDocument();
    expect(screen.queryByTestId('thread-list')).not.toBeInTheDocument();
  });

  describe('before the binding lands', () => {
    const bindChannel = (layoutController: LayoutController) => {
      const channel = client.channel('messaging', 'general');
      layoutController.bind(
        'slot1',
        createChatViewSlotBinding({ key: channel.cid, kind: 'channel', source: channel }),
      );
      // holds the thread list's binding back so the pre-bind render stays on screen
      vi.spyOn(layoutController, 'bind').mockImplementation(() => undefined);
    };
    const slotRenderers = {
      channel: () => <div data-testid='bound-channel' />,
    };

    it('shows nothing of what the slot held before', () => {
      const layoutController = createLayoutController(['slot1']);
      bindChannel(layoutController);

      const { container } = renderInChatView(<ThreadListSlot />, {
        layoutController,
        slotRenderers,
      });

      expect(container.querySelector('section[data-slot="slot1"]')).toBeEmptyDOMElement();
      expect(screen.queryByTestId('bound-channel')).not.toBeInTheDocument();
      expect(screen.queryByTestId('thread-list')).not.toBeInTheDocument();
    });

    it('renders `fallback` inside the slot', () => {
      const layoutController = createLayoutController(['slot1']);
      bindChannel(layoutController);

      const { container } = renderInChatView(
        <ThreadListSlot fallback={<div data-testid='fallback' />} />,
        { layoutController, slotRenderers },
      );

      expect(
        container.querySelector('section[data-slot="slot1"] [data-testid="fallback"]'),
      ).toBeInTheDocument();
      expect(screen.queryByTestId('bound-channel')).not.toBeInTheDocument();
    });
  });

  it('moves the thread list into the requested `slot`, releasing the slot it held', async () => {
    const layoutController = createLayoutController(['slot1', 'slot2']);
    const { rerender } = renderInChatView(<ThreadListSlot />, { layoutController });
    await screen.findByTestId('thread-list');

    rerender(renderTree(<ThreadListSlot slot='slot2' />, { layoutController }));

    await waitFor(() => expect(boundKind(layoutController, 'slot2')).toBe('threadList'));
    expect(boundKind(layoutController, 'slot1')).toBeUndefined();
    expect(screen.getByTestId('thread-list')).toBeInTheDocument();
  });

  it('ignores a `slot` the layout does not have', async () => {
    const layoutController = createLayoutController(['slot1']);

    renderInChatView(<ThreadListSlot slot='missing' />, { layoutController });

    expect(await screen.findByTestId('thread-list')).toBeInTheDocument();
    expect(boundKind(layoutController, 'slot1')).toBe('threadList');
  });

  it('moves to a free slot when its slot is bound to another kind', async () => {
    const layoutController = createLayoutController(['slot1', 'slot2']);
    renderInChatView(<ThreadListSlot />, { layoutController });
    await screen.findByTestId('thread-list');

    const channel = client.channel('messaging', 'general');
    act(() => {
      layoutController.bind(
        'slot1',
        createChatViewSlotBinding({ key: channel.cid, kind: 'channel', source: channel }),
      );
    });

    await waitFor(() => expect(boundKind(layoutController, 'slot2')).toBe('threadList'));
    expect(boundKind(layoutController, 'slot1')).toBe('channel');
    expect(screen.getByTestId('thread-list')).toBeInTheDocument();
  });
});
