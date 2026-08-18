import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { fromPartial } from '@total-typescript/shoehorn';
import { WithComponents, WorkspaceNavigationProvider } from '../../../context';
import { TranslationProvider } from '../../../context/TranslationContext';
import { mockTranslationContextValue } from '../../../mock-builders';
import { ChannelListHeader } from '../ChannelListHeader';
import { mockT } from '../../../mock-builders/translator';

const t = vi.fn(mockT);
const HeaderEndContent = () => <div data-testid='sidebar-toggle' />;

afterEach(cleanup);

// The header derives "a channel is active" from the workspace navigation adapter
// (openChannels). Drive it through the real provider.
const renderHeader = ({
  openChannels,
  withHeaderEndContent,
}: {
  openChannels: unknown[];
  withHeaderEndContent: boolean;
}) => {
  const inner = (
    <TranslationProvider value={mockTranslationContextValue({ t })}>
      <ChannelListHeader />
    </TranslationProvider>
  );
  return render(
    <WorkspaceNavigationProvider value={fromPartial({ openChannels })}>
      {withHeaderEndContent ? (
        <WithComponents overrides={{ HeaderEndContent }}>{inner}</WithComponents>
      ) : (
        inner
      )}
    </WorkspaceNavigationProvider>,
  );
};

describe('ChannelListHeader', () => {
  it('should not render HeaderEndContent when not provided via ComponentContext', () => {
    renderHeader({ openChannels: [{}], withHeaderEndContent: false });

    expect(screen.queryByTestId('sidebar-toggle')).not.toBeInTheDocument();
  });

  it('should render HeaderEndContent when a channel is active', () => {
    renderHeader({ openChannels: [{}], withHeaderEndContent: true });

    expect(screen.getByTestId('sidebar-toggle')).toBeInTheDocument();
  });

  it('should not render HeaderEndContent when no channel is active', () => {
    renderHeader({ openChannels: [], withHeaderEndContent: true });

    expect(screen.queryByTestId('sidebar-toggle')).not.toBeInTheDocument();
  });
});
