import React, { createRef } from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { fromPartial } from '@total-typescript/shoehorn';

import { ChatProvider, TranslationProvider } from '../../../context';
import {
  getTestClientWithUser,
  mockTranslationContextValue,
} from '../../../mock-builders';
import { ChatView } from '../ChatView';
import { WorkspaceLayout } from '../layout/WorkspaceLayout';
import { LayoutController } from '../layoutController/LayoutController';
import { createChatViewSlotBinding } from '../slotBinding';

import type { ReactNode } from 'react';
import type { StreamChat } from 'stream-chat';

const PLACEHOLDER_SELECTOR = '.str-chat__chat-view__empty-placeholder';

describe('WorkspaceLayout rendered by the app', () => {
  let client: StreamChat;
  let layoutController: LayoutController;

  beforeEach(async () => {
    client = await getTestClientWithUser();
    layoutController = new LayoutController({
      initialState: { availableSlots: ['slot1', 'slot2'] },
    });
  });

  afterEach(cleanup);

  const bindChannel = (slot: string) => {
    const channel = client.channel('messaging', slot);
    layoutController.bind(
      slot,
      createChatViewSlotBinding({ key: channel.cid, kind: 'channel', source: channel }),
    );
  };

  const inChatView = (
    children: ReactNode,
    slotRenderers: React.ComponentProps<typeof ChatView>['slotRenderers'] = {
      channel: ({ source }) => <div data-testid={`bound-${source.id}`}>{source.cid}</div>,
    },
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
        <ChatView layoutController={layoutController} slotRenderers={slotRenderers}>
          {children}
        </ChatView>
      </TranslationProvider>
    </ChatProvider>
  );

  const renderInChatView = (...args: Parameters<typeof inChatView>) =>
    render(inChatView(...args));

  it('shows the placeholder while no slot has content or a binding', () => {
    const { container } = renderInChatView(
      <WorkspaceLayout slots={[{ slot: 'slot1' }, { slot: 'slot2' }]} />,
    );

    expect(container.querySelector(PLACEHOLDER_SELECTOR)).toBeInTheDocument();
    expect(
      container.querySelector('.str-chat__chat-view__workspace-layout-slot'),
    ).not.toBeInTheDocument();
  });

  it('renders a bound slot without `content` through its kind renderer', () => {
    bindChannel('slot1');

    const { container } = renderInChatView(
      <WorkspaceLayout slots={[{ slot: 'slot1' }, { slot: 'slot2' }]} />,
    );

    expect(screen.getByTestId('bound-slot1')).toBeInTheDocument();
    expect(container.querySelector(PLACEHOLDER_SELECTOR)).not.toBeInTheDocument();
    expect(
      container.querySelectorAll('.str-chat__chat-view__workspace-layout-slot'),
    ).toHaveLength(2);
  });

  it('renders `content` over the binding', () => {
    bindChannel('slot1');

    renderInChatView(
      <WorkspaceLayout
        slots={[{ content: <div data-testid='app-content' />, slot: 'slot1' }]}
      />,
    );

    expect(screen.getByTestId('app-content')).toBeInTheDocument();
    expect(screen.queryByTestId('bound-slot1')).not.toBeInTheDocument();
  });

  it('shows the placeholder while every slot renders nothing, `false` content included', () => {
    bindChannel('slot1');

    const { container } = renderInChatView(
      <WorkspaceLayout slots={[{ content: false, slot: 'slot1' }, { slot: 'slot2' }]} />,
    );

    expect(container.querySelector(PLACEHOLDER_SELECTOR)).toBeInTheDocument();
  });

  it('shows no placeholder while a slot has a layer', () => {
    const channel = client.channel('messaging', 'layered');
    layoutController.pushLayer(
      'slot1',
      createChatViewSlotBinding({ key: channel.cid, kind: 'channel', source: channel }),
    );

    const { container } = renderInChatView(
      <WorkspaceLayout slots={[{ slot: 'slot1' }, { slot: 'slot2' }]} />,
    );

    expect(container.querySelector(PLACEHOLDER_SELECTOR)).not.toBeInTheDocument();
    expect(screen.getByTestId('bound-layered')).toBeInTheDocument();
  });

  it('shows the placeholder while every bound renderer renders nothing', () => {
    bindChannel('slot1');

    const { container } = renderInChatView(
      <WorkspaceLayout slots={[{ slot: 'slot1' }, { slot: 'slot2' }]} />,
      { channel: () => null },
    );

    expect(container.querySelector(PLACEHOLDER_SELECTOR)).toBeInTheDocument();
  });

  it('runs the renderer of a slot that renders nothing as often as one that renders', () => {
    bindChannel('slot1');
    bindChannel('slot2');
    const channelRenderer = vi.fn(({ source }) =>
      source.id === 'slot1' ? <div data-testid='bound-slot1' /> : null,
    );
    const callsFor = (id: string) =>
      channelRenderer.mock.calls.filter(([props]) => props.source.id === id).length;

    renderInChatView(<WorkspaceLayout slots={[{ slot: 'slot1' }, { slot: 'slot2' }]} />, {
      channel: channelRenderer,
    });

    expect(screen.getByTestId('bound-slot1')).toBeInTheDocument();
    expect(callsFor('slot1')).toBeGreaterThan(0);
    expect(callsFor('slot2')).toBe(callsFor('slot1'));
  });

  it('renders a slot `fallback` while its binding renders nothing, instead of the placeholder', () => {
    const { container } = renderInChatView(
      <WorkspaceLayout
        slots={[
          { fallback: <div data-testid='fallback-slot1' />, slot: 'slot1' },
          { slot: 'slot2' },
        ]}
      />,
    );

    expect(screen.getByTestId('fallback-slot1')).toBeInTheDocument();
    expect(container.querySelector(PLACEHOLDER_SELECTOR)).not.toBeInTheDocument();
  });

  it('renders the binding over a slot `fallback`', () => {
    bindChannel('slot1');

    renderInChatView(
      <WorkspaceLayout
        slots={[{ fallback: <div data-testid='fallback-slot1' />, slot: 'slot1' }]}
      />,
    );

    expect(screen.getByTestId('bound-slot1')).toBeInTheDocument();
    expect(screen.queryByTestId('fallback-slot1')).not.toBeInTheDocument();
  });

  describe('composing an app layout', () => {
    it('puts `className` and the ref on its root', () => {
      const ref = createRef<HTMLDivElement>();
      const { container } = renderInChatView(
        <WorkspaceLayout className='app-layout' ref={ref} slots={[{ slot: 'slot1' }]} />,
      );

      const root = container.querySelector('.str-chat__chat-view__workspace-layout');
      expect(root).toHaveClass('app-layout');
      expect(ref.current).toBe(root);
    });

    it('renders `sidebar` as given between the nav rail and the slots, placeholder or not', () => {
      const { container, rerender } = renderInChatView(
        <WorkspaceLayout
          navRail={<div data-testid='nav-rail' />}
          sidebar={<aside data-testid='sidebar' />}
          slots={[{ slot: 'slot1' }]}
        />,
      );
      const root = container.querySelector('.str-chat__chat-view__workspace-layout');
      const childOrder = () =>
        Array.from(root?.children ?? []).map((child) =>
          child.matches('.str-chat__chat-view__workspace-layout-nav-rail')
            ? 'nav-rail'
            : (child.getAttribute('data-testid') ?? child.className),
        );

      expect(container.querySelector(PLACEHOLDER_SELECTOR)).toBeInTheDocument();
      expect(childOrder()).toEqual([
        'nav-rail',
        'sidebar',
        'str-chat__chat-view__workspace-layout-slots str-chat__chat-view__workspace-layout-slots--empty',
      ]);

      bindChannel('slot1');
      rerender(
        inChatView(
          <WorkspaceLayout
            navRail={<div data-testid='nav-rail' />}
            sidebar={<aside data-testid='sidebar' />}
            slots={[{ slot: 'slot1' }]}
          />,
        ),
      );

      expect(screen.getByTestId('bound-slot1')).toBeInTheDocument();
      expect(childOrder()).toEqual([
        'nav-rail',
        'sidebar',
        'str-chat__chat-view__workspace-layout-slots',
      ]);
    });

    it("puts each slot's `className`, `style` and `elementRef` on its section", () => {
      bindChannel('slot1');
      const elementRef = createRef<HTMLElement>();

      const { container } = renderInChatView(
        <WorkspaceLayout
          slots={[
            {
              className: 'app-main',
              elementRef,
              slot: 'slot1',
              style: { flexBasis: '240px' },
            },
            { slot: 'slot2' },
          ]}
        />,
      );

      const section = container.querySelector('[data-slot="slot1"]');
      expect(section).toHaveClass(
        'str-chat__chat-view__workspace-layout-slot',
        'app-main',
      );
      expect(section).toHaveStyle({ flexBasis: '240px' });
      expect(elementRef.current).toBe(section);
      expect(container.querySelector('[data-slot="slot2"]')).not.toHaveClass('app-main');
    });

    it('keeps `elementRef` on a slot that is unbound, hidden or layered', () => {
      bindChannel('slot2');
      layoutController.hide('slot2');
      const channel = client.channel('messaging', 'layer');
      layoutController.pushLayer(
        'slot1',
        createChatViewSlotBinding({ key: channel.cid, kind: 'channel', source: channel }),
      );
      const refs = { slot1: createRef<HTMLElement>(), slot2: createRef<HTMLElement>() };

      const { container } = renderInChatView(
        <WorkspaceLayout
          slots={[
            { elementRef: refs.slot1, slot: 'slot1' },
            { elementRef: refs.slot2, slot: 'slot2' },
          ]}
        />,
      );

      expect(refs.slot1.current).toBe(container.querySelector('[data-slot="slot1"]'));
      expect(refs.slot2.current).toBe(container.querySelector('[data-slot="slot2"]'));
      expect(refs.slot2.current).toHaveClass('str-chat__chat-view__slot--hidden');
      expect(screen.getByTestId('bound-layer')).toBeVisible();
    });

    it('renders `renderBetweenSlots` between each two neighbouring slots', () => {
      layoutController.setAvailableSlots(['slot1', 'slot2', 'slot3']);
      bindChannel('slot1');
      const renderBetweenSlots = vi.fn((previous: string, next: string) => (
        <div className='between' data-testid={`between-${previous}-${next}`} />
      ));

      const { container } = renderInChatView(
        <WorkspaceLayout
          renderBetweenSlots={renderBetweenSlots}
          slots={[{ slot: 'slot1' }, { slot: 'slot2' }, { slot: 'slot3' }]}
        />,
      );

      const row = container.querySelector('.str-chat__chat-view__workspace-layout-slots');
      expect(
        Array.from(row?.children ?? []).map(
          (child) => child.getAttribute('data-slot') ?? child.getAttribute('data-testid'),
        ),
      ).toEqual([
        'slot1',
        'between-slot1-slot2',
        'slot2',
        'between-slot2-slot3',
        'slot3',
      ]);
      expect(renderBetweenSlots.mock.calls).toEqual([
        ['slot1', 'slot2'],
        ['slot2', 'slot3'],
      ]);
    });

    it('renders nothing between slots while the placeholder replaces them', () => {
      const renderBetweenSlots = vi.fn(() => <div data-testid='between' />);

      renderInChatView(
        <WorkspaceLayout
          renderBetweenSlots={renderBetweenSlots}
          slots={[{ slot: 'slot1' }, { slot: 'slot2' }]}
        />,
      );

      expect(screen.queryByTestId('between')).not.toBeInTheDocument();
      expect(renderBetweenSlots).not.toHaveBeenCalled();
    });

    it('keeps each slot mounted while what renders between the slots changes', () => {
      bindChannel('slot1');
      bindChannel('slot2');
      const layout = (visible: boolean) => (
        <WorkspaceLayout
          renderBetweenSlots={() => (visible ? <div data-testid='between' /> : null)}
          slots={[{ slot: 'slot1' }, { slot: 'slot2' }]}
        />
      );

      const { rerender } = renderInChatView(layout(false));
      const slot2 = screen.getByTestId('bound-slot2');
      rerender(inChatView(layout(true)));

      expect(screen.getByTestId('between')).toBeInTheDocument();
      expect(screen.getByTestId('bound-slot2')).toBe(slot2);
    });
  });
});
