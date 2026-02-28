import React from 'react';
import '@testing-library/jest-dom';
import { cleanup, render, screen } from '@testing-library/react';

import { ThreadStart } from '../ThreadStart';

import { ChatProvider, TranslationProvider } from '../../../context';
import { ThreadProvider } from '../../Threads/ThreadContext';

import { generateMessage, getTestClientWithUser } from '../../../mock-builders';

let client;

const i18nMock = {
  t: jest.fn((key, props) => {
    if (key === 'replyCount' && props.count === 1) return '1 reply';
    else if (key === 'replyCount' && props.count > 1) return '2 replies';
    return key;
  }),
};

const makeThread = (parentMessage) => ({
  state: {
    getLatestValue: () => ({ parentMessage }),
    subscribeWithSelector: () => () => null,
  },
});

const renderComponent = ({ client, thread }) =>
  render(
    <ChatProvider value={{ client, latestMessageDatesByChannels: {} }}>
      <TranslationProvider value={i18nMock}>
        <ThreadProvider thread={thread}>
          <ThreadStart />
        </ThreadProvider>
      </TranslationProvider>
    </ChatProvider>,
  );

describe('ThreadStart', () => {
  beforeEach(async () => {
    client = await getTestClientWithUser();
  });

  afterEach(cleanup);

  it('does not render if no replies', () => {
    const parentMessage = generateMessage();
    const { container } = renderComponent({
      client,
      thread: makeThread(parentMessage),
    });
    expect(container.children).toHaveLength(0);
  });
  it('renders if replies exist', () => {
    const parentMessage = generateMessage({ reply_count: 1 });
    renderComponent({ client, thread: makeThread(parentMessage) });
    expect(i18nMock.t).toHaveBeenCalledWith('replyCount', {
      count: parentMessage.reply_count,
    });
    expect(screen.queryByText('1 reply')).toBeInTheDocument();
  });
});
