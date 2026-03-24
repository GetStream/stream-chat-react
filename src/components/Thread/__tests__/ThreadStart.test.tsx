import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';

import { ThreadStart } from '../ThreadStart';

import {
  ChannelStateProvider,
  ChatProvider,
  TranslationProvider,
} from '../../../context';

import { generateMessage, getTestClientWithUser } from '../../../mock-builders';

let client: any;

const mockedChannel = {
  off: vi.fn(),
  state: {
    members: {},
  },
};

const i18nMock = {
  t: vi.fn((key: string, props: any) => {
    if (key === 'replyCount' && props.count === 1) return '1 reply';
    else if (key === 'replyCount' && props.count > 1) return '2 replies';
    return key;
  }),
};

const renderComponent = ({ channelState, client }: any) =>
  render(
    <ChatProvider value={{ client, latestMessageDatesByChannels: {} } as any}>
      <TranslationProvider value={i18nMock as any}>
        <ChannelStateProvider value={channelState as any}>
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
