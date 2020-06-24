import React from 'react';
// eslint-disable-next-line import/no-extraneous-dependencies
import axios from 'axios';
import { render, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';

import {
  useMockedApis,
  queryChannelsApi,
  generateChannel,
  generateMessage,
  dispatchMessageNewEvent,
  dispatchMessageUpdatedEvent,
  dispatchMessageDeletedEvent,
  getTestClientWithUser,
  getRandomInt,
} from 'mock-builders';

import { Chat } from '../../Chat';
import ChannelPreview from '../ChannelPreview';

jest.mock('axios');

const PreviewUIComponent = (props) => {
  return (
    <>
      <div data-testid="channel-id">{props.channel.id}</div>
      <div data-testid="unread-count">{props.unread}</div>
      <div data-testid="last-event-message">
        {props.lastMessage && props.lastMessage.text}
      </div>
    </>
  );
};

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
  const renderComponent = (props, renderer) => {
    return renderer(
      <Chat client={chatClientUthred}>
        <ChannelPreview
          Preview={PreviewUIComponent}
          setActiveChannel={jest.fn()}
          {...props}
        />
      </Chat>,
    );
  };

  beforeEach(async () => {
    chatClientUthred = await getTestClientWithUser({ id: 'uthred' });
    useMockedApis(axios, [
      queryChannelsApi([generateChannel(), generateChannel()]),
    ]);

    [c0, c1] = await chatClientUthred.queryChannels({}, {});
  });

  // eslint-disable-next-line jest/expect-expect
  it('should mark channel as read, when set as active channel', async () => {
    // Mock the countUnread function on channel, to return 10.
    c0.countUnread = () => 10;

    const { getByTestId, rerender } = renderComponent(
      {
        channel: c0,
        activeChannel: c1,
      },
      render,
    );
    // Wait for list of channels to load in DOM.
    await expectUnreadCountToBe(getByTestId, 10);

    renderComponent(
      {
        channel: c0,
        activeChannel: c0,
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
          channel: c0,
          activeChannel: c1,
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
          channel: c0,
          activeChannel: c1,
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
          channel: c0,
          activeChannel: c0,
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
  });
});
