import React, { useEffect, useContext } from 'react';
import { render, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
// eslint-disable-next-line import/no-extraneous-dependencies
import axios from 'axios';
import Visibility from 'visibilityjs';
import Channel from '../Channel';
import { Chat } from '../../Chat';
import { ChannelContext, ChatContext } from '../../../context';
import {
  useMockedApis,
  generateMember,
  generateMessage,
  generateChannel,
  getTestClientWithUser,
  getOrCreateChannelApi,
  getThreadReplies,
  generateUser,
} from '../../../mock-builders';
import { LoadingErrorIndicator } from '../../Loading';

jest.mock('axios');
jest.mock('../../Loading', () => ({
  LoadingIndicator: jest.fn(() => <div>loading</div>),
  LoadingErrorIndicator: jest.fn(() => <div />),
}));

jest.mock('visibilityjs');

let chatClient;
let channel;

const CallbackEffectWithChannelContext = ({ callback }) => {
  const channelContext = useContext(ChannelContext);
  useEffect(() => {
    callback(channelContext);
  }, [callback, channelContext]);

  return null;
};
const ActiveChannelSetter = ({ activeChannel }) => {
  const { setActiveChannel } = useContext(ChatContext);
  useEffect(() => {
    setActiveChannel(activeChannel);
  });
  return null;
};

const user = generateUser({ name: 'name', id: 'id' });
const messages = [generateMessage({ user })];
const renderComponent = (props = {}, callback = () => {}) =>
  render(
    <Chat client={chatClient}>
      <ActiveChannelSetter activeChannel={channel} />
      <Channel>
        {props.children}
        <CallbackEffectWithChannelContext callback={callback} />
      </Channel>
    </Chat>,
  );

describe('Channel', () => {
  beforeEach(async () => {
    const members = [generateMember({ user })];
    const mockedChannel = generateChannel({
      messages,
      members,
    });
    useMockedApis(axios, [getOrCreateChannelApi(mockedChannel)]);
    chatClient = await getTestClientWithUser(user);
    channel = chatClient.channel('messaging', mockedChannel.id);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should render the EmptyPlaceholder prop if the channel is not provided by the ChatContext', () => {
    const { getByText } = render(
      <Channel EmptyPlaceholder={<div>empty</div>}></Channel>,
    );

    expect(getByText('empty')).toBeInTheDocument();
  });

  it('should watch the current channel on mount', async () => {
    const watchSpy = jest.spyOn(channel, 'watch');

    renderComponent();

    await waitFor(() => expect(watchSpy).toHaveBeenCalledTimes(1));
  });

  it('should set an error if watching the channel goes wrong, and render a LoadingErrorIndicator', async () => {
    const watchError = new Error('watching went wrong');
    jest
      .spyOn(channel, 'watch')
      .mockImplementationOnce(() => Promise.reject(watchError));

    renderComponent();

    await waitFor(() =>
      expect(LoadingErrorIndicator).toHaveBeenCalledWith(
        expect.objectContaining({
          error: watchError,
        }),
        expect.any(Object),
      ),
    );
  });

  it('should render a LoadingIndicator if it is loading', async () => {
    const watchPromise = new Promise(() => {});
    jest.spyOn(channel, 'watch').mockImplementationOnce(() => watchPromise);

    const { getByText } = renderComponent();

    await waitFor(() => expect(getByText('loading')).toBeInTheDocument());
  });

  it('should provide context and render children if channel is set and the component is not loading or errored', () => {
    const { findByText } = renderComponent({ children: <div>children</div> });

    expect(findByText('children')).toBeInTheDocument();
  });

  // should these 'on' tests actually test if the handler works?
  it('should add a connection recovery handler on the client on mount', async () => {
    const clientOnSpy = jest.spyOn(chatClient, 'on');

    renderComponent();

    await waitFor(() =>
      expect(clientOnSpy).toHaveBeenCalledWith(
        'connection.recovered',
        expect.any(Function),
      ),
    );
  });

  it('should add an `on` handler to the channel on mount', async () => {
    const channelOnSpy = jest.spyOn(channel, 'on');
    renderComponent();

    await waitFor(() =>
      expect(channelOnSpy).toHaveBeenCalledWith(expect.any(Function)),
    );
  });

  it('should mark the current channel as read if the user switches to the current window', async () => {
    // This mocks the Visibilityjs module so it immediately calls the change callback with state === 'visible'
    jest.spyOn(Visibility, 'change').mockImplementationOnce((callback) => {
      callback(new Event('change'), 'visible');
    });
    const markReadSpy = jest.spyOn(channel, 'markRead');

    renderComponent();

    await waitFor(() => expect(markReadSpy).toHaveBeenCalledWith());
  });

  it('should mark the channel as read if the count of unread messages is higher than 0 on mount', async () => {
    jest.spyOn(channel, 'countUnread').mockImplementationOnce(() => 1);
    const markReadSpy = jest.spyOn(channel, 'markRead');

    renderComponent();

    await waitFor(() => expect(markReadSpy).toHaveBeenCalledWith());
  });

  describe('Children that consume ChannelContext', () => {
    it('should be able to open threads', async () => {
      const threadMessage = messages[0];
      const hasThread = jest.fn();

      // this renders Channel, calls openThread from a child context consumer with a message,
      // and then calls hasThread with the thread id if it was set.
      renderComponent({}, ({ openThread, thread }) => {
        if (!thread) {
          openThread(threadMessage);
        } else {
          hasThread(thread.id);
        }
      });

      await waitFor(() =>
        expect(hasThread).toHaveBeenCalledWith(threadMessage.id),
      );
    });

    it('should be able to load more messages in a thread', async () => {
      const getRepliesSpy = jest.spyOn(channel, 'getReplies');
      const threadMessage = messages[0];

      const replies = [generateMessage({ parent_id: threadMessage.id })];

      useMockedApis(axios, [getThreadReplies(replies)]);

      const hasThreadMessages = jest.fn();

      renderComponent(
        {},
        ({ openThread, thread, loadMoreThread, threadMessages }) => {
          if (!thread) {
            // first, open a thread
            openThread(threadMessage);
          } else if (!threadMessages.length) {
            // then, load more messages in the thread
            loadMoreThread();
          } else {
            // then, call our mock fn so we can verify what was passed as threadMessages
            hasThreadMessages(threadMessages);
          }
        },
      );

      await waitFor(() => {
        expect(getRepliesSpy).toHaveBeenCalledWith(
          threadMessage.id,
          expect.any(Object),
        );
      });
      await waitFor(() => {
        expect(hasThreadMessages).toHaveBeenCalledWith(replies);
      });
    });
  });

  // TODO: all unmount tests
});
