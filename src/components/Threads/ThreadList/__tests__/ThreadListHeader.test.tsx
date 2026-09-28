import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { fromPartial } from '@total-typescript/shoehorn';
import { WithComponents, WorkspaceNavigationProvider } from '../../../../context';
import { TranslationProvider } from '../../../../context/TranslationContext';
import { mockTranslationContextValue } from '../../../../mock-builders';
import { ThreadListHeader } from '../ThreadListHeader';
import { mockT } from '../../../../mock-builders/translator';

const t = vi.fn(mockT);
const HeaderEndContent = () => <div data-testid='sidebar-toggle' />;

afterEach(cleanup);

// The header derives "a thread is active" from the workspace navigation adapter
// (openThreads). Drive it through the real provider.
const renderHeader = ({
  openThreads,
  withHeaderEndContent,
}: {
  openThreads: unknown[];
  withHeaderEndContent: boolean;
}) => {
  const inner = (
    <TranslationProvider value={mockTranslationContextValue({ t })}>
      <ThreadListHeader />
    </TranslationProvider>
  );
  return render(
    <WorkspaceNavigationProvider value={fromPartial({ openThreads })}>
      {withHeaderEndContent ? (
        <WithComponents overrides={{ HeaderEndContent }}>{inner}</WithComponents>
      ) : (
        inner
      )}
    </WorkspaceNavigationProvider>,
  );
};

describe('ThreadListHeader', () => {
  it('should not render HeaderEndContent when not provided via ComponentContext', () => {
    renderHeader({ openThreads: [{}], withHeaderEndContent: false });

    expect(screen.queryByTestId('sidebar-toggle')).not.toBeInTheDocument();
  });

  it('should render HeaderEndContent when a thread is active', () => {
    renderHeader({ openThreads: [{}], withHeaderEndContent: true });

    expect(screen.getByTestId('sidebar-toggle')).toBeInTheDocument();
  });

  it('should not render HeaderEndContent when no thread is active', () => {
    renderHeader({ openThreads: [], withHeaderEndContent: true });

    expect(screen.queryByTestId('sidebar-toggle')).not.toBeInTheDocument();
  });
});
