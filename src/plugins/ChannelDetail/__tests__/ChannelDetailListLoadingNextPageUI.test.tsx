import React from 'react';
import { render, screen } from '@testing-library/react';
import { StateStore } from '@stream-io/state-store';
import type { SearchSource } from 'stream-chat';
import { fromPartial } from '@total-typescript/shoehorn';

import { WithComponents } from '../../../context';
import type { ListLoadingNextPageUIProps } from '../../../components/ListStates';
import { ChannelDetailListLoadingNextPageUI } from '../ListStates';

const searchSourceWith = (state: { hasNext: boolean; isLoading: boolean }) =>
  fromPartial<SearchSource>({ state: new StateStore(state) });

const CustomLoadingIndicator = () => <div data-testid='custom-loading-indicator' />;

const AppListLoadingNextPageIndicator = ({
  isLoading,
  position,
}: ListLoadingNextPageUIProps) => (
  <div data-testid='app-next-page'>{`${position} ${isLoading}`}</div>
);

describe('ChannelDetailListLoadingNextPageUI', () => {
  it('renders the LoadingIndicator from ComponentContext while the next page loads', () => {
    const searchSource = searchSourceWith({ hasNext: true, isLoading: true });

    const { container } = render(
      <WithComponents overrides={{ LoadingIndicator: CustomLoadingIndicator }}>
        <ChannelDetailListLoadingNextPageUI searchSource={searchSource} />
      </WithComponents>,
    );

    expect(screen.getByTestId('custom-loading-indicator')).toBeInTheDocument();
    expect(
      container.querySelector('.str-chat__loading-indicator'),
    ).not.toBeInTheDocument();
  });

  it('renders ListLoadingNextPageUI over the LoadingIndicator while the next page loads', () => {
    const { container } = render(
      <WithComponents
        overrides={{
          ListLoadingNextPageUI: AppListLoadingNextPageIndicator,
          LoadingIndicator: CustomLoadingIndicator,
        }}
      >
        <ChannelDetailListLoadingNextPageUI
          searchSource={searchSourceWith({ hasNext: true, isLoading: true })}
        />
      </WithComponents>,
    );

    expect(
      container.querySelector(
        '.str-chat__loading-indicator-placeholder [data-testid="app-next-page"]',
      ),
    ).toHaveTextContent('bottom true');
    expect(screen.queryByTestId('custom-loading-indicator')).not.toBeInTheDocument();
  });

  it('renders nothing for a set LoadingIndicator while no page loads', () => {
    const { container } = render(
      <WithComponents overrides={{ LoadingIndicator: CustomLoadingIndicator }}>
        <ChannelDetailListLoadingNextPageUI
          searchSource={searchSourceWith({ hasNext: true, isLoading: false })}
        />
      </WithComponents>,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('renders no spinner while the LoadingIndicator is null', () => {
    render(
      <WithComponents
        overrides={{
          // Apps turn the spinners off with `null`, which the key's type does not name.
          LoadingIndicator: null as unknown as undefined,
        }}
      >
        <ChannelDetailListLoadingNextPageUI
          searchSource={searchSourceWith({ hasNext: true, isLoading: true })}
        />
      </WithComponents>,
    );

    expect(
      document.querySelector('.str-chat__loading-indicator'),
    ).not.toBeInTheDocument();
  });

  it('renders ListLoadingNextPageUI while no LoadingIndicator is set', () => {
    render(
      <WithComponents
        overrides={{ ListLoadingNextPageUI: AppListLoadingNextPageIndicator }}
      >
        <ChannelDetailListLoadingNextPageUI
          searchSource={searchSourceWith({ hasNext: true, isLoading: true })}
        />
      </WithComponents>,
    );

    expect(screen.getByTestId('app-next-page')).toHaveTextContent('bottom true');
  });
});
