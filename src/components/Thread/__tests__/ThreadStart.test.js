import React from 'react';
import '@testing-library/jest-dom';
import { cleanup, render, screen } from '@testing-library/react';

import { ThreadStart } from '../ThreadStart';

import { ChannelStateProvider, ChatProvider, TranslationProvider } from '../../../context';

import { generateMessage, getTestClientWithUser } from '../../../mock-builders';

let client;

const mockedChannel = {
  off: jest.fn(),
  state: {
    members: {},
  },
};

const i18nMock = {
  t: jest.fn((key, props) => {
    if (key === 'replyCount' && props.count === 1) return '1 reply';
    else if (key === 'replyCount' && props.count > 1) return '2 replies';
    return key;
  }),
};

const renderComponent = ({ channelState, client }) =>
  render(
    <ChatProvider value={{ client, latestMessageDatesByChannels: {} }}>
      <TranslationProvider value={i18nMock}>
        <ChannelStateProvider value={channelState}>
          <ThreadStart />
        </ChannelStateProvider>
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
    const channelState = {
      channel: mockedChannel,
      thread: parentMessage,
    };
    const { container } = renderComponent({ channelState, client });
    expect(container.children).toHaveLength(0);
  });
  it('renders if replies exist', () => {
    const parentMessage = generateMessage({ reply_count: 1 });
    const channelState = {
      channel: mockedChannel,
      thread: parentMessage,
    };
    renderComponent({ channelState, client });
    expect(i18nMock.t).toHaveBeenCalledWith('replyCount', {
      count: parentMessage.reply_count,
    });
    expect(screen.queryByText('1 reply')).toBeInTheDocument();
  });
});
