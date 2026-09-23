import React from 'react';
import { render, screen } from '@testing-library/react';

import { WithComponents } from '../WithComponents';
import { ErrorBadge } from '../../components/Badge/Badge';
import { LoadingIndicator } from '../../components/Loading/LoadingIndicator';
import { CloseButtonOnModalOverlay } from '../../components/Modal/CloseButtonOnModalOverlay';
import { ChannelDetailEmptyList } from '../../plugins/ChannelDetail/ChannelDetailEmptyList';

/**
 * R1 proves the hook merges correctly. This proves the other half: that converted call sites
 * actually read through it, rather than still importing an icon directly.
 */
describe('icon slots reach converted call sites', () => {
  const Custom = () => <svg data-testid='custom-icon' />;

  it('renders the SDK icon with no override', () => {
    render(<LoadingIndicator data-testid='loading' />);

    expect(screen.getByTestId('loading')).toHaveClass('str-chat__loading-indicator');
    expect(screen.queryByTestId('custom-icon')).not.toBeInTheDocument();
  });

  it.each([
    ['LoadingIndicator', 'IconLoading', <LoadingIndicator key='l' />],
    ['ErrorBadge', 'IconExclamationMarkFill', <ErrorBadge key='e' />],
    ['CloseButtonOnModalOverlay', 'IconXmark', <CloseButtonOnModalOverlay key='c' />],
    // a v15-only plugin component, converted in R3
    ['ChannelDetailEmptyList', 'IconSearch', <ChannelDetailEmptyList key='d' />],
  ])('%s honours an %s override', (_name, slot, element) => {
    render(
      <WithComponents overrides={{ icons: { [slot]: Custom } }}>
        {element}
      </WithComponents>,
    );

    expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
  });

  it('an override for one slot does not leak into a component using another', () => {
    render(
      <WithComponents overrides={{ icons: { IconLoading: Custom } }}>
        <ErrorBadge />
      </WithComponents>,
    );

    expect(screen.queryByTestId('custom-icon')).not.toBeInTheDocument();
  });
});
