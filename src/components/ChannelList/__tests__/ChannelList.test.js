import React from 'react';
// eslint-disable-next-line import/no-extraneous-dependencies
import axios from 'axios';
import { cleanup, render, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

import {
  getTestClient,
  useMockedApis,
  queryChannelsApi,
  generateMessage,
  generateChannel,
  generateUser,
  getOrCreateChannelApi,
  dispatchMessageNewEvent,
  dispatchNotificationAddedToChannelEvent,
  getTestClientWithUser,
  erroredGetApi,
} from 'mock-builders';
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
    <div>{latestMessage}</div>
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
  afterEach(cleanup);

  it('when `document` is clicked, `closeMobileNav` prop function should be called', () => {
    expect(true).toBe(true);
    /** TODO: add this test */
  });

  it('when queryChannels api throws error, `LoadingErrorIndicator` should be rendered', async () => {
    useMockedApis(axios, [erroredGetApi()]);
    jest.spyOn(console, 'warn').mockImplementationOnce(() => null);
    const chatClientVishal = getTestClient();
    await chatClientVishal.setUser({ id: 'vishal' });

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

  it('when queryChannels api returns no channels, `EmptyStateIndicator` should be rendered', () => {
    expect(true).toBe(true);
    /** TODO: add this test */
  });

  it('when `setActiveChannelOnMount` is true, `setActiveChannel` prop function should be called with first channel as param', () => {
    expect(true).toBe(true);
    /** TODO: add this test */
  });

  describe('when `customActiveChannel` is present', () => {
    it('`setActiveChannel` prop function should be called with `customActiveChannel` as param', () => {
      expect(true).toBe(true);
      /** TODO: add this test */
    });
    it('`customActiveChannel` should be at top of the list', () => {
      expect(true).toBe(true);
      /** TODO: add this test */
    });
  });

  describe('Event handling', () => {
    it('message.new - channel should move to top of the list', async () => {
      const channel1 = generateChannel();
      const channel2 = generateChannel();
      const channel3 = generateChannel();

      useMockedApis(axios, [queryChannelsApi([channel1, channel2, channel3])]);

      const chatClientVishal = getTestClient();
      await chatClientVishal.setUser({ id: 'vishal' });

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

    it("user.presence.changed - member's presence status should be updated", () => {
      expect(true).toBe(true);
      /** TODO: add this test */
    });

    describe('notification.message_new', () => {
      it('`onMessageNew` prop is present - channel should move to top of the list', () => {
        expect(true).toBe(true);
        /** TODO: add this test */
      });
      it('`onMessageNew` prop is absent - should call `onMessageNew` function prop', () => {
        expect(true).toBe(true);
        /** TODO: add this test */
      });
    });
    describe('notification.added_to_channel', () => {
      it('`onAddedToChannel` prop is present - channel should move to top of the list', async () => {
        const channel1 = generateChannel();
        const channel2 = generateChannel();
        const channel3 = generateChannel();

        useMockedApis(axios, [
          queryChannelsApi([channel1, channel2]),
          getOrCreateChannelApi(channel3),
        ]);

        const chatClientVishal = await getTestClientWithUser({
          id: 'vishal',
        });

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

      it('`onAddedToChannel` prop is absent - should call `onAddedToChannel` function prop', () => {
        expect(true).toBe(true);
        /** TODO: add this test */
      });
    });

    describe('notification.removed_from_channel', () => {
      it('`onRemovedFromChannel` prop is present - channel should be removed from list', () => {
        expect(true).toBe(true);
        /** TODO: add this test */
      });
      it('`onRemovedFromChannel` prop is absent - should call `onRemovedFromChannel` function prop', () => {
        expect(true).toBe(true);
        /** TODO: add this test */
      });
    });
    describe('channel.updated', () => {
      it('`onChannelUpdated` prop is present - channel should be updated in list', () => {
        expect(true).toBe(true);
        /** TODO: add this test */
      });
      it('`onChannelUpdated` prop is absent - should call `onChannelUpdated` function prop', () => {
        expect(true).toBe(true);
        /** TODO: add this test */
      });
    });
    describe('channel.deleted', () => {
      it('`onChannelDeleted` prop is present - channel should be removed from list', () => {
        expect(true).toBe(true);
        /** TODO: add this test */
      });
      it('`onChannelDeleted` prop is absent - should call `onChannelDeleted` function prop', () => {
        expect(true).toBe(true);
        /** TODO: add this test */
      });
    });
    describe('channel.truncated', () => {
      it('`onChannelTruncated` prop is present - latest message on channel should be empty', () => {
        expect(true).toBe(true);
        /** TODO: add this test */
      });
      it('`onChannelTruncated` prop is absent - should call `onChannelTruncated` function prop', () => {
        expect(true).toBe(true);
        /** TODO: add this test */
      });
    });
  });
});
