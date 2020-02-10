/**
 * STILL WORK IN PROGRESS
 */

/* eslint-disable sonarjs/no-unused-collection */
import React from 'react';
import { cleanup, render, wait } from '@testing-library/react';
import { act } from 'react-dom/test-utils';

import { ChannelList } from '../src/components/ChannelList';
import { Chat } from '../src/components/Chat';
import { ChatDown } from '../src/components/ChatDown';
import { LoadingChannels } from '../src/components/LoadingChannels';

import uuidv4 from 'uuid/v4';
import { getTestClient, createUserToken } from './utils';

// Note: running cleanup afterEach is done automatically for you in @testing-library/react@9.0.0 or higher
// unmount and cleanup DOM after the test is finished.
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
  if (props.error) {
    return <ChatDown type="Connection Error" />;
  } else if (props.loading) {
    return <LoadingChannels data-testid="loading-channels" />;
  } else {
    return <div role="list">{props.children}</div>;
  }
};

const EmptyStateIndicatorComponent = () => (
  <div data-testid="empty-state-indicator"></div>
);

describe('ChannelList', () => {
  let chatClient;
  let chatClientVishal;
  let userId;
  let userIdVishal;
  let userToken;
  let userTokenVishal;
  let channels;
  const newMessage = 'This is new';

  const setupChat = async () => {
    channels = [];
    chatClient = getTestClient();
    chatClientVishal = getTestClient();
    userId = `thierry-${uuidv4()}`;
    userIdVishal = `vishal-${uuidv4()}`;
    userToken = createUserToken(userId);
    userTokenVishal = createUserToken(userIdVishal);
    chatClient.setUser(
      {
        id: userId,
        name: 'Thierry',
        status: 'busy',
      },
      userToken,
    );
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

  beforeEach(setupChat);

  it.only('should render EmptyStateIndicator if there are no channels', async () => {
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

    await wait(() => {
      getByRole('list');
    });

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
    beforeEach(setupChat);

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

    it('should call `onAddedToChannel` prop function', async () => {
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

    it('should move the channel to top, if `onAddedToChannel` prop is empty', async () => {
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

  describe('when new message is added to channel (which is not in the list) or when `notification.message_new` event is received', () => {
    beforeEach(async () => {
      await setupChat();
    });

    const onMessageNew = jest.fn();
    let Render, newChannel;

    const createNewChannelAndSendMessage = async () => {
      newChannel = await createChannel();
      newChannel.sendMessage({
        text: newMessage,
      });
      await new Promise((resolve) => {
        chatClient.on('notification.message_new', () => {
          resolve();
        });
      });
    };

    test('case 1: `onMessageNew` prop function is provided - should call `onMessageNew`', async () => {
      Render = render(
        <Chat client={chatClient}>
          <ChannelList
            filters={{ members: { $in: [userId] } }}
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

    test('case 2: `onMessageNew` prop function is provided - should move channel to top of list', async () => {
      const { getByText, getByTestId, getAllByRole } = render(
        <Chat client={chatClient}>
          <ChannelList
            filters={{ members: { $in: [userId] } }}
            Preview={ChannelPreviewComponent}
            List={ChannelListComponent}
            options={{ state: true, watch: true, presence: true }}
            onAddedToChannel={() => {}}
          />
        </Chat>,
      );

      await createNewChannelAndSendMessage();

      await wait(() => {
        getByTestId(newChannel.id);
      });

      const items = getAllByRole('listitem');

      // Get the closes listitem to the channel that received new message.
      const channelPreview = getByText(newChannel.data.name).closest(
        '[role="listitem"]',
      );
      expect(channelPreview.isEqualNode(items[0])).toBeTruthy();
    });
  });
});
