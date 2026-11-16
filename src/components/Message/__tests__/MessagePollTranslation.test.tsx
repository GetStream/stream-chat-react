import React from 'react';
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { fromPartial } from '@total-typescript/shoehorn';
import type { Channel, LocalMessage, StreamChat } from 'stream-chat';

import { Message } from '../Message';
import type { MessageProps } from '../types';
import { Chat } from '../../Chat';
import {
  ChannelActionProvider,
  ChannelStateProvider,
  MessageTranslationViewProvider,
} from '../../../context';
import {
  generateChannel,
  generateMessage,
  generatePoll,
  generateUser,
  getOrCreateChannelApi,
  getTestClientWithUser,
  mockChannelActionContext,
  mockChannelStateContext,
  useMockedApis,
} from '../../../mock-builders';

vi.mock('../../ChatView', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../ChatView')>();
  return {
    ...actual,
    useChatViewContext: vi.fn(() => ({
      activeChatView: 'channels',
      setActiveChatView: vi.fn(),
    })),
    useThreadsViewContext: vi.fn(() => ({
      activeThread: undefined,
      setActiveThread: vi.fn(),
    })),
  };
});

const POLL_TITLE_SELECTOR = '.str-chat__poll-title';

const reader = generateUser({ id: 'reader', language: 'en' });
const author = generateUser({ id: 'author' });

describe('a poll message', () => {
  let channel: Channel;
  let client: StreamChat;

  beforeEach(async () => {
    const mockedChannel = generateChannel(
      fromPartial<Parameters<typeof generateChannel>[0]>({ state: { membership: {} } }),
    );
    client = await getTestClientWithUser(reader);
    useMockedApis(client, [getOrCreateChannelApi(mockedChannel)]);
    channel = client.channel('messaging', mockedChannel.channel.id);
  });

  afterEach(cleanup);

  it("switches the poll with the message's translation view", async () => {
    const poll = generatePoll({
      id: 'translated-poll',
      name: 'Welcher Ort?',
      name_i18n: { en_text: 'Which venue?', language: 'de' },
    });
    const message = generateMessage({
      poll,
      poll_id: poll.id,
      text: '',
      user: author,
    }) as unknown as LocalMessage;
    client.polls.hydratePollCache([message]);

    let result!: ReturnType<typeof render>;
    await act(() => {
      result = render(
        <Chat client={client}>
          <ChannelStateProvider
            value={mockChannelStateContext({
              channel,
              channelCapabilities: { 'cast-poll-vote': true },
            })}
          >
            <ChannelActionProvider value={mockChannelActionContext()}>
              <MessageTranslationViewProvider>
                <Message {...fromPartial<MessageProps>({ message, threadList: false })} />
              </MessageTranslationViewProvider>
            </ChannelActionProvider>
          </ChannelStateProvider>
        </Chat>,
      );
    });
    const { container, getByText } = result;
    const pollTitle = () => container.querySelector(POLL_TITLE_SELECTOR);

    expect(pollTitle()).toHaveTextContent('Which venue?');

    await act(() => fireEvent.click(getByText('View original')));

    expect(pollTitle()).toHaveTextContent('Welcher Ort?');
  });
});
