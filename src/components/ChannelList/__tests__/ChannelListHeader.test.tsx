import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { WithComponents } from '../../../context';
import { TranslationProvider } from '../../../context/TranslationContext';
import { mockTranslationContextValue } from '../../../mock-builders';
import { ChannelListHeader } from '../ChannelListHeader';

// The header derives "a channel is active" from the ChatView slot bindings
// (useSlotChannels), not ChatContext.channel. Mock it to control activeness.
const mockUseSlotChannels = vi.fn();
vi.mock('../../ChatView', () => ({
  useSlotChannels: () => mockUseSlotChannels(),
}));

const t = vi.fn((key: string) => key);
const HeaderEndContent = () => <div data-testid='sidebar-toggle' />;

afterEach(cleanup);

describe('ChannelListHeader', () => {
  it('should not render HeaderEndContent when not provided via ComponentContext', () => {
    mockUseSlotChannels.mockReturnValue([{ channel: {}, slot: 'slot1' }]);
    render(
      <TranslationProvider value={mockTranslationContextValue({ t })}>
        <ChannelListHeader />
      </TranslationProvider>,
    );

    expect(screen.queryByTestId('sidebar-toggle')).not.toBeInTheDocument();
  });

  it('should render HeaderEndContent when a channel is active', () => {
    mockUseSlotChannels.mockReturnValue([{ channel: {}, slot: 'slot1' }]);
    render(
      <WithComponents overrides={{ HeaderEndContent }}>
        <TranslationProvider value={mockTranslationContextValue({ t })}>
          <ChannelListHeader />
        </TranslationProvider>
      </WithComponents>,
    );

    expect(screen.getByTestId('sidebar-toggle')).toBeInTheDocument();
  });

  it('should not render HeaderEndContent when no channel is active', () => {
    mockUseSlotChannels.mockReturnValue([]);
    render(
      <WithComponents overrides={{ HeaderEndContent }}>
        <TranslationProvider value={mockTranslationContextValue({ t })}>
          <ChannelListHeader />
        </TranslationProvider>
      </WithComponents>,
    );

    expect(screen.queryByTestId('sidebar-toggle')).not.toBeInTheDocument();
  });
});
