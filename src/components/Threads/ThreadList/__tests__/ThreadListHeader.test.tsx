import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { WithComponents } from '../../../../context';
import { TranslationProvider } from '../../../../context/TranslationContext';
import { mockTranslationContextValue } from '../../../../mock-builders';
import { ThreadListHeader } from '../ThreadListHeader';

// The header derives "a thread is active" from the ChatView slot bindings
// (useSlotThreads), not a ThreadsViewContext. Mock it to control activeness.
const mockUseSlotThreads = vi.fn();
vi.mock('../../../ChatView', () => ({
  useSlotThreads: () => mockUseSlotThreads(),
}));

const t = vi.fn((key: string) => key);
const HeaderEndContent = () => <div data-testid='sidebar-toggle' />;

afterEach(cleanup);

describe('ThreadListHeader', () => {
  it('should not render HeaderEndContent when not provided via ComponentContext', () => {
    mockUseSlotThreads.mockReturnValue([{ slot: 'main-thread', thread: {} }]);
    render(
      <TranslationProvider value={mockTranslationContextValue({ t })}>
        <ThreadListHeader />
      </TranslationProvider>,
    );

    expect(screen.queryByTestId('sidebar-toggle')).not.toBeInTheDocument();
  });

  it('should render HeaderEndContent when a thread is active', () => {
    mockUseSlotThreads.mockReturnValue([{ slot: 'main-thread', thread: {} }]);
    render(
      <WithComponents overrides={{ HeaderEndContent }}>
        <TranslationProvider value={mockTranslationContextValue({ t })}>
          <ThreadListHeader />
        </TranslationProvider>
      </WithComponents>,
    );

    expect(screen.getByTestId('sidebar-toggle')).toBeInTheDocument();
  });

  it('should not render HeaderEndContent when no thread is active', () => {
    mockUseSlotThreads.mockReturnValue([]);
    render(
      <WithComponents overrides={{ HeaderEndContent }}>
        <TranslationProvider value={mockTranslationContextValue({ t })}>
          <ThreadListHeader />
        </TranslationProvider>
      </WithComponents>,
    );

    expect(screen.queryByTestId('sidebar-toggle')).not.toBeInTheDocument();
  });
});
