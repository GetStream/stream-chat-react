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
const HIDE_CLASS_NAME = 'str-chat__main-panel--hideOnThread';

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
  it.each([
    ['not add', 'truthy', 'falsy', 'falsy', true, undefined, undefined],
    ['add', 'truthy', 'truthy', 'falsy', true, thread, undefined],
    ['add', 'truthy', 'falsy', 'truthy', true, undefined, thread],
    ['add', 'truthy', 'truthy', 'truthy', true, thread, thread],
    ['not add', 'falsy', 'falsy', 'falsy', false, undefined, undefined],
    ['not add', 'falsy', 'truthy', 'falsy', false, thread, undefined],
    ['not add', 'falsy', 'falsy', 'truthy', false, undefined, thread],
    ['not add', 'falsy', 'truthy', 'truthy', false, thread, thread],
  ])(
    'should %s class str-chat__main-panel--hideOnThread if hideOnThread is %s, prop thread is %s, context thread is %s',
    (expectation, _, __, ___, hideOnThread, propThread, contextThread) => {
      const { container } = renderComponent({
        channelStateContextMock: {
          thread: contextThread,
        },
        children: [<div key='bla'>bla</div>],
        props: { hideOnThread, thread: propThread },
      });

      if (expectation === 'add')
        expect(container.querySelector(`.${HIDE_CLASS_NAME}`)).toBeInTheDocument();
      if (expectation === 'not add')
        expect(container.querySelector(`.${HIDE_CLASS_NAME}`)).not.toBeInTheDocument();
    },
  );
});
