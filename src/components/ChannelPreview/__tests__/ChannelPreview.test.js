import React from 'react';
import { act, render, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

import {
  dispatchMessageDeletedEvent,
  dispatchMessageNewEvent,
  dispatchMessageUpdatedEvent,
  generateChannel,
  generateMessage,
  getRandomInt,
  getTestClientWithUser,
  queryChannelsApi,
  useMockedApis,
} from 'mock-builders';

import { ChatContext } from '../../../context';
import { ChannelPreview } from '../ChannelPreview';

const PreviewUIComponent = (props) => (
  <>
    <div data-testid='channel-id'>{props.channel.id}</div>
    <div data-testid='unread-count'>{props.unread}</div>
    <div data-testid='last-event-message'>{props.lastMessage && props.lastMessage.text}</div>
  </>
);

const expectUnreadCountToBe = async (getByTestId, expectedValue) => {
  await waitFor(() => {
    expect(getByTestId('unread-count')).toHaveTextContent(expectedValue);
  });
};
const expectLastEventMessageToBe = async (getByTestId, expectedValue) => {
  await waitFor(() => {
    expect(getByTestId('last-event-message')).toHaveTextContent(expectedValue);
  });
};

describe('ChannelPreview', () => {
  let chatClientUthred;
  let c0;
  let c1;
  const renderComponent = (props, renderer) =>
    renderer(
      <ChatContext.Provider
        value={{
          channel: props.activeChannel,
          client: chatClientUthred,
          setActiveChannel: () => jest.fn(),
        }}
      >
        <ChannelPreview Preview={PreviewUIComponent} {...props} />
      </ChatContext.Provider>,
    );

  beforeEach(async () => {
    chatClientUthred = await getTestClientWithUser({ id: 'uthred' });
    useMockedApis(chatClientUthred, [queryChannelsApi([generateChannel(), generateChannel()])]);

    [c0, c1] = await chatClientUthred.queryChannels({}, {});
  });

  // eslint-disable-next-line jest/expect-expect
  it('should mark channel as read, when set as active channel', async () => {
    // Mock the countUnread function on channel, to return 10.
    c0.countUnread = () => 10;

    const { getByTestId, rerender } = renderComponent(
      {
        activeChannel: c1,
        channel: c0,
      },
      render,
    );
    // Wait for list of channels to load in DOM.
    await expectUnreadCountToBe(getByTestId, 10);

    renderComponent(
      {
        activeChannel: c0,
        channel: c0,
      },
      rerender,
    );

    await expectUnreadCountToBe(getByTestId, 0);
  });

  const eventCases = [
    ['message.new', dispatchMessageNewEvent],
    ['message.updated', dispatchMessageUpdatedEvent],
    ['message.deleted', dispatchMessageDeletedEvent],
  ];

  describe.each(eventCases)('On %s event', (eventType, dispatcher) => {
    it('should update lastMessage', async () => {
      const newUnreadCount = getRandomInt(1, 10);
      c0.countUnread = () => newUnreadCount;

      const { getByTestId } = renderComponent(
        {
          activeChannel: c1,
          channel: c0,
        },
        render,
      );

      await waitFor(() => {
        expect(getByTestId('channel-id')).toBeInTheDocument();
      });

      const message = generateMessage();
      act(() => {
        dispatcher(chatClientUthred, message, c0);
      });

      await expectLastEventMessageToBe(getByTestId, message.text);
    });

    // eslint-disable-next-line jest/expect-expect
    it('should update unreadCount, in case of inactive channel', async () => {
      let newUnreadCount = getRandomInt(1, 10);
      c0.countUnread = () => newUnreadCount;

      const { getByTestId } = renderComponent(
        {
          activeChannel: c1,
          channel: c0,
        },
        render,
      );

      await expectUnreadCountToBe(getByTestId, newUnreadCount);

      newUnreadCount = getRandomInt(1, 10);
      const message = generateMessage();
      act(() => {
        dispatcher(chatClientUthred, message, c0);
      });

      await expectUnreadCountToBe(getByTestId, newUnreadCount);
    });

    // eslint-disable-next-line jest/expect-expect
    it('should set unreadCount to 0, in case of active channel', async () => {
      const { getByTestId } = renderComponent(
        {
          activeChannel: c0,
          channel: c0,
        },
        render,
      );
      await expectUnreadCountToBe(getByTestId, 0);

      const message = generateMessage();
      act(() => {
        dispatcher(chatClientUthred, message, c0);
      });
      await expectUnreadCountToBe(getByTestId, 0);
    });

    // eslint-disable-next-line jest/expect-expect
    it('should set unreadCount to 0, in case of muted channel', async () => {
      const channelMuteSpy = jest
        .spyOn(c0, 'muteStatus')
        .mockImplementation(() => ({ muted: true }));

      const { getByTestId } = renderComponent(
        {
          activeChannel: c1,
          channel: c0,
        },
        render,
      );

      await waitFor(() => {
        expect(channelMuteSpy).toHaveBeenCalledWith();
      });

      await expectUnreadCountToBe(getByTestId, 0);

      const message = generateMessage();
      act(() => {
        dispatcher(chatClientUthred, message, c0);
      });
      await expectUnreadCountToBe(getByTestId, 0);
    });
  });
});
