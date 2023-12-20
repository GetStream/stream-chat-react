import React from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

import { ChannelPreview } from '../ChannelPreview';
import { Chat } from '../../Chat';

import { ChatContext } from '../../../context/ChatContext';

import {
  dispatchMessageDeletedEvent,
  dispatchMessageNewEvent,
  dispatchMessageUpdatedEvent,
  dispatchNotificationMarkRead,
  dispatchNotificationMarkUnread,
  dispatchUserUpdatedEvent,
  generateChannel,
  generateMember,
  generateMessage,
  generateUser,
  getRandomInt,
  getTestClientWithUser,
  queryChannelsApi,
  useMockedApis,
} from 'mock-builders';

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

const user = { id: 'uthred' };
const otherUser = { id: 'other-user' };

describe('ChannelPreview', () => {
  let client;
  let c0;
  let c1;
  const renderComponent = (props, renderer) =>
    renderer(
      <ChatContext.Provider
        value={{
          channel: props.activeChannel,
          client,
          setActiveChannel: () => jest.fn(),
        }}
      >
        <ChannelPreview Preview={PreviewUIComponent} {...props} />
      </ChatContext.Provider>,
    );

  beforeEach(async () => {
    client = await getTestClientWithUser(user);
    useMockedApis(client, [queryChannelsApi([generateChannel(), generateChannel()])]);

    [c0, c1] = await client.queryChannels({}, {});
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

  it('should refresh unread counts on forced update', async () => {
    const originalUnreadCount = 100;
    const newUnreadCount = 200;
    jest
      .spyOn(c0, 'countUnread')
      .mockImplementation()
      .mockImplementationOnce(() => originalUnreadCount)
      .mockImplementationOnce(() => newUnreadCount);
    c0.muteStatus = () => false;

    const { getByTestId, rerender } = renderComponent(
      {
        activeChannel: c1,
        channel: c0,
        channelUpdateCount: 0,
      },
      render,
    );

    await expectUnreadCountToBe(getByTestId, originalUnreadCount);

    renderComponent(
      {
        activeChannel: c1,
        channel: c0,
        channelUpdateCount: 1,
      },
      rerender,
    );
    await expectUnreadCountToBe(getByTestId, newUnreadCount);
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
        dispatcher(client, message, c0);
      });

      await expectLastEventMessageToBe(getByTestId, message.text);
    });

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
        dispatcher(client, message, c0);
      });

      await expectUnreadCountToBe(getByTestId, newUnreadCount);
    });

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
        dispatcher(client, message, c0);
      });
      await expectUnreadCountToBe(getByTestId, 0);
    });

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
        dispatcher(client, message, c0);
      });
      await expectUnreadCountToBe(getByTestId, 0);
    });
  });

  describe('notification.mark_read', () => {
    it('should set unread count to 0 for event missing CID', () => {
      const unreadCount = getRandomInt(1, 10);
      c0.countUnread = () => unreadCount;
      renderComponent(
        {
          activeChannel: c1,
          channel: c0,
        },
        render,
      );
      expectUnreadCountToBe(screen.getByTestId, unreadCount);
      dispatchNotificationMarkRead({ client });
      expectUnreadCountToBe(screen.getByTestId, 0);
    });

    it('should set unread count to 0 for current channel', () => {
      const channelInPreview = c0;
      const unreadCount = getRandomInt(1, 10);
      c0.countUnread = () => unreadCount;
      renderComponent(
        {
          activeChannel: c1,
          channel: channelInPreview,
        },
        render,
      );
      expectUnreadCountToBe(screen.getByTestId, unreadCount);
      dispatchNotificationMarkRead({ channel: channelInPreview, client });
      expectUnreadCountToBe(screen.getByTestId, 0);
    });

    it('should be ignored if not targeted for the current channel', () => {
      const channelInPreview = c0;
      const activeChannel = c1;
      const unreadCount = getRandomInt(1, 10);
      c0.countUnread = () => unreadCount;
      renderComponent(
        {
          activeChannel,
          channel: channelInPreview,
        },
        render,
      );
      expectUnreadCountToBe(screen.getByTestId, unreadCount);
      dispatchNotificationMarkRead({ channel: activeChannel, client });
      expectUnreadCountToBe(screen.getByTestId, unreadCount);
    });
  });
  describe('notification.mark_unread', () => {
    it('should be ignored if not originated from the current user', () => {
      const unreadCount = 0;
      const channelInPreview = c0;
      const activeChannel = c1;
      channelInPreview.countUnread = () => unreadCount;
      renderComponent(
        {
          activeChannel,
          channel: channelInPreview,
        },
        render,
      );
      expectUnreadCountToBe(screen.getByTestId, unreadCount);
      dispatchNotificationMarkUnread({
        channel: channelInPreview,
        client,
        payload: { unread_channels: 2, unread_messages: 5 },
        user: otherUser,
      });
      expectUnreadCountToBe(screen.getByTestId, unreadCount);
    });

    it('should be ignored if not targeted for the current channel', () => {
      const unreadCount = 0;
      const channelInPreview = c0;
      const activeChannel = c1;
      channelInPreview.countUnread = () => unreadCount;
      renderComponent(
        {
          activeChannel,
          channel: channelInPreview,
        },
        render,
      );
      expectUnreadCountToBe(screen.getByTestId, unreadCount);
      dispatchNotificationMarkUnread({
        channel: activeChannel,
        client,
        payload: { unread_channels: 2, unread_messages: 5 },
        user,
      });
      expectUnreadCountToBe(screen.getByTestId, unreadCount);
    });

    it("should set unread count from client's unread count state for active channel", () => {
      const unreadCount = 0;
      const activeChannel = c1;
      activeChannel.countUnread = () => unreadCount;
      renderComponent(
        {
          activeChannel,
          channel: activeChannel,
        },
        render,
      );
      expectUnreadCountToBe(screen.getByTestId, unreadCount);

      const eventPayload = { unread_channels: 2, unread_messages: 5 };
      dispatchNotificationMarkUnread({
        channel: activeChannel,
        client,
        payload: { unread_channels: 2, unread_messages: 5 },
        user,
      });
      expectUnreadCountToBe(screen.getByTestId, eventPayload.unread_messages);
    });

    it("should set unread count from client's unread count state for non-active channel", () => {
      const unreadCount = 0;
      const channelInPreview = c0;
      const activeChannel = c1;
      channelInPreview.countUnread = () => unreadCount;
      renderComponent(
        {
          activeChannel,
          channel: channelInPreview,
        },
        render,
      );
      expectUnreadCountToBe(screen.getByTestId, unreadCount);

      const eventPayload = { unread_channels: 2, unread_messages: 5 };
      dispatchNotificationMarkUnread({
        channel: channelInPreview,
        client,
        payload: { unread_channels: 2, unread_messages: 5 },
        user,
      });
      expectUnreadCountToBe(screen.getByTestId, eventPayload.unread_messages);
    });
  });

  describe('user.updated', () => {
    let chatClient;
    let channels;
    let channelState;
    let otherUser;
    const MockAvatar = ({ image, name }) => (
      <>
        <div className='avatar-name'>{name}</div>
        <div className='avatar-image'>{image}</div>
      </>
    );

    const channelPreviewProps = {
      Avatar: MockAvatar,
    };

    beforeEach(async () => {
      const activeUser = generateUser({
        custom: 'custom1',
        id: 'id1',
        image: 'image1',
        name: 'name1',
      });
      otherUser = generateUser({
        custom: 'custom2',
        id: 'id2',
        image: 'image2',
        name: 'name2',
      });
      channelState = generateChannel({
        members: [generateMember({ user: activeUser }), generateMember({ user: otherUser })],
        messages: [generateMessage({ user: activeUser }), generateMessage({ user: otherUser })],
      });
      chatClient = await getTestClientWithUser(activeUser);
      useMockedApis(chatClient, [queryChannelsApi([channelState])]);
      channels = await chatClient.queryChannels();
    });

    it("should update the direct messaging channel's preview if other user's name has changed", async () => {
      const updatedAttribute = { name: 'new-name' };
      const channel = channels[0];
      render(
        <Chat client={chatClient}>
          <ChannelPreview {...channelPreviewProps} channel={channel} />
        </Chat>,
      );

      await waitFor(() =>
        expect(screen.queryByText(updatedAttribute.name)).not.toBeInTheDocument(),
      );
      act(() => {
        dispatchUserUpdatedEvent(chatClient, { ...otherUser, ...updatedAttribute });
      });
      await waitFor(() =>
        expect(screen.queryAllByText(updatedAttribute.name).length).toBeGreaterThan(0),
      );
    });

    it("should update the direct messaging channel's preview if other user's image has changed", async () => {
      const updatedAttribute = { image: 'new-image' };
      const channel = channels[0];
      render(
        <Chat client={chatClient}>
          <ChannelPreview {...channelPreviewProps} channel={channel} />
        </Chat>,
      );

      await waitFor(() =>
        expect(screen.queryByText(updatedAttribute.image)).not.toBeInTheDocument(),
      );
      act(() => {
        dispatchUserUpdatedEvent(chatClient, { ...otherUser, ...updatedAttribute });
      });
      await waitFor(() =>
        expect(screen.queryAllByText(updatedAttribute.image).length).toBeGreaterThan(0),
      );
    });

    it("should not update the direct messaging channel's preview if other user attribute than name or image has changed", async () => {
      const updatedAttribute = { custom: 'new-custom' };
      const channel = channels[0];
      render(
        <Chat client={chatClient}>
          <ChannelPreview {...channelPreviewProps} channel={channel} />
        </Chat>,
      );

      await waitFor(() =>
        expect(screen.queryByText(updatedAttribute.custom)).not.toBeInTheDocument(),
      );
      act(() => {
        dispatchUserUpdatedEvent(chatClient, { ...otherUser, ...updatedAttribute });
      });
      await waitFor(() =>
        expect(screen.queryByText(updatedAttribute.custom)).not.toBeInTheDocument(),
      );
    });
  });
});
