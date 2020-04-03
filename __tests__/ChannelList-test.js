/**
 * STILL WORK IN PROGRESS
 */

/* eslint-disable sonarjs/no-unused-collection */
import React from 'react';
import { cleanup, render, wait } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import uuidv4 from 'uuid/v4';

import { getTestClient, createUserToken } from './utils';

import { Chat } from '../src/components/Chat';
import { ChannelList } from '../src/components/ChannelList';

// eslint-disable-next-line no-undef
afterEach(cleanup);

/**
 * We are gonna use following custom UI components for preview and list.
 * If we use ChannelPreviewMessanger or ChannelPreviewLastmessage here, then changes
 * to those components might endup breaking tests for ChannelList, which will be quite painful
 * to debug then.
 */
const ChannelPreviewComponent = ({ channel, latestMessage }) => (
  <div role="listitem" data-testid={channel.id}>
    <div>{channel.data.name}</div>
    <div>{latestMessage}</div>
  </div>
);

const ChannelListComponent = (props) => {
  const { error, loading, LoadingErrorIndicator, LoadingIndicator } = props;
  if (error) {
    return <LoadingErrorIndicator type="Connection Error" />;
  } else if (loading) {
    return <LoadingIndicator />;
  } else {
    return <div role="list">{props.children}</div>;
  }
};

const EmptyStateIndicatorComponent = () => (
  <div data-testid="empty-state-indicator"></div>
);

const LoadingIndicatorComponent = () => (
  <div data-testid="loading-indicator"></div>
);

describe('ChannelList', () => {
  let chatClient;
  let chatClientVishal;
  let userId;
  let userIdVishal;
  let userToken;
  let userTokenVishal;
  let channels;

  const setupChat = async () => {
    channels = [];

    // Prepare client for Thierry user
    chatClient = getTestClient();
    userId = `thierry-${uuidv4()}`;
    userToken = createUserToken(userId);
    chatClient.setUser(
      {
        id: userId,
        name: 'Thierry',
        status: 'busy',
      },
      userToken,
    );

    // Prepare client for Vishal user
    chatClientVishal = getTestClient();
    userIdVishal = `vishal-${uuidv4()}`;
    userTokenVishal = createUserToken(userIdVishal);
    chatClientVishal.setUser(
      {
        id: userIdVishal,
        name: 'Vishal',
        status: 'busy',
      },
      userTokenVishal,
    );

    // Generate multiple channels
    for (let i = 0; i < 3; i++) {
      const channel = await createChannel();
      channels.push(channel);
    }

    return {
      chatClient,
      chatClientVishal,
      userId,
      userIdVishal,
      userToken,
      userTokenVishal,
      channels,
    };
  };

  const createChannel = async () => {
    const channelId = uuidv4();
    const channelName = uuidv4();
    const channel = chatClientVishal.channel('messaging', channelId, {
      name: channelName,
      members: [userId, userIdVishal],
    });
    await channel.create();

    return channel;
  };

  const waitForTwoSec = () =>
    new Promise((resolve) => {
      setTimeout(resolve, 1000);
    });

  beforeEach(async () => {
    await waitForTwoSec();
    await setupChat();
  });

  // TODO: Fix this test
  it.skip('should render LoadingIndicator in the begining', () => {
    const { getByTestId } = render(
      <Chat client={chatClient}>
        <ChannelList
          // Using some random id to get 0 channels from query.
          filters={{ members: { $in: ['random-user id-to-not-hit'] } }}
          Preview={ChannelPreviewComponent}
          LoadingIndicator={LoadingIndicatorComponent}
          List={ChannelListComponent}
        />
      </Chat>,
    );
    expect(getByTestId('loading-indicator')).toBeTruthy();
  });

  it('should render EmptyStateIndicator if there are no channels', async () => {
    const { getByTestId } = render(
      <Chat client={chatClient}>
        <ChannelList
          // Using some random id to get 0 channels from query.
          filters={{ members: { $in: ['random-user id-to-not-hit'] } }}
          Preview={ChannelPreviewComponent}
          EmptyStateIndicator={EmptyStateIndicatorComponent}
          List={ChannelListComponent}
        />
      </Chat>,
    );

    await wait(() => {
      getByTestId('empty-state-indicator');
    });

    expect(getByTestId('empty-state-indicator')).toBeTruthy();
  });

  it('should render LoadingErrorIndicator in case of error', async () => {
    // TODO: add a test
  });

  it('should render all channels in list', async () => {
    const { getByText, getByRole } = render(
      <Chat client={chatClient}>
        <ChannelList
          filters={{ members: { $in: [userId] } }}
          Preview={ChannelPreviewComponent}
          List={ChannelListComponent}
        />
      </Chat>,
    );

    // Wait for list of channels to load in DOM.
    await wait(() => {
      getByRole('list');
    });

    channels.forEach((channel) => {
      expect(getByText(channel.data.name)).toBeTruthy();
    });
  });

  it('should move the channel to top if new message is received', async () => {
    const { getByText, getByRole, getAllByRole } = render(
      <Chat client={chatClient}>
        <ChannelList
          filters={{ members: { $in: [userId] } }}
          Preview={ChannelPreviewComponent}
          List={ChannelListComponent}
          options={{ state: true, watch: true, presence: true }}
        />
      </Chat>,
    );

    // Wait for list of channels to load in DOM.
    await wait(() => {
      getByRole('list');
    });

    const newMessage = `${uuidv4()}`;
    await act(async () => {
      channels[2].sendMessage({
        text: newMessage,
      });

      await new Promise((resolve) => {
        chatClient.on('message.new', resolve);
      });
    });

    await wait(() => {
      getByText(newMessage);
    });

    const items = getAllByRole('listitem');

    // Get the closes listitem to the channel that received new message.
    const channelPreview = getByText(channels[2].data.name).closest(
      '[role="listitem"]',
    );
    expect(channelPreview.isEqualNode(items[0])).toBeTruthy();
  });

  describe('when user is added to channel', () => {
    const onAddedToChannel = jest.fn();
    let newChannel;

    const createNewChannel = async () => {
      createChannel();
      return await new Promise((resolve) => {
        chatClient.on('notification.added_to_channel', (e) => {
          resolve(e.channel);
        });
      });
    };

    test('if `onAddedToChannel` prop function is provided, it should call `onAddedToChannel`', async () => {
      const { getByRole } = render(
        <Chat client={chatClient}>
          <ChannelList
            filters={{ members: { $in: [userId] } }}
            Preview={ChannelPreviewComponent}
            List={ChannelListComponent}
            options={{ state: true, watch: true, presence: true, limit: 10 }}
            onAddedToChannel={onAddedToChannel}
          />
        </Chat>,
      );

      await wait(() => {
        getByRole('list');
      });

      await createNewChannel();
      expect(onAddedToChannel).toHaveBeenCalledTimes(1);
    });

    test('if `onAddedToChannel` prop function is provided, it should move the channel to the top', async () => {
      const { getByTestId, getAllByRole, getByRole } = render(
        <Chat client={chatClient}>
          <ChannelList
            filters={{ members: { $in: [userId] } }}
            Preview={ChannelPreviewComponent}
            List={ChannelListComponent}
            options={{ state: true, watch: true, presence: true, limit: 10 }}
          />
        </Chat>,
      );

      await wait(() => {
        getByRole('list');
      });

      newChannel = await createNewChannel();
      await wait(() => {
        getByTestId(newChannel.id);
      });

      const items = getAllByRole('listitem');

      // Get the closes listitem to the channel that received new message.
      const channelPreview = getByTestId(newChannel.id);
      expect(channelPreview.isEqualNode(items[0])).toBeTruthy();
    });
  });

  describe('when user is removed from a channel', () => {
    const removeMember = async (channelIndexToBeRemoved) => {
      channels[channelIndexToBeRemoved].removeMembers([userId]);

      await new Promise((resolve) => {
        chatClient.on('notification.removed_from_channel', () => {
          resolve();
        });
      });
    };

    test('if `onRemovedFromChannel` prop function is provided, it should call `onRemovedFromChannel`', async () => {
      const onRemovedFromChannel = jest.fn();
      const { getByRole } = render(
        <Chat client={chatClient}>
          <ChannelList
            filters={{ members: { $in: [userId] } }}
            Preview={ChannelPreviewComponent}
            List={ChannelListComponent}
            options={{ state: true, watch: true, presence: true, limit: 10 }}
            onRemovedFromChannel={onRemovedFromChannel}
          />
        </Chat>,
      );

      await wait(() => {
        getByRole('list');
      });
      const channelIndexToBeRemoved = 1;
      await removeMember(channelIndexToBeRemoved);
      expect(onRemovedFromChannel).toHaveBeenCalledTimes(1);
    });

    test('if `onRemovedFromChannel` prop function is not provided, it should remove the channel from list', async () => {
      const { getByRole, queryByTestId } = render(
        <Chat client={chatClient}>
          <ChannelList
            filters={{ members: { $in: [userId] } }}
            Preview={ChannelPreviewComponent}
            List={ChannelListComponent}
            options={{ state: true, watch: true, presence: true, limit: 10 }}
          />
        </Chat>,
      );

      await wait(() => {
        getByRole('list');
      });

      const channelIndexToBeRemoved = 1;
      await removeMember(channelIndexToBeRemoved);
      expect(queryByTestId(channels[channelIndexToBeRemoved].id)).toBeNull();
    });
  });

  describe('when new message is added to channel (which is not in the list)', () => {
    const onMessageNew = jest.fn();
    let Render;

    const createNewChannelAndSendMessage = async () => {
      const newMessage = `${uuidv4()}`;
      channels[2].sendMessage({
        text: newMessage,
      });

      await new Promise((resolve) => {
        chatClient.on('notification.message_new', () => {
          resolve();
        });
      });
    };

    test('if `onMessageNew` function prop is provided, it should call `onMessageNew`', async () => {
      Render = render(
        <Chat client={chatClient}>
          <ChannelList
            filters={{
              members: { $in: [userId] },
              id: { $in: [channels[0].id, channels[1].id] },
            }}
            Preview={ChannelPreviewComponent}
            List={ChannelListComponent}
            options={{ state: true, watch: true, presence: true, limit: 10 }}
            onMessageNew={onMessageNew}
            onAddedToChannel={() => {}}
          />
        </Chat>,
      );

      await wait(() => {
        Render.getByRole('list');
      });

      await createNewChannelAndSendMessage();
      expect(onMessageNew).toHaveBeenCalledTimes(1);
    });

    test('if `onMessageNew` function prop is not provided, it should move channel to top of list', async () => {
      const { getByText, getByTestId, getAllByRole } = render(
        <Chat client={chatClient}>
          <ChannelList
            filters={{
              members: { $in: [userId] },
              id: { $in: [channels[0].id, channels[1].id] },
            }}
            Preview={ChannelPreviewComponent}
            List={ChannelListComponent}
            options={{ state: true, watch: true, presence: true, limit: 10 }}
            onAddedToChannel={() => {}}
          />
        </Chat>,
      );
      await wait(() => {
        Render.getByRole('list');
      });

      await createNewChannelAndSendMessage();

      await wait(() => {
        getByTestId(channels[2].id);
      });

      const items = getAllByRole('listitem');

      // Get the closes listitem to the channel that received new message.
      const channelPreview = getByText(channels[2].data.name).closest(
        '[role="listitem"]',
      );
      expect(channelPreview.isEqualNode(items[0])).toBeTruthy();
    });
  });

  describe('when channel from the list is updated', () => {
    const newName = `${uuidv4()}`;
    const updateChannelName = async () => {
      channels[1].update({
        name: newName,
      });

      await new Promise((resolve) => {
        chatClient.on('channel.updated', () => {
          resolve();
        });
      });
    };

    // Following test makes sure changes to channel are reflected in the list.
    it('should reflect updated name in list', async () => {
      const { getByRole, getByText } = render(
        <Chat client={chatClient}>
          <ChannelList
            filters={{ members: { $in: [userId] } }}
            Preview={ChannelPreviewComponent}
            List={ChannelListComponent}
            options={{ state: true, watch: true, presence: true }}
          />
        </Chat>,
      );
      await wait(() => {
        getByRole('list');
      });

      await updateChannelName();

      expect(getByText(newName)).toBeTruthy();
    });
    it('should call `onChannelUpdated`, if its provided', async () => {
      const onChannelUpdated = jest.fn();
      const { getByRole } = render(
        <Chat client={chatClient}>
          <ChannelList
            filters={{ members: { $in: [userId] } }}
            Preview={ChannelPreviewComponent}
            List={ChannelListComponent}
            options={{ state: true, watch: true, presence: true }}
            onChannelUpdated={onChannelUpdated}
          />
        </Chat>,
      );
      await wait(() => {
        getByRole('list');
      });

      await updateChannelName();

      expect(onChannelUpdated).toHaveBeenCalledTimes(1);
    });
  });

  describe('when channel from the list is deleted', () => {
    const deleteChannel = async (channelIndexToBeDeleted) => {
      channels[channelIndexToBeDeleted].delete();

      await new Promise((resolve) => {
        chatClient.on('channel.deleted', resolve);
      });
    };

    test('if `onChannelDeleted` function prop is provided, it should call `onChannelDeleted`', async () => {
      const onChannelDeleted = jest.fn();
      const { getByRole } = render(
        <Chat client={chatClient}>
          <ChannelList
            filters={{ members: { $in: [userId] } }}
            Preview={ChannelPreviewComponent}
            List={ChannelListComponent}
            options={{ state: true, watch: true, presence: true }}
            onChannelDeleted={onChannelDeleted}
          />
        </Chat>,
      );
      await wait(() => {
        getByRole('list');
      });
      const channelIndexToBeDeleted = 0;
      await deleteChannel(channelIndexToBeDeleted);

      expect(onChannelDeleted).toHaveBeenCalledTimes(1);
    });
    test('if `onChannelDeleted` function prop not is provided, it should be removed channel from list', async () => {
      const { getByRole, queryByTestId } = render(
        <Chat client={chatClient}>
          <ChannelList
            filters={{ members: { $in: [userId] } }}
            Preview={ChannelPreviewComponent}
            List={ChannelListComponent}
            options={{ state: true, watch: true, presence: true }}
          />
        </Chat>,
      );
      await wait(() => {
        getByRole('list');
      });
      const channelIndexToBeDeleted = 0;
      await deleteChannel(channelIndexToBeDeleted);

      expect(queryByTestId(channels[channelIndexToBeDeleted].id)).toBeNull();
    });
  });

  describe('when channel from the list is truncated', () => {
    const truncateChannel = async (channelIndexToBeTruncated) => {
      channels[channelIndexToBeTruncated].truncate();

      await new Promise((resolve) => {
        chatClient.on('channel.truncated', resolve);
      });
    };

    test('if `onChannelTruncated` function prop is provided, it should call `onChannelTruncated`', async () => {
      const onChannelTruncated = jest.fn();
      const { getByRole } = render(
        <Chat client={chatClient}>
          <ChannelList
            filters={{ members: { $in: [userId] } }}
            Preview={ChannelPreviewComponent}
            List={ChannelListComponent}
            options={{ state: true, watch: true, presence: true }}
            onChannelTruncated={onChannelTruncated}
          />
        </Chat>,
      );
      await wait(() => {
        getByRole('list');
      });
      const channelIndexToBeTruncated = 1;
      await truncateChannel(channelIndexToBeTruncated);

      expect(onChannelTruncated).toHaveBeenCalledTimes(1);
    });
  });
});
