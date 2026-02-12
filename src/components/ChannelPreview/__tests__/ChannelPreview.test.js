import React from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

import { ChannelAvatar } from '../../Avatar';
import { ChannelPreview } from '../ChannelPreview';
import { Chat } from '../../Chat';

import { ChatContext } from '../../../context/ChatContext';

import {
  dispatchChannelTruncatedEvent,
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
import { initClientWithChannels } from '../../../mock-builders';

const EMPTY_CHANNEL_PREVIEW_TEXT = 'Empty channel';
const AVATAR_IMG_TEST_ID = 'avatar-img';

const PreviewUIComponent = (props) => (
  <>
    <div data-testid='channel-id'>{props.channel.id}</div>
    <div data-testid='unread-count'>{props.unread}</div>
    <div data-testid='last-event-message'>
      {props.lastMessage ? props.lastMessage.text : EMPTY_CHANNEL_PREVIEW_TEXT}
    </div>
  </>
);
const PreviewUIComponentWithLatestMessagePreview = (props) => (
  <>
    <div data-testid='channel-id'>{props.channel.id}</div>
    <div data-testid='unread-count'>{props.unread}</div>
    <div data-testid='last-event-message'>
      {props.lastMessage ? props.latestMessagePreview : EMPTY_CHANNEL_PREVIEW_TEXT}
    </div>
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
    useMockedApis(client, [
      queryChannelsApi([
        generateChannel({
          channel: { name: 'c0' },
          messages: Array.from({ length: 5 }, generateMessage),
        }),
        generateChannel({
          channel: { name: 'c1' },
          messages: Array.from({ length: 5 }, generateMessage),
        }),
      ]),
    ]);

    [c0, c1] = await client.queryChannels({}, {});
  });

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

  it('allows to customize latest message preview generation', async () => {
    const getLatestMessagePreview = (channel) => channel.data.name;

    const { getByTestId } = renderComponent(
      {
        activeChannel: c0,
        channel: c0,
        getLatestMessagePreview,
        Preview: PreviewUIComponentWithLatestMessagePreview,
      },
      render,
    );

    await expectLastEventMessageToBe(getByTestId, c0.data.name);
  });

  it('allows to imperatively state the component represents an active channel', () => {
    const previewUITestId = 'preview-ui-test-id';
    const ChannelPreviewUI = ({ active }) => (
      <div data-isactive={active} data-testid={previewUITestId} />
    );
    const { rerender } = renderComponent(
      {
        activeChannel: c1,
        channel: c0,
        Preview: ChannelPreviewUI,
      },
      render,
    );
    const previewUI = screen.getByTestId(previewUITestId);
    expect(previewUI).toBeInTheDocument();
    expect(previewUI).toHaveAttribute('data-isactive', 'false');

    renderComponent(
      {
        active: true,
        activeChannel: c1,
        channel: c0,
        Preview: ChannelPreviewUI,
      },
      rerender,
    );
    expect(previewUI).toBeInTheDocument();
    expect(previewUI).toHaveAttribute('data-isactive', 'true');
  });

  const eventCases = [
    ['message.new', dispatchMessageNewEvent],
    ['message.updated', dispatchMessageUpdatedEvent],
    ['message.deleted', dispatchMessageDeletedEvent],
    ['message.undeleted', dispatchMessageDeletedEvent],
  ];

  describe.each(eventCases)('On %s event', (eventType, dispatcher) => {
    it('should update latest message preview', async () => {
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

      const message =
        eventType === 'message.new' ? generateMessage() : c0.state.messages.slice(-1)[0];
      await act(async () => {
        await dispatcher(client, message, c0);
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

    it("should reflect client's unreadCount in case of active channel", async () => {
      let unreadCount = 0;
      const countUnreadSpy = jest.spyOn(c0, 'countUnread');
      countUnreadSpy.mockReturnValueOnce(unreadCount);
      const { getByTestId } = renderComponent(
        {
          activeChannel: c0,
          channel: c0,
        },
        render,
      );
      await expectUnreadCountToBe(getByTestId, unreadCount);

      unreadCount = 10e10;
      countUnreadSpy.mockReturnValueOnce(unreadCount);
      const message = generateMessage();
      act(() => {
        dispatcher(client, message, c0);
      });
      await expectUnreadCountToBe(getByTestId, unreadCount);

      countUnreadSpy.mockRestore();
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

  it('on channel.truncated event should update latest message preview', async () => {
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

    await act(async () => {
      await dispatchChannelTruncatedEvent(client, c0);
    });

    await expectLastEventMessageToBe(getByTestId, EMPTY_CHANNEL_PREVIEW_TEXT);
  });

  it.each([
    ['message.updated', dispatchMessageUpdatedEvent],
    ['message.deleted', dispatchMessageDeletedEvent],
    ['message.undeleted', dispatchMessageDeletedEvent],
  ])(
    'on %s event should not update latest message preview for the non-last message',
    async (_, dispatcher) => {
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

      const lastMessage = c0.state.messages.slice(-1)[0];
      const penultimateMessage = c0.state.messages.slice(-2)[0];
      await act(async () => {
        await dispatcher(client, penultimateMessage, c0);
      });

      await expectLastEventMessageToBe(getByTestId, lastMessage.text);
    },
  );

  describe('notification.mark_read', () => {
    it('should set unread count to 0 for event missing CID', async () => {
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
      await act(() => {
        dispatchNotificationMarkRead({ client });
      });
      expectUnreadCountToBe(screen.getByTestId, 0);
    });

    it('should set unread count to 0 for current channel', async () => {
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
      await act(() => {
        dispatchNotificationMarkRead({ channel: channelInPreview, client });
      });
      expectUnreadCountToBe(screen.getByTestId, 0);
    });

    it('should be ignored if not targeted for the current channel', async () => {
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
      await act(() => {
        dispatchNotificationMarkRead({ channel: activeChannel, client });
      });
      expectUnreadCountToBe(screen.getByTestId, unreadCount);
    });
  });

  describe('notification.mark_unread', () => {
    it('should be ignored if not originated from the current user', async () => {
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
      await act(() => {
        dispatchNotificationMarkUnread({
          channel: channelInPreview,
          client,
          payload: { unread_channels: 2, unread_messages: 5 },
          user: otherUser,
        });
      });
      expectUnreadCountToBe(screen.getByTestId, unreadCount);
    });

    it('should be ignored if not targeted for the current channel', async () => {
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
      await act(() => {
        dispatchNotificationMarkUnread({
          channel: activeChannel,
          client,
          payload: { unread_channels: 2, unread_messages: 5 },
          user,
        });
      });
      expectUnreadCountToBe(screen.getByTestId, unreadCount);
    });

    it("should set unread count from client's unread count state for active channel", async () => {
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
      await act(() => {
        dispatchNotificationMarkUnread({
          channel: activeChannel,
          client,
          payload: { unread_channels: 2, unread_messages: 5 },
          user,
        });
      });
      expectUnreadCountToBe(screen.getByTestId, eventPayload.unread_messages);
    });

    it("should set unread count from client's unread count state for non-active channel", async () => {
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
      await act(() => {
        dispatchNotificationMarkUnread({
          channel: channelInPreview,
          client,
          payload: { unread_channels: 2, unread_messages: 5 },
          user,
        });
      });
      expectUnreadCountToBe(screen.getByTestId, eventPayload.unread_messages);
    });
  });

  describe('user.updated', () => {
    const renderComponent = async ({ channel, channelPreviewProps, client }) => {
      let result;
      await act(() => {
        result = render(
          <Chat client={client}>
            <ChannelPreview {...channelPreviewProps} channel={channel} />
          </Chat>,
        );
      });

      return result;
    };
    const getChannelState = (memberCount, channelData) => {
      const users = Array.from({ length: memberCount }, generateUser);
      const members = users.map((user) => generateMember({ user }));
      return generateChannel({
        members,
        messages: users.map((user) => generateMessage({ user })),
        ...channelData,
      });
    };

    const channelState = getChannelState(2);

    const MockAvatar = ({ image, name }) => (
      <>
        <div className='avatar-name'>{name}</div>
        <div className='avatar-image'>{image}</div>
      </>
    );

    const channelPreviewProps = {
      Avatar: MockAvatar,
      watchers: { limit: 10 },
    };

    it("should update the direct messaging channel's preview if other user's name has changed", async () => {
      const ownUser = channelState.members[0].user;
      const otherUser = channelState.members[1].user;
      const {
        channels: [channel],
        client,
      } = await initClientWithChannels({
        channelsData: [channelState],
        customUser: ownUser,
      });
      const updatedAttribute = { name: 'new-name' };
      await renderComponent({ channel, client });

      await waitFor(() => {
        expect(screen.queryByText(updatedAttribute.name)).not.toBeInTheDocument();
        expect(screen.getByText(otherUser.name)).toBeInTheDocument();
      });
      act(() => {
        dispatchUserUpdatedEvent(client, { ...otherUser, ...updatedAttribute });
      });
      await waitFor(() => {
        expect(screen.queryAllByText(updatedAttribute.name).length).toBeGreaterThan(0);
        expect(screen.queryByText(otherUser.name)).not.toBeInTheDocument();
      });
    });

    it("should update the direct messaging channel's preview if other user's image has changed", async () => {
      const ownUser = channelState.members[0].user;
      const otherUser = channelState.members[1].user;
      const {
        channels: [channel],
        client,
      } = await initClientWithChannels({
        channelsData: [channelState],
        customUser: ownUser,
      });
      const updatedAttribute = { image: 'new-image' };
      await renderComponent({ channel, channelPreviewProps, client });

      await waitFor(() =>
        expect(screen.queryByText(updatedAttribute.image)).not.toBeInTheDocument(),
      );
      act(() => {
        dispatchUserUpdatedEvent(client, { ...otherUser, ...updatedAttribute });
      });
      await waitFor(() =>
        expect(screen.queryAllByText(updatedAttribute.image).length).toBeGreaterThan(0),
      );
    });

    it("should not update the direct messaging channel's preview if other user attribute than name or image has changed", async () => {
      const ownUser = channelState.members[0].user;
      const otherUser = channelState.members[1].user;
      const {
        channels: [channel],
        client,
      } = await initClientWithChannels({
        channelsData: [channelState],
        customUser: ownUser,
      });
      const updatedAttribute = { custom: 'new-custom' };
      await renderComponent({ channel, channelPreviewProps, client });

      await waitFor(() =>
        expect(screen.queryByText(updatedAttribute.custom)).not.toBeInTheDocument(),
      );
      act(() => {
        dispatchUserUpdatedEvent(client, { ...otherUser, ...updatedAttribute });
      });
      await waitFor(() =>
        expect(screen.queryByText(updatedAttribute.custom)).not.toBeInTheDocument(),
      );
    });

    describe('group channel', () => {
      const channelPreviewProps = {
        Avatar: ChannelAvatar,
      };
      const channelName = 'channel-name';
      const channelState = getChannelState(3, { channel: { name: channelName } });

      it('renders max 4 avatars in channel avatar', async () => {
        const channelState = getChannelState(5);
        const ownUser = channelState.members[0].user;
        const {
          channels: [channel],
          client,
        } = await initClientWithChannels({
          channelsData: [channelState],
          customUser: ownUser,
        });
        await renderComponent({ channel, channelPreviewProps, client });
        await waitFor(() => {
          const avatarImages = screen.getAllByTestId(AVATAR_IMG_TEST_ID);
          expect(avatarImages).toHaveLength(4);
          avatarImages.slice(0, 4).forEach((img, i) => {
            expect(img).toHaveAttribute('src', channelState.members[i].user.image);
          });
        });
      });

      it.each([
        ['own user', channelState.members[0].user],
        ['other user', channelState.members[2].user],
      ])(
        "should not update the direct messaging channel's preview title if %s's name has changed",
        async (_, user) => {
          const {
            channels: [channel],
            client,
          } = await initClientWithChannels({ channelsData: [channelState] });
          const updatedAttribute = { name: 'new-name' };
          await renderComponent({ channel, channelPreviewProps, client });

          await waitFor(() => {
            expect(screen.queryByText(updatedAttribute.name)).not.toBeInTheDocument();
            expect(screen.getByText(channelName)).toBeInTheDocument();
          });
          act(() => {
            dispatchUserUpdatedEvent(client, { ...user, ...updatedAttribute });
          });
          await waitFor(() => {
            expect(screen.queryByText(updatedAttribute.name)).not.toBeInTheDocument();
            expect(screen.getByText(channelName)).toBeInTheDocument();
          });
        },
      );

      it("should update the direct messaging channel's preview image if own user's image has changed", async () => {
        const ownUser = channelState.members[0].user;
        const {
          channels: [channel],
          client,
        } = await initClientWithChannels({
          channelsData: [channelState],
          customUser: ownUser,
        });
        const updatedAttribute = { image: 'new-image' };
        await renderComponent({ channel, channelPreviewProps, client });
        await waitFor(() => {
          const avatarImages = screen.getAllByTestId(AVATAR_IMG_TEST_ID);
          expect(avatarImages).toHaveLength(3);
          expect(avatarImages[0]).toHaveAttribute('src', ownUser.image);
          expect(avatarImages[1]).toHaveAttribute(
            'src',
            channelState.members[1].user.image,
          );
          expect(avatarImages[2]).toHaveAttribute(
            'src',
            channelState.members[2].user.image,
          );
        });

        act(() => {
          dispatchUserUpdatedEvent(client, { ...ownUser, ...updatedAttribute });
        });

        await waitFor(() => {
          const avatarImages = screen.getAllByTestId(AVATAR_IMG_TEST_ID);
          expect(avatarImages[0]).toHaveAttribute('src', updatedAttribute.image);
          expect(avatarImages[1]).toHaveAttribute(
            'src',
            channelState.members[1].user.image,
          );
          expect(avatarImages[2]).toHaveAttribute(
            'src',
            channelState.members[2].user.image,
          );
        });
      });

      it("should update the direct messaging channel's preview image if other user's image has changed", async () => {
        const ownUser = channelState.members[0].user;
        const otherUser = channelState.members[2].user;
        const {
          channels: [channel],
          client,
        } = await initClientWithChannels({
          channelsData: [channelState],
          customUser: ownUser,
        });
        const updatedAttribute = { image: 'new-image' };
        await renderComponent({ channel, channelPreviewProps, client });
        await waitFor(() => {
          const avatarImages = screen.getAllByTestId(AVATAR_IMG_TEST_ID);
          expect(avatarImages).toHaveLength(3);
          expect(avatarImages[0]).toHaveAttribute('src', ownUser.image);
          expect(avatarImages[1]).toHaveAttribute(
            'src',
            channelState.members[1].user.image,
          );
          expect(avatarImages[2]).toHaveAttribute(
            'src',
            channelState.members[2].user.image,
          );
        });

        act(() => {
          dispatchUserUpdatedEvent(client, { ...otherUser, ...updatedAttribute });
        });

        await waitFor(() => {
          const avatarImages = screen.getAllByTestId(AVATAR_IMG_TEST_ID);
          expect(avatarImages[0]).toHaveAttribute('src', ownUser.image);
          expect(avatarImages[1]).toHaveAttribute(
            'src',
            channelState.members[1].user.image,
          );
          expect(avatarImages[2]).toHaveAttribute('src', updatedAttribute.image);
        });
      });

      it("should not update the direct messaging channel's preview if other user's attribute than name or image has changed", async () => {
        const ownUser = channelState.members[0].user;
        const otherUser = channelState.members[2].user;
        const {
          channels: [channel],
          client,
        } = await initClientWithChannels({
          channelsData: [channelState],
          customUser: ownUser,
        });
        const updatedAttribute = { custom: 'new-custom' };
        await renderComponent({ channel, channelPreviewProps, client });

        await waitFor(() => {
          expect(screen.queryByText(updatedAttribute.custom)).not.toBeInTheDocument();
          expect(screen.getByText(channelName)).toBeInTheDocument();
          const avatarImages = screen.getAllByTestId(AVATAR_IMG_TEST_ID);
          avatarImages.forEach((img, i) => {
            expect(img).toHaveAttribute('src', channelState.members[i].userimage);
          });
        });

        act(() => {
          dispatchUserUpdatedEvent(client, { ...otherUser, ...updatedAttribute });
        });

        await waitFor(() => {
          expect(screen.queryByText(updatedAttribute.custom)).not.toBeInTheDocument();
          expect(screen.getByText(channelName)).toBeInTheDocument();
          const avatarImages = screen.getAllByTestId(AVATAR_IMG_TEST_ID);
          avatarImages.forEach((img, i) => {
            expect(img).toHaveAttribute('src', channelState.members[i].userimage);
          });
        });
      });

      it("should not update the direct messaging channel's preview if own user's attribute than name or image has changed", async () => {
        const ownUser = channelState.members[0].user;
        const {
          channels: [channel],
          client,
        } = await initClientWithChannels({
          channelsData: [channelState],
          customUser: ownUser,
        });
        const updatedAttribute = { custom: 'new-custom' };
        await renderComponent({ channel, channelPreviewProps, client });

        await waitFor(() => {
          expect(screen.queryByText(updatedAttribute.custom)).not.toBeInTheDocument();
          expect(screen.getByText(channelName)).toBeInTheDocument();
          const avatarImages = screen.getAllByTestId(AVATAR_IMG_TEST_ID);
          avatarImages.forEach((img, i) => {
            expect(img).toHaveAttribute('src', channelState.members[i].userimage);
          });
        });

        act(() => {
          dispatchUserUpdatedEvent(client, { ...ownUser, ...updatedAttribute });
        });

        await waitFor(() => {
          expect(screen.queryByText(updatedAttribute.custom)).not.toBeInTheDocument();
          expect(screen.getByText(channelName)).toBeInTheDocument();
          const avatarImages = screen.getAllByTestId(AVATAR_IMG_TEST_ID);
          avatarImages.forEach((img, i) => {
            expect(img).toHaveAttribute('src', channelState.members[i].userimage);
          });
        });
      });
    });
  });
});
