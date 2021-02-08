import React from 'react';
import { render } from '@testing-library/react';
import { generateMessage } from 'mock-builders';
import '@testing-library/jest-dom';
import { ChannelContext } from '../../../context';
import Window from '../Window';

const renderComponent = ({ channelContextMock, children, props }) =>
  render(
    <ChannelContext.Provider value={channelContextMock}>
      <Window {...props}>{children}</Window>
    </ChannelContext.Provider>,
  );

const thread = generateMessage();

describe('Window', () => {
  it('should render its children if hideOnThread is false and thread is truthy', () => {
    const { getByText } = renderComponent({
      channelContextMock: {
        hideOnThread: false,
        thread,
      },
      children: [<div key='bla'>bla</div>],
    });

    expect(getByText('bla')).toBeInTheDocument();
  });

  it('should not render its children if hideOnThread is true and thread is truthy', () => {
    const { queryByText } = renderComponent({
      channelContextMock: {
        thread,
      },
      children: [<div key='bla'>bla</div>],
      props: { hideOnThread: true },
    });

    expect(queryByText('bla')).not.toBeInTheDocument();
  });

  it('should render its children if hideOnThread is true and thread is falsy', () => {
    const { getByText } = renderComponent({
      channelContextMock: {
        hideOnThread: true,
        thread: undefined,
      },
      children: [<div key='bla'>bla</div>],
    });

    expect(getByText('bla')).toBeInTheDocument();
  });
});
