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
        channelsQueryState: fromPartial({}),
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
        channelsQueryState: fromPartial({}),
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

    expect(screen.getByRole('tab', { name: 'Channels' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Threads' })).toBeInTheDocument();
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

  it('renders tabs with tablist/tabpanel semantics and tabbable tabs', async () => {
    await renderSelectorWithPanels();

    const tablist = screen.getByRole('tablist', { name: 'Chat view tabs' });
    const channelsTab = screen.getByRole('tab', { name: 'Channels' });
    const threadsTab = screen.getByRole('tab', { name: 'Threads' });

    expect(tablist).toContainElement(channelsTab);
    expect(tablist).toContainElement(threadsTab);
    expect(channelsTab).toHaveAttribute('tabindex', '0');
    expect(threadsTab).toHaveAttribute('tabindex', '0');

    const channelsPanel = document.getElementById(
      channelsTab.getAttribute('aria-controls') || '',
    );
    const threadsPanel = document.getElementById(
      threadsTab.getAttribute('aria-controls') || '',
    );

    expect(channelsPanel).toHaveAttribute('role', 'tabpanel');
    expect(channelsPanel).toHaveAttribute('aria-labelledby', channelsTab.id);
    expect(threadsPanel).toBeNull();
  });

  it('does not switch tabs on arrow keys', async () => {
    await renderSelectorWithPanels();

    const channelsTab = screen.getByRole('tab', { name: 'Channels' });
    const threadsTab = screen.getByRole('tab', { name: 'Threads' });

    channelsTab.focus();
    fireEvent.keyDown(channelsTab, { key: 'ArrowRight' });

    await waitFor(() => {
      expect(channelsTab).toHaveAttribute('aria-selected', 'true');
      expect(channelsTab).toHaveAttribute('tabindex', '0');
      expect(threadsTab).toHaveAttribute('aria-selected', 'false');
      expect(threadsTab).toHaveAttribute('tabindex', '0');
      expect(
        document.getElementById(channelsTab.getAttribute('aria-controls') || ''),
      ).toHaveAttribute('role', 'tabpanel');
      expect(
        document.getElementById(threadsTab.getAttribute('aria-controls') || ''),
      ).toBeNull();
    });
  });

  it('has no axe violations for tabs and panels markup', async () => {
    const { container } = await renderSelectorWithPanels();

    const results = await axe(container);

    expect(results).toHaveNoViolations();
  });
});
