import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';

import { Window } from '../Window';

import { ChannelStateProvider } from '../../../context/ChannelStateContext';
import { generateMessage } from '../../../mock-builders';

const renderComponent = ({ channelStateContextMock, props }) =>
  render(
    <ChannelStateProvider value={channelStateContextMock ?? {}}>
      <Window {...props} />
    </ChannelStateProvider>,
  );

const thread = generateMessage();
const THREAD_OPEN_CLASS_NAME = 'str-chat__main-panel--thread-open';

describe('Window', () => {
  it.each([
    ['add', thread],
    ['', undefined],
  ])(
    'should %s class str-chat__main-panel--thread-open when thread is open',
    (_, thread) => {
      const { container } = renderComponent({
        channelStateContextMock: {
          thread,
        },
      });
      if (thread) {
        expect(container.firstChild).toHaveClass(THREAD_OPEN_CLASS_NAME);
      } else {
        expect(container.firstChild).not.toHaveClass(THREAD_OPEN_CLASS_NAME);
      }
    },
  );

  it.each([
    ['add', thread],
    ['', undefined],
  ])(
    'should %s class str-chat__main-panel--thread-open when thread is passed via prop',
    (_, thread) => {
      const { container } = renderComponent({
        props: { thread },
      });

      if (thread) {
        expect(container.firstChild).toHaveClass(THREAD_OPEN_CLASS_NAME);
      } else {
        expect(container.firstChild).not.toHaveClass(THREAD_OPEN_CLASS_NAME);
      }
    },
  );
});
