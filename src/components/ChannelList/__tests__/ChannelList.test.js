import React from 'react';
// eslint-disable-next-line import/no-extraneous-dependencies
import axios from 'axios';
import { cleanup, render, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

import {
  useMockedApis,
  queryChannelsApi,
  generateMessage,
  generateChannel,
  generateUser,
  getOrCreateChannelApi,
  dispatchMessageNewEvent,
  dispatchChannelDeletedEvent,
  dispatchChannelUpdatedEvent,
  dispatchChannelTruncatedEvent,
  dispatchNotificationAddedToChannelEvent,
  dispatchNotificationMessageNewEvent,
  dispatchNotificationRemovedFromChannel,
  getTestClientWithUser,
  erroredGetApi,
} from 'mock-builders';
import { v4 as uuidv4 } from 'uuid';

import { Chat } from '../../Chat';
import ChannelList from '../ChannelList';

/**
 * We are gonna use following custom UI components for preview and list.
 * If we use ChannelPreviewMessanger or ChannelPreviewLastmessage here, then changes
 * to those components might endup breaking tests for ChannelList, which will be quite painful
 * to debug then.
 */
const ChannelPreviewComponent = ({ channel, latestMessage }) => (
  <div role="listitem" data-testid={channel.id}>
    <div>{channel.data.name}</div>
    <div data-testid={latestMessage}>{latestMessage}</div>
  </div>
);

const ChannelListComponent = (props) => {
  const { error, loading } = props;
  if (error) {
    return <div data-testid="error-indicator" />;
  }

  if (loading) {
    return <div data-testid="loading-indicator" />;
  }

  return <div role="list">{props.children}</div>;
};

jest.mock('axios');

describe('ChannelList', () => {
  let chatClientVishal;

  beforeEach(async () => {
    chatClientVishal = await getTestClientWithUser({ id: 'vishal' });
  });

  afterEach(cleanup);

  describe('mobile navigation', () => {
    let closeMobileNav;
    let props;
    beforeEach(() => {
      closeMobileNav = jest.fn();
      props = {
        filters: {},
        Preview: ChannelPreviewComponent,
        List: ChannelListComponent,
        closeMobileNav,
      };
      useMockedApis(axios, [queryChannelsApi([])]);
    });
    it('should call `closeMobileNav` prop function, when clicked outside ChannelList', async () => {
      const { getByTestId, getByRole } = render(
        <Chat client={chatClientVishal}>
          <ChannelList {...props} />
          <div data-testid="outside-channellist" />
        </Chat>,
      );

      // Wait for list of channels to load in DOM.
      await waitFor(() => {
        expect(getByRole('list')).toBeInTheDocument();
      });

      fireEvent.click(getByTestId('outside-channellist'));
      await waitFor(() => {
        expect(closeMobileNav).toHaveBeenCalledTimes(1);
      });
    });

    it('should not call `closeMobileNav` prop function on click, if ChannelList is collapsed', async () => {
      const { getByTestId, getByRole } = render(
        <Chat client={chatClientVishal}>
          <ChannelList {...props} navOpen={false} />
          <div data-testid="outside-channellist" />
        </Chat>,
      );

      // Wait for list of channels to load in DOM.
      await waitFor(() => {
        expect(getByRole('list')).toBeInTheDocument();
      });

      fireEvent.click(getByTestId('outside-channellist'));
      await waitFor(() => {
        expect(closeMobileNav).toHaveBeenCalledTimes(0);
      });
    });
  });

  it('when queryChannels api throws error, `LoadingErrorIndicator` should be rendered', async () => {
    useMockedApis(axios, [erroredGetApi()]);
    jest.spyOn(console, 'warn').mockImplementationOnce(() => null);

    const { getByTestId } = render(
      <Chat client={chatClientVishal}>
        <ChannelList
          filters={{}}
          Preview={ChannelPreviewComponent}
          List={ChannelListComponent}
          options={{ state: true, watch: true, presence: true }}
        />
      </Chat>,
    );

    // Wait for list of channels to load in DOM.
    await waitFor(() => {
      expect(getByTestId('error-indicator')).toBeInTheDocument();
    });
  });

  it('when queryChannels api returns no channels, `EmptyStateIndicator` should be rendered', async () => {
    useMockedApis(axios, [queryChannelsApi([])]);

    const EmptyStateIndicator = () => {
      return <div data-testid="empty-state-indicator" />;
    };

    const { getByTestId } = render(
      <Chat client={chatClientVishal}>
        <ChannelList
          filters={{}}
          EmptyStateIndicator={EmptyStateIndicator}
          List={ChannelListComponent}
          options={{ state: true, watch: true, presence: true }}
        />
      </Chat>,
    );
    // Wait for list of channels to load in DOM.
    await waitFor(() => {
      expect(getByTestId('empty-state-indicator')).toBeInTheDocument();
    });
  });

  describe('Default and custom active channel', () => {
    let c1;
    let c2;
    let setActiveChannel;
    const watchersConfig = { limit: 20, offset: 0 };
    const testSetActiveChannelCall = (channelInstance) => {
      return waitFor(() => {
        expect(setActiveChannel).toHaveBeenCalledTimes(1);
        expect(setActiveChannel).toHaveBeenCalledWith(
          channelInstance,
          watchersConfig,
        );
        return true;
      });
    };

    beforeEach(() => {
      c1 = generateChannel();
      c2 = generateChannel();
      setActiveChannel = jest.fn();
      useMockedApis(axios, [queryChannelsApi([c1, c2])]);
    });

    it('should call `setActiveChannel` prop function with first channel as param', async () => {
      render(
        <Chat client={chatClientVishal}>
          <ChannelList
            filters={{}}
            List={ChannelListComponent}
            setActiveChannelOnMount
            setActiveChannel={setActiveChannel}
            watchers={watchersConfig}
            options={{ state: true, watch: true, presence: true }}
          />
        </Chat>,
      );

      const channelInstance = chatClientVishal.channel(
        c1.channel.type,
        c1.channel.id,
      );

      expect(await testSetActiveChannelCall(channelInstance)).toBe(true);
    });

    it('should call `setActiveChannel` prop function with channel (which has `customActiveChannel` id)  as param', async () => {
      render(
        <Chat client={chatClientVishal}>
          <ChannelList
            filters={{}}
            List={ChannelListComponent}
            setActiveChannelOnMount
            setActiveChannel={setActiveChannel}
            customActiveChannel={c2.channel.id}
            watchers={watchersConfig}
            options={{ state: true, watch: true, presence: true }}
          />
        </Chat>,
      );

      const channelInstance = chatClientVishal.channel(
        c2.channel.type,
        c2.channel.id,
      );

      expect(await testSetActiveChannelCall(channelInstance)).toBe(true);
    });

    it('should render channel with id `customActiveChannel` at top of the list', async () => {
      const { getByTestId, getByRole, getAllByRole } = render(
        <Chat client={chatClientVishal}>
          <ChannelList
            filters={{}}
            Preview={ChannelPreviewComponent}
            List={ChannelListComponent}
            setActiveChannelOnMount
            setActiveChannel={setActiveChannel}
            customActiveChannel={c2.channel.id}
            watchers={watchersConfig}
            options={{ state: true, watch: true, presence: true }}
          />
        </Chat>,
      );

      // Wait for list of channels to load in DOM.
      await waitFor(() => {
        expect(getByRole('list')).toBeInTheDocument();
      });

      const items = getAllByRole('listitem');

      // Get the closest listitem to the channel that received new message.
      const channelPreview = getByTestId(c2.channel.id).closest(
        '[role="listitem"]',
      );

      expect(channelPreview.isEqualNode(items[0])).toBe(true);
    });
  });

  describe('Event handling', () => {
    it('message.new - channel should move to top of the list', async () => {
      const channel1 = generateChannel();
      const channel2 = generateChannel();
      const channel3 = generateChannel();

      useMockedApis(axios, [queryChannelsApi([channel1, channel2, channel3])]);

      const { getByText, getByRole, getAllByRole } = render(
        <Chat client={chatClientVishal}>
          <ChannelList
            filters={{}}
            Preview={ChannelPreviewComponent}
            List={ChannelListComponent}
            options={{ state: true, watch: true, presence: true }}
          />
        </Chat>,
      );

      // Wait for list of channels to load in DOM.
      await waitFor(() => {
        expect(getByRole('list')).toBeInTheDocument();
      });

      const newMessage = generateMessage({
        user: generateUser(),
      });

      dispatchMessageNewEvent(chatClientVishal, newMessage, channel3.channel);

      await waitFor(() => {
        expect(getByText(newMessage.text)).toBeInTheDocument();
      });

      const items = getAllByRole('listitem');

      // Get the closes listitem to the channel that received new message.
      const channelPreview = getByText(newMessage.text).closest(
        '[role="listitem"]',
      );
      expect(channelPreview.isEqualNode(items[0])).toBe(true);
    });

    describe('notification.message_new', () => {
      it('should move channel to top of the list by default', async () => {
        const channel1 = generateChannel();
        const channel2 = generateChannel();
        const channel3 = generateChannel();

        useMockedApis(axios, [
          queryChannelsApi([channel1, channel2]),
          getOrCreateChannelApi(channel3),
        ]);

        const { getByRole, getByTestId, getAllByRole } = render(
          <Chat client={chatClientVishal}>
            <ChannelList
              filters={{}}
              Preview={ChannelPreviewComponent}
              List={ChannelListComponent}
              options={{ state: true, watch: true, presence: true }}
            />
          </Chat>,
        );

        // Wait for list of channels to load in DOM.
        await waitFor(() => {
          expect(getByRole('list')).toBeInTheDocument();
        });

        dispatchNotificationMessageNewEvent(chatClientVishal, channel3.channel);

        await waitFor(() => {
          expect(getByTestId(channel3.channel.id)).toBeInTheDocument();
        });

        const items = getAllByRole('listitem');

        // Get the closes listitem to the channel that received new message.
        const channelPreview = getByTestId(channel3.channel.id);
        expect(channelPreview.isEqualNode(items[0])).toBe(true);
      });

      it('should call `onMessageNew` function prop, if provided', async () => {
        const channel1 = generateChannel();
        const channel2 = generateChannel();
        const onMessageNew = jest.fn();

        useMockedApis(axios, [
          queryChannelsApi([channel1]),
          getOrCreateChannelApi(channel2),
        ]);

        const { getByRole } = render(
          <Chat client={chatClientVishal}>
            <ChannelList
              filters={{}}
              Preview={ChannelPreviewComponent}
              List={ChannelListComponent}
              onMessageNew={onMessageNew}
              options={{ state: true, watch: true, presence: true }}
            />
          </Chat>,
        );

        // Wait for list of channels to load in DOM.
        await waitFor(() => {
          expect(getByRole('list')).toBeInTheDocument();
        });

        dispatchNotificationMessageNewEvent(chatClientVishal, channel2.channel);

        await waitFor(() => {
          expect(onMessageNew).toHaveBeenCalledTimes(1);
        });
      });
    });

    describe('notification.added_to_channel', () => {
      let channel1;
      let channel2;
      let channel3;
      const channelListProps = {
        filters: {},
        Preview: ChannelPreviewComponent,
        List: ChannelListComponent,
        options: { state: true, watch: true, presence: true },
      };

      beforeEach(async () => {
        channel1 = generateChannel();
        channel2 = generateChannel();
        channel3 = generateChannel();

        useMockedApis(axios, [
          queryChannelsApi([channel1, channel2]),
          getOrCreateChannelApi(channel3),
        ]);

        chatClientVishal = await getTestClientWithUser({
          id: 'vishal',
        });
      });

      it('should move channel to top of the list by default', async () => {
        const { getByRole, getByTestId, getAllByRole } = render(
          <Chat client={chatClientVishal}>
            <ChannelList {...channelListProps} />
          </Chat>,
        );

        // Wait for list of channels to load in DOM.
        await waitFor(() => {
          expect(getByRole('list')).toBeInTheDocument();
        });

        dispatchNotificationAddedToChannelEvent(
          chatClientVishal,
          channel3.channel,
        );

        await waitFor(() => {
          expect(getByTestId(channel3.channel.id)).toBeInTheDocument();
        });

        const items = getAllByRole('listitem');

        // Get the closes listitem to the channel that received new message.
        const channelPreview = getByTestId(channel3.channel.id);
        expect(channelPreview.isEqualNode(items[0])).toBe(true);
      });

      it('should call `onAddedToChannel` function prop, if provided', async () => {
        const onAddedToChannel = jest.fn();
        const { getByRole } = render(
          <Chat client={chatClientVishal}>
            <ChannelList
              {...channelListProps}
              onAddedToChannel={onAddedToChannel}
            />
          </Chat>,
        );

        // Wait for list of channels to load in DOM.
        await waitFor(() => {
          expect(getByRole('list')).toBeInTheDocument();
        });

        dispatchNotificationAddedToChannelEvent(
          chatClientVishal,
          channel3.channel,
        );

        await waitFor(() => {
          expect(onAddedToChannel).toHaveBeenCalledTimes(1);
        });
      });
    });

    describe('notification.removed_from_channel', () => {
      let channel1;
      let channel2;
      let channel3;

      const channelListProps = {
        filters: {},
        Preview: ChannelPreviewComponent,
        List: ChannelListComponent,
      };

      beforeEach(() => {
        channel1 = generateChannel();
        channel2 = generateChannel();
        channel3 = generateChannel();

        useMockedApis(axios, [
          queryChannelsApi([channel1, channel2, channel3]),
        ]);
      });

      it('should remove the channel from list by default', async () => {
        const { getByRole, getByTestId } = render(
          <Chat client={chatClientVishal}>
            <ChannelList {...channelListProps} />
          </Chat>,
        );
        // Wait for list of channels to load in DOM.
        await waitFor(() => {
          expect(getByRole('list')).toBeInTheDocument();
        });
        const nodeToBeRemoved = getByTestId(channel3.channel.id);

        dispatchNotificationRemovedFromChannel(
          chatClientVishal,
          channel3.channel,
        );

        await waitFor(() => {
          expect(nodeToBeRemoved).not.toBeInTheDocument();
        });
      });

      it('should call `onRemovedFromChannel` function prop, if provided', async () => {
        const onRemovedFromChannel = jest.fn();
        const { getByRole } = render(
          <Chat client={chatClientVishal}>
            <ChannelList
              {...channelListProps}
              onRemovedFromChannel={onRemovedFromChannel}
            />
          </Chat>,
        );
        // Wait for list of channels to load in DOM.
        await waitFor(() => {
          expect(getByRole('list')).toBeInTheDocument();
        });

        dispatchNotificationRemovedFromChannel(
          chatClientVishal,
          channel3.channel,
        );

        await waitFor(() => {
          expect(onRemovedFromChannel).toHaveBeenCalledTimes(1);
        });
      });
    });

    describe('channel.updated', () => {
      let channel1;
      let channel2;

      const channelListProps = {
        filters: {},
        Preview: ChannelPreviewComponent,
        List: ChannelListComponent,
      };

      beforeEach(() => {
        channel1 = generateChannel();
        channel2 = generateChannel();

        useMockedApis(axios, [queryChannelsApi([channel1, channel2])]);
      });

      it('should update the channel in list, by default', async () => {
        const { getByRole, getByText } = render(
          <Chat client={chatClientVishal}>
            <ChannelList {...channelListProps} />
          </Chat>,
        );

        // Wait for list of channels to load in DOM.
        await waitFor(() => {
          expect(getByRole('list')).toBeInTheDocument();
        });

        const newChannelName = uuidv4();
        dispatchChannelUpdatedEvent(chatClientVishal, {
          ...channel2.channel,
          name: newChannelName,
        });

        await waitFor(() => {
          expect(getByText(newChannelName)).toBeInTheDocument();
        });
      });

      it('should call `onChannelUpdated` function prop, if provided', async () => {
        const onChannelUpdated = jest.fn();
        const { getByRole } = render(
          <Chat client={chatClientVishal}>
            <ChannelList
              {...channelListProps}
              onChannelUpdated={onChannelUpdated}
            />
          </Chat>,
        );

        // Wait for list of channels to load in DOM.
        await waitFor(() => {
          expect(getByRole('list')).toBeInTheDocument();
        });

        const newChannelName = uuidv4();
        dispatchChannelUpdatedEvent(chatClientVishal, {
          ...channel2.channel,
          name: newChannelName,
        });

        await waitFor(() => {
          expect(onChannelUpdated).toHaveBeenCalledTimes(1);
        });
      });
    });

    describe('channel.deleted', () => {
      let channel1;
      let channel2;

      const channelListProps = {
        filters: {},
        Preview: ChannelPreviewComponent,
        List: ChannelListComponent,
      };

      // eslint-disable-next-line sonarjs/no-identical-functions
      beforeEach(() => {
        channel1 = generateChannel();
        channel2 = generateChannel();

        useMockedApis(axios, [queryChannelsApi([channel1, channel2])]);
      });

      it('should remove channel from list, by default', async () => {
        const { getByRole, getByTestId } = render(
          <Chat client={chatClientVishal}>
            <ChannelList {...channelListProps} />
          </Chat>,
        );

        // Wait for list of channels to load in DOM.
        await waitFor(() => {
          expect(getByRole('list')).toBeInTheDocument();
        });

        const nodeToBeRemoved = getByTestId(channel2.channel.id);
        dispatchChannelDeletedEvent(chatClientVishal, channel2.channel);

        await waitFor(() => {
          expect(nodeToBeRemoved).not.toBeInTheDocument();
        });
      });

      it('should call `onChannelDeleted` function prop, if provided', async () => {
        const onChannelDeleted = jest.fn();
        const { getByRole } = render(
          <Chat client={chatClientVishal}>
            <ChannelList
              {...channelListProps}
              onChannelDeleted={onChannelDeleted}
            />
          </Chat>,
        );

        // Wait for list of channels to load in DOM.
        await waitFor(() => {
          expect(getByRole('list')).toBeInTheDocument();
        });

        dispatchChannelDeletedEvent(chatClientVishal, channel2.channel);

        await waitFor(() => {
          expect(onChannelDeleted).toHaveBeenCalledTimes(1);
        });
      });
    });

    describe('channel.truncated', () => {
      let channel1;
      let user1;
      let message1;
      let message2;

      const channelListProps = {
        filters: {},
        Preview: ChannelPreviewComponent,
        List: ChannelListComponent,
      };

      beforeEach(() => {
        user1 = generateUser();
        message1 = generateMessage({ user: user1 });
        message2 = generateMessage({ user: user1 });
        channel1 = generateChannel({ messages: [message1, message2] });

        useMockedApis(axios, [queryChannelsApi([channel1])]);
      });

      it('should remove latest message', async () => {
        const { getByRole, getByTestId } = render(
          <Chat client={chatClientVishal}>
            <ChannelList {...channelListProps} />
          </Chat>,
        );

        // Wait for list of channels to load in DOM.
        await waitFor(() => {
          expect(getByRole('list')).toBeInTheDocument();
        });

        const latestMessageNode = getByTestId(message2.text);

        dispatchChannelTruncatedEvent(chatClientVishal, channel1.channel);

        await waitFor(() => {
          expect(latestMessageNode).not.toBe(message2.text);
        });
      });
      it('should call `onChannelTruncated` function prop, if provided', async () => {
        const onChannelTruncated = jest.fn();
        const { getByRole } = render(
          <Chat client={chatClientVishal}>
            <ChannelList
              {...channelListProps}
              onChannelTruncated={onChannelTruncated}
            />
          </Chat>,
        );

        // Wait for list of channels to load in DOM.
        await waitFor(() => {
          expect(getByRole('list')).toBeInTheDocument();
        });

        dispatchChannelTruncatedEvent(chatClientVishal, channel1.channel);

        await waitFor(() => {
          expect(onChannelTruncated).toHaveBeenCalledTimes(1);
        });
      });
    });
  });
});
