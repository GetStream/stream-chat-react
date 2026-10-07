import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';

import { fromPartial } from '@total-typescript/shoehorn';
import { axe } from '../../../../axe-helper';
import { ChatProvider, TranslationProvider } from '../../../context';
import {
  getTestClientWithUser,
  mockTranslationContextValue,
} from '../../../mock-builders';
import { ChatView } from '../ChatView';
import { LayoutController } from '../layoutController/LayoutController';
import { createChatViewSlotBinding } from '../slotBinding';

const renderSelector = async (selectorProps?: any) => {
  const client = await getTestClientWithUser();

  return render(
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
        <ChatView>
          <ChatView.Selector {...selectorProps} />
        </ChatView>
      </TranslationProvider>
    </ChatProvider>,
  );
};

const renderSelectorWithPanels = async (selectorProps?: any) => {
  const client = await getTestClientWithUser();

  return render(
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
        <ChatView
          views={{
            channels: <div data-testid='channels-panel-content' />,
            threads: <div data-testid='threads-panel-content' />,
          }}
        >
          <ChatView.Selector {...selectorProps} />
        </ChatView>
      </TranslationProvider>
    </ChatProvider>,
  );
};

describe('ChatView.Selector', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('renders tooltips instead of inline labels by default', async () => {
    const { container } = await renderSelector();

    expect(
      screen.getByRole('button', { name: 'Open channels view' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Open threads view' })).toBeInTheDocument();
    expect(
      container.querySelectorAll('.str-chat__chat-view__selector-button-text'),
    ).toHaveLength(0);

    const tooltips = Array.from(
      container.querySelectorAll('.str-chat__chat-view__selector-button-tooltip'),
    );

    expect(tooltips).toHaveLength(2);
    expect(tooltips.map((element) => element.textContent)).toEqual([
      'Channels',
      'Threads',
    ]);
  });

  it('renders labels inline when iconOnly is disabled', async () => {
    const { container } = await renderSelector({ iconOnly: false });

    expect(
      container.querySelectorAll('.str-chat__chat-view__selector-button-tooltip'),
    ).toHaveLength(0);
    expect(
      Array.from(
        container.querySelectorAll('.str-chat__chat-view__selector-button-text'),
      ).map((element) => element.textContent),
    ).toEqual(['Channels', 'Threads']);
  });

  it('exposes the selector as a navigation landmark whose current item is aria-current, and only renders the active view container (no tab/tabpanel roles)', async () => {
    await renderSelectorWithPanels();

    const nav = screen.getByRole('navigation', { name: 'Chat view controls' });
    const channelsButton = screen.getByRole('button', { name: 'Open channels view' });
    const threadsButton = screen.getByRole('button', { name: 'Open threads view' });

    expect(nav).toContainElement(channelsButton);
    expect(nav).toContainElement(threadsButton);

    // The current view's button is marked aria-current="true" (generic "current item" —
    // not "page", since the SDK may be embedded in a larger host UI), not aria-pressed.
    expect(channelsButton).toHaveAttribute('aria-current', 'true');
    expect(threadsButton).not.toHaveAttribute('aria-current');
    expect(channelsButton).not.toHaveAttribute('aria-pressed');

    // ChatView is a switcher between two independent surfaces, not a WAI-ARIA Tabs widget.
    expect(screen.queryByRole('tablist')).toBeNull();
    expect(screen.queryByRole('tab')).toBeNull();
    expect(screen.queryByRole('tabpanel')).toBeNull();

    // The active view container is a plain div with a stable id and no landmark role.
    const channelsPanel = screen.getByTestId('channels-panel-content').parentElement;
    expect(channelsPanel).not.toHaveAttribute('role');
    expect(channelsPanel).not.toHaveAttribute('aria-labelledby');
    expect(channelsPanel?.id).toMatch(/str-chat__chat-view-.*-panel-channels$/);

    // The inactive view is not rendered.
    expect(screen.queryByTestId('threads-panel-content')).toBeNull();
  });

  it('moves aria-current and swaps the rendered view when another view is selected', async () => {
    await renderSelectorWithPanels();

    const channelsButton = screen.getByRole('button', { name: 'Open channels view' });
    const threadsButton = screen.getByRole('button', { name: 'Open threads view' });

    expect(channelsButton).toHaveAttribute('aria-current', 'true');
    expect(threadsButton).not.toHaveAttribute('aria-current');

    fireEvent.click(threadsButton);

    await waitFor(() => {
      expect(threadsButton).toHaveAttribute('aria-current', 'true');
      expect(channelsButton).not.toHaveAttribute('aria-current');
      expect(screen.getByTestId('threads-panel-content')).toBeInTheDocument();
      expect(screen.queryByTestId('channels-panel-content')).toBeNull();
    });
  });

  it('has no axe violations for the nav landmark and view markup', async () => {
    const { container } = await renderSelectorWithPanels();

    const results = await axe(container);

    expect(results).toHaveNoViolations();
  });
});

describe('ChatView built-in workspace layout empty state', () => {
  const renderWorkspace = async ({
    activeView,
    bindChannel = false,
    ...chatViewProps
  }: Partial<React.ComponentProps<typeof ChatView>> & {
    activeView?: 'channels' | 'threads';
    bindChannel?: boolean;
  } = {}) => {
    const client = await getTestClientWithUser();
    const layoutController = new LayoutController({
      initialState: { activeView, availableSlots: ['slot1', 'slot2'] },
    });
    if (bindChannel) {
      const channel = client.channelManager.ensure({ id: 'general', type: 'messaging' });
      layoutController.bind(
        'slot1',
        createChatViewSlotBinding({ key: channel.cid, kind: 'channel', source: channel }),
      );
    }

    return render(
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
          <ChatView
            layout='nav-rail-entity-list-workspace'
            layoutController={layoutController}
            slotRenderers={{
              channel: ({ source }) => (
                <div data-testid='bound-channel'>{source.cid}</div>
              ),
            }}
            {...chatViewProps}
          />
        </TranslationProvider>
      </ChatProvider>,
    );
  };

  it('shows one placeholder instead of the slots while every slot is empty', async () => {
    const { container } = await renderWorkspace();

    const placeholders = container.querySelectorAll(
      '.str-chat__chat-view__empty-placeholder',
    );
    expect(placeholders).toHaveLength(1);
    expect(placeholders[0]).toHaveTextContent('No chat selected');
    expect(placeholders[0].querySelector('svg')).toBeInTheDocument();
    expect(
      container.querySelector('.str-chat__chat-view__workspace-layout-slot'),
    ).not.toBeInTheDocument();
  });

  it('words the placeholder for the threads view', async () => {
    const { container } = await renderWorkspace({ activeView: 'threads' });

    expect(
      container.querySelector('.str-chat__chat-view__empty-placeholder'),
    ).toHaveTextContent('No thread selected');
  });

  it('shows no placeholder while a slot is in use, leaving the empty slot blank', async () => {
    const { container } = await renderWorkspace({ bindChannel: true });

    expect(screen.getByTestId('bound-channel')).toBeInTheDocument();
    expect(
      container.querySelector('.str-chat__chat-view__empty-placeholder'),
    ).not.toBeInTheDocument();
    expect(
      container.querySelectorAll('.str-chat__chat-view__workspace-layout-slot'),
    ).toHaveLength(2);
  });

  it('renders SlotFallback instead of the placeholder while every slot is empty', async () => {
    const { container } = await renderWorkspace({
      SlotFallback: ({ slot }) => <div data-testid={`fallback-${slot}`} />,
    });

    expect(screen.getByTestId('fallback-slot1')).toBeInTheDocument();
    expect(screen.getByTestId('fallback-slot2')).toBeInTheDocument();
    expect(
      container.querySelector('.str-chat__chat-view__empty-placeholder'),
    ).not.toBeInTheDocument();
  });

  it('renders SlotFallback in an empty slot while another slot is in use', async () => {
    await renderWorkspace({
      bindChannel: true,
      SlotFallback: ({ slot }) => <div data-testid={`fallback-${slot}`} />,
    });

    expect(screen.getByTestId('fallback-slot2')).toBeInTheDocument();
    expect(screen.queryByTestId('fallback-slot1')).not.toBeInTheDocument();
  });
});
