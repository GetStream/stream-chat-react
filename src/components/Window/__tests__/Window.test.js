import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';

import { Window } from '../Window';

import { ChannelStateProvider } from '../../../context/ChannelStateContext';
import { generateMessage } from '../../../mock-builders';

const renderComponent = ({ channelStateContextMock, children, props }) =>
  render(
    <ChannelStateProvider value={channelStateContextMock}>
      <Window {...props}>{children}</Window>
    </ChannelStateProvider>,
  );

const thread = generateMessage();

describe('Window', () => {
  it('should render its children if hideOnThread is false and thread is truthy', () => {
    const { getByText } = renderComponent({
      channelStateContextMock: {
        thread,
      },
      children: [<div key='bla'>bla</div>],
      props: { hideOnThread: false },
    });

    expect(getByText('bla')).toBeInTheDocument();
  });

  it('should render its children if hideOnThread is true and thread is falsy', () => {
    const { getByText } = renderComponent({
      channelStateContextMock: {
        thread: undefined,
      },
      children: [<div key='bla'>bla</div>],
      props: { hideOnThread: true },
    });

    expect(getByText('bla')).toBeInTheDocument();
  });
});
