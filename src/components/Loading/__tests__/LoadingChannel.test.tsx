import React from 'react';

import { cleanup, render } from '@testing-library/react';

import { LoadingChannel } from '../LoadingChannel';

afterEach(cleanup);

describe('LoadingChannel', () => {
  it('should render component with default props', () => {
    const { container } = render(<LoadingChannel />);
    expect(container).toMatchSnapshot();
  });

  it('renders the header placeholders in the same start, data and end columns as ChannelHeader', () => {
    const { container } = render(<LoadingChannel />);
    const header = container.querySelector('.str-chat__channel-header');

    expect(Array.from(header?.children ?? []).map((child) => child.classList[0])).toEqual(
      [
        'str-chat__channel-header__start',
        'str-chat__channel-header__data',
        'str-chat__channel-header__end',
      ],
    );
    expect(
      header?.querySelector(
        '.str-chat__channel-header__data .str-chat__loading-channel-header-name',
      ),
    ).toBeInTheDocument();
    expect(
      header?.querySelector(
        '.str-chat__channel-header__end .str-chat__loading-channel-header-avatar',
      ),
    ).toBeInTheDocument();
  });
});
