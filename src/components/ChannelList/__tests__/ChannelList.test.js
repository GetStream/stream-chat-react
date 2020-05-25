/* eslint-disable sonarjs/no-unused-collection */
import React from 'react';
import axios from 'axios';
import { cleanup, render, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

import { Chat } from '../../Chat';
import ChannelList from '../ChannelList';

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
  const { error, loading, LoadingIndicator } = props;
  if (error) {
    return <div data-testid="error-indicator" />;
  }

  if (loading) {
    return <div data-testid="loading-indicator" />;
  }

  return <div role="list">{props.children}</div>;
};

jest.mock('axios');
afterEach(cleanup);

describe('ChannelList', () => {
  test('when `document` is clicked, `closeMobileNav` prop function should be called', () => {
    /** TODO: add this test */
  });

  test('when queryChannels api throws error, `LoadingErrorIndicator` should be rendered', async () => {
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

  test('when queryChannels api returns no channels, `EmptyStateIndicator` should be rendered', () => {
    /** TODO: add this test */
  });

  test('when `setActiveChannelOnMount` is true, `setActiveChannel` prop function should be called with first channel as param', () => {
    /** TODO: add this test */
  });

  describe('when `customActiveChannel` is present', () => {
    test('`setActiveChannel` prop function should be called with `customActiveChannel` as param', () => {
      /** TODO: add this test */
    });
    test('`customActiveChannel` should be at top of the list', () => {
      /** TODO: add this test */
    });
  });

  describe('Event handling', () => {
    test('message.new - channel should move to top of the list', async () => {
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
      expect(channelPreview.isEqualNode(items[0])).toBeTruthy();
    }),
      test("user.presence.changed - member's presence status should be updated", () => {
        /** TODO: add this test */
      });

    describe('notification.message_new', () => {
      test('`onMessageNew` prop is present - channel should move to top of the list', () => {
        /** TODO: add this test */
      });
      test('`onMessageNew` prop is absent - should call `onMessageNew` function prop', () => {
        /** TODO: add this test */
      });
    }),
      describe('notification.added_to_channel', () => {
        test('`onAddedToChannel` prop is present - channel should move to top of the list', async () => {
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

          const { getByText, getByRole, getByTestId, getAllByRole } = render(
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
          expect(channelPreview.isEqualNode(items[0])).toBeTruthy();
        });
        test('`onAddedToChannel` prop is absent - should call `onAddedToChannel` function prop', () => {
          /** TODO: add this test */
        });
      }),
      describe('notification.removed_from_channel', () => {
        test('`onRemovedFromChannel` prop is present - channel should be removed from list', () => {
          /** TODO: add this test */
        });
        test('`onRemovedFromChannel` prop is absent - should call `onRemovedFromChannel` function prop', () => {
          /** TODO: add this test */
        });
      }),
      describe('channel.updated', () => {
        test('`onChannelUpdated` prop is present - channel should be updated in list', () => {
          /** TODO: add this test */
        });
        test('`onChannelUpdated` prop is absent - should call `onChannelUpdated` function prop', () => {
          /** TODO: add this test */
        });
      }),
      describe('channel.deleted', () => {
        test('`onChannelDeleted` prop is present - channel should be removed from list', () => {
          /** TODO: add this test */
        });
        test('`onChannelDeleted` prop is absent - should call `onChannelDeleted` function prop', () => {
          /** TODO: add this test */
        });
      }),
      describe('channel.truncated', () => {
        test('`onChannelTruncated` prop is present - latest message on channel should be empty', () => {
          /** TODO: add this test */
        });
        test('`onChannelTruncated` prop is absent - should call `onChannelTruncated` function prop', () => {
          /** TODO: add this test */
        });
      });
  });
});
