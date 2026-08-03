import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';

import { fromPartial } from '@total-typescript/shoehorn';
import { axe } from '../../../../axe-helper';
import { ChatProvider, TranslationProvider } from '../../../context';
import {
  getTestClientWithUser,
  mockTranslationContextValue,
} from '../../../mock-builders';
import { ChatView } from '../ChatView';

const renderSelector = async (selectorProps?: any) => {
  const client = await getTestClientWithUser();

  return render(
    <ChatProvider
      value={{
        client,
        getAppSettings: vi.fn(),
        latestMessageDatesByChannels: {},
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
        latestMessageDatesByChannels: {},
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
