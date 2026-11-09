import React from 'react';
import { render, screen } from '@testing-library/react';
import { StateStore } from '@stream-io/state-store';
import type { SearchSource } from 'stream-chat';
import { fromPartial } from '@total-typescript/shoehorn';

import { WithComponents } from '../../../context';
import { ChannelDetailListLoadingIndicator } from '../ChannelDetailListLoadingIndicator';

describe('ChannelDetailListLoadingIndicator', () => {
  it('renders the LoadingIndicator from ComponentContext while the next page loads', () => {
    const searchSource = fromPartial<SearchSource>({
      state: new StateStore({ hasNext: true, isLoading: true }),
    });
    const CustomLoadingIndicator = () => <div data-testid='custom-loading-indicator' />;

    const { container } = render(
      <WithComponents overrides={{ LoadingIndicator: CustomLoadingIndicator }}>
        <ChannelDetailListLoadingIndicator searchSource={searchSource} />
      </WithComponents>,
    );

    expect(screen.getByTestId('custom-loading-indicator')).toBeInTheDocument();
    expect(
      container.querySelector('.str-chat__loading-indicator'),
    ).not.toBeInTheDocument();
  });
});
