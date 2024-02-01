import React, { useEffect } from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import renderer from 'react-test-renderer';
import { toHaveNoViolations } from 'jest-axe';
import { axe } from '../../../../axe-helper';
import {
  generateChannel,
  generateUser,
  getOrCreateChannelApi,
  getTestClientWithUser,
  useMockedApis,
} from 'mock-builders';

import { ChannelPreviewMessenger } from '../ChannelPreviewMessenger';
import { Chat } from '../../Chat';
import { ChatProvider, useChatContext } from '../../../context';
import {
  dispatchMessageNewEvent,
  dispatchNotificationMarkUnread,
  generateMessage,
  initClientWithChannels,
} from '../../../mock-builders';

expect.extend(toHaveNoViolations);

const PREVIEW_TEST_ID = 'channel-preview-button';

describe('ChannelPreviewMessenger', () => {
  const clientUser = generateUser();
  let chatClient;
  let channel;
  const renderComponent = (props) => (
    <ChatProvider value={{ client: { user: { id: 'id' } } }}>
      <div aria-label='Select Channel' role='listbox'>
        <ChannelPreviewMessenger
          channel={channel}
          displayImage='https://randomimage.com/src.jpg'
          displayTitle='Channel name'
          latestMessage='Latest message!'
          setActiveChannel={jest.fn()}
          unread={10}
          {...props}
        />
      </div>
    </ChatProvider>
  );

  const initializeChannel = async (c) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useMockedApis(chatClient, [getOrCreateChannelApi(c)]);

    channel = chatClient.channel('messaging');

    await channel.watch();
  };

  beforeEach(async () => {
    chatClient = await getTestClientWithUser(clientUser);
    await initializeChannel(generateChannel());
  });

  it('should render correctly', () => {
    const tree = renderer.create(renderComponent()).toJSON();
    expect(tree).toMatchSnapshot();
  });

  it('should call setActiveChannel on click', async () => {
    const setActiveChannel = jest.fn();
    const { container, getByTestId } = render(
      renderComponent({
        setActiveChannel,
        watchers: {},
      }),
    );

    await waitFor(() => {
      expect(getByTestId(PREVIEW_TEST_ID)).toBeInTheDocument();
    });

    fireEvent.click(getByTestId(PREVIEW_TEST_ID));

    await waitFor(() => {
      // eslint-disable-next-line jest/prefer-called-with
      expect(setActiveChannel).toHaveBeenCalledTimes(1);
      expect(setActiveChannel).toHaveBeenCalledWith(channel, {});
    });
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should render custom class name', () => {
    const className = 'custom-xxx';
    const { container } = render(renderComponent({ className }));
    expect(container.querySelector(`.${className}`)).toBeInTheDocument();
  });

  it('should call custom onSelect function', () => {
    const onSelect = jest.fn();
    render(renderComponent({ onSelect }));
    const previewButton = screen.queryByTestId(PREVIEW_TEST_ID);
    fireEvent.click(previewButton);
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  describe('mark active channel read', () => {
    const ActiveChannelSetter = ({ activeChannel: activeChannelInit, otherChannel, props }) => {
      const { channel: activeChannel, setActiveChannel } = useChatContext();
      useEffect(() => {
        setActiveChannel(activeChannelInit);
      }, [activeChannelInit, setActiveChannel]);

      if (!activeChannel) return null;
      return (
        <div>
          <ChannelPreviewMessenger
            active={activeChannel?.cid === activeChannelInit.cid}
            activeChannel={activeChannel}
            channel={activeChannelInit}
            latestMessage='Latest message!'
            markActiveChannelReadOnReenter
            setActiveChannel={setActiveChannel}
            {...props}
          />
          <ChannelPreviewMessenger
            active={activeChannel?.cid === otherChannel.cid}
            activeChannel={activeChannel}
            channel={otherChannel}
            latestMessage='Latest message!'
            markActiveChannelReadOnReenter
            setActiveChannel={setActiveChannel}
            {...props}
          />
        </div>
      );
    };
    const renderComponent = async ({ channels, client, props }) => {
      await act(() =>
        render(
          <Chat client={client}>
            <ActiveChannelSetter
              activeChannel={channels[0]}
              otherChannel={channels[1]}
              props={props}
            />
          </Chat>,
        ),
      );
    };

    const setup = async ({ getReadData } = {}) => {
      const user = generateUser();
      const channelCount = 2;
      const messageCount = 5;

      return await initClientWithChannels({
        channelsData: Array.from({ length: channelCount }, (_, channelIndex) => {
          const messages = Array.from({ length: messageCount }, (_, index) =>
            generateMessage({ created_at: new Date(index * 1000).toISOString() }),
          );
          return {
            channel: { id: channelIndex + 1, type: 'type' },
            messages,
            read: [
              getReadData?.(messages, channelIndex, user) ?? {
                last_read: new Date(channelIndex * 1000).toISOString(),
                last_read_message_id: messages[channelIndex].id,
                unread_messages: messageCount - channelIndex - 1,
                user,
              },
            ],
          };
        }),
        customUser: user,
      });
    };

    it.each([
      ['mark', 'enabled', undefined],
      ['not mark', 'disabled', false],
    ])(
      'should %s channel read when re-entered a channel with non-zero unread count and markActiveChannelReadOnReenter %s',
      async (_, __, markActiveChannelReadOnReenter) => {
        const { channels, client } = await setup();
        await renderComponent({ channels, client, props: { markActiveChannelReadOnReenter } });
        const [channel1, channel2] = channels;
        jest.spyOn(channel1, 'markRead');
        jest.spyOn(channel2, 'markRead');
        const [activeChannelPreview, inactiveChannelPreview] = screen.getAllByTestId(
          PREVIEW_TEST_ID,
        );
        await act(() => {
          fireEvent.click(inactiveChannelPreview);
        });
        expect(channel1.markRead).not.toHaveBeenCalled();
        expect(channel2.markRead).not.toHaveBeenCalled();
        await act(() => {
          fireEvent.click(activeChannelPreview);
        });
        if (typeof markActiveChannelReadOnReenter === 'undefined') {
          expect(channel1.markRead).toHaveBeenCalledTimes(1);
        } else {
          expect(channel1.markRead).not.toHaveBeenCalled();
        }
        expect(channel2.markRead).not.toHaveBeenCalled();
        await act(() => {
          fireEvent.click(inactiveChannelPreview);
        });
        if (typeof markActiveChannelReadOnReenter === 'undefined') {
          expect(channel1.markRead).toHaveBeenCalledTimes(1);
          expect(channel2.markRead).toHaveBeenCalledTimes(1);
        } else {
          expect(channel1.markRead).not.toHaveBeenCalled();
          expect(channel2.markRead).not.toHaveBeenCalled();
        }
      },
    );

    it.each([
      ['mark', 'enabled', undefined],
      ['not mark', 'disabled', false],
    ])(
      'should %s channel read when re-entered a channel with zero unread count but existing unread message and markActiveChannelReadOnReenter %s',
      async (_, __, markActiveChannelReadOnReenter) => {
        const { channels, client } = await setup({
          getReadData: (messages, channelIndex, user) => ({
            first_unread_message_id: messages[channelIndex + 1].id,
            last_read: new Date(channelIndex * 1000).toISOString(),
            last_read_message_id: messages[channelIndex].id,
            unread_messages: 0,
            user,
          }),
        });
        const [channel1, channel2] = channels;
        jest.spyOn(channel1, 'markRead');
        jest.spyOn(channel2, 'markRead');

        await renderComponent({ channels, client, props: { markActiveChannelReadOnReenter } });

        await act(() => {
          dispatchNotificationMarkUnread({
            channel: channel1,
            client,
            payload: {
              ...channel1.state.read[client.user],
              first_unread_message_id: channel1.state.messages[1].id,
              total_unread_count: 0,
              unread_channels: 0,
              unread_count: 0,
            },
            user: client.user,
          });
        });

        const [activeChannelPreview, inactiveChannelPreview] = screen.getAllByTestId(
          PREVIEW_TEST_ID,
        );
        await act(() => {
          fireEvent.click(inactiveChannelPreview);
        });
        expect(channel1.markRead).not.toHaveBeenCalled();
        expect(channel2.markRead).not.toHaveBeenCalled();
        await act(() => {
          fireEvent.click(activeChannelPreview);
        });
        if (typeof markActiveChannelReadOnReenter === 'undefined') {
          expect(channel1.markRead).toHaveBeenCalledTimes(1);
        } else {
          expect(channel1.markRead).not.toHaveBeenCalled();
        }
        expect(channel2.markRead).not.toHaveBeenCalled();
      },
    );

    it.each([
      ['mark', 'enabled', undefined],
      ['not mark', 'disabled', false],
    ])(
      'should %s channel read when re-entered a channel with that received a new message in the meantime and markActiveChannelReadOnReenter %s',
      async (_, __, markActiveChannelReadOnReenter) => {
        const { channels, client } = await setup({
          getReadData: (messages, channelIndex, user) => ({
            last_read: messages[messages.length - 1].created_at,
            last_read_message_id: messages[messages.length - 1].id,
            unread_messages: 0,
            user,
          }),
        });
        const [channel1, channel2] = channels;
        jest.spyOn(channel1, 'markRead');
        jest.spyOn(channel2, 'markRead');

        await renderComponent({ channels, client, props: { markActiveChannelReadOnReenter } });

        const [activeChannelPreview, inactiveChannelPreview] = screen.getAllByTestId(
          PREVIEW_TEST_ID,
        );
        await act(() => {
          fireEvent.click(inactiveChannelPreview);
        });
        expect(channel1.markRead).not.toHaveBeenCalled();
        expect(channel2.markRead).not.toHaveBeenCalled();

        await act(() => {
          dispatchMessageNewEvent(client, generateMessage({ user: generateUser() }), channel1);
        });

        await act(() => {
          fireEvent.click(activeChannelPreview);
        });
        expect(channel1.markRead).not.toHaveBeenCalled();
        expect(channel2.markRead).not.toHaveBeenCalled();

        await act(() => {
          fireEvent.click(inactiveChannelPreview);
        });
        expect(channel1.markRead).not.toHaveBeenCalled();
        expect(channel2.markRead).not.toHaveBeenCalled();

        await act(() => {
          fireEvent.click(activeChannelPreview);
        });
        if (typeof markActiveChannelReadOnReenter === 'undefined') {
          expect(channel1.markRead).toHaveBeenCalledTimes(1);
        } else {
          expect(channel1.markRead).not.toHaveBeenCalled();
        }
        expect(channel2.markRead).not.toHaveBeenCalled();
      },
    );

    it.each([
      ['mark', 'enabled', true],
      ['not mark', 'disabled', false],
    ])(
      'should %s channel read when active channel with non-zero unread count is left and markActiveChannelReadOnLeave %s',
      async (_, __, markActiveChannelReadOnLeave) => {
        const { channels, client } = await setup();
        await renderComponent({
          channels,
          client,
          props: { markActiveChannelReadOnLeave, markActiveChannelReadOnReenter: false },
        });
        const [channel1, channel2] = channels;
        jest.spyOn(channel1, 'markRead');
        jest.spyOn(channel2, 'markRead');
        const [activeChannelPreview, inactiveChannelPreview] = screen.getAllByTestId(
          PREVIEW_TEST_ID,
        );
        await act(() => {
          fireEvent.click(inactiveChannelPreview);
        });
        if (markActiveChannelReadOnLeave) {
          expect(channel1.markRead).toHaveBeenCalledTimes(1);
        } else {
          expect(channel1.markRead).not.toHaveBeenCalled();
        }
        expect(channel2.markRead).not.toHaveBeenCalled();

        await act(() => {
          fireEvent.click(activeChannelPreview);
        });
        if (markActiveChannelReadOnLeave) {
          expect(channel1.markRead).toHaveBeenCalledTimes(1);
          expect(channel2.markRead).toHaveBeenCalledTimes(1);
        } else {
          expect(channel1.markRead).not.toHaveBeenCalled();
          expect(channel2.markRead).not.toHaveBeenCalled();
        }
      },
    );

    it.each([
      ['mark', 'enabled', true],
      ['not mark', 'disabled', false],
    ])(
      'should %s channel read when active channel with zero unread count but existing unread message and markActiveChannelReadOnLeave %s',
      async (_, __, markActiveChannelReadOnLeave) => {
        const { channels, client } = await setup({
          getReadData: (messages, channelIndex, user) => ({
            first_unread_message_id: messages[channelIndex + 1].id,
            last_read: new Date(channelIndex * 1000).toISOString(),
            last_read_message_id: messages[channelIndex].id,
            unread_messages: 0,
            user,
          }),
        });
        const [channel1, channel2] = channels;
        jest.spyOn(channel1, 'markRead');
        jest.spyOn(channel2, 'markRead');

        await renderComponent({
          channels,
          client,
          props: { markActiveChannelReadOnLeave, markActiveChannelReadOnReenter: false },
        });

        await act(() => {
          dispatchNotificationMarkUnread({
            channel: channel1,
            client,
            payload: {
              ...channel1.state.read[client.user],
              first_unread_message_id: channel1.state.messages[1].id,
              total_unread_count: 0,
              unread_channels: 0,
              unread_count: 0,
            },
            user: client.user,
          });
        });

        const [activeChannelPreview, inactiveChannelPreview] = screen.getAllByTestId(
          PREVIEW_TEST_ID,
        );
        await act(() => {
          fireEvent.click(inactiveChannelPreview);
        });
        if (markActiveChannelReadOnLeave) {
          expect(channel1.markRead).toHaveBeenCalledTimes(1);
        } else {
          expect(channel1.markRead).not.toHaveBeenCalled();
        }
        expect(channel2.markRead).not.toHaveBeenCalled();

        await act(() => {
          fireEvent.click(activeChannelPreview);
        });
        if (markActiveChannelReadOnLeave) {
          expect(channel1.markRead).toHaveBeenCalledTimes(1);
        } else {
          expect(channel1.markRead).not.toHaveBeenCalled();
        }
        expect(channel2.markRead).not.toHaveBeenCalled();
      },
    );
  });
});
