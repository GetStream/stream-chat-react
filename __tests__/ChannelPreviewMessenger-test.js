import React from 'react';
import { cleanup, render, fireEvent } from '@testing-library/react';
import uuidv4 from 'uuid/v4';
import truncate from 'lodash/truncate';

import { getTestClient, createUserToken } from './utils';

import { ChannelPreviewMessenger } from '../src/components/ChannelPreviewMessenger';

// eslint-disable-next-line no-undef
afterEach(cleanup);

const latestMessage = 'This is a message from me, this is so cool man!!';

describe('ChannelPreviewMessenger', () => {
  let chatClient;
  let userId;
  let userToken;
  let channelID;
  let channel;
  let channelName;
  beforeAll(async function() {
    chatClient = getTestClient();
    userId = `thierry-${uuidv4()}`;
    userToken = createUserToken(userId);
    channelID = uuidv4();
    chatClient.setUser(
      {
        id: userId,
      },
      userToken,
    );
    channelName = uuidv4();
    channel = chatClient.channel('messaging', channelID, {
      name: channelName,
    });
    await channel.create();
    await channel.watch();
  });

  it('should display empty message (from emptyMessageText prop) when channel has no messages', () => {
    const emptyMessageText = 'Nothing yet...';

    const { getByText } = render(
      <ChannelPreviewMessenger
        latestMessage=""
        emptyMessageText={emptyMessageText}
        channel={channel}
        activeChannel={channel}
        setActiveChannel={() => {}}
      />,
    );

    expect(getByText(emptyMessageText)).toBeTruthy();
    expect(getByText(channelName)).toBeTruthy();
  });

  it('should display latest message truncated to length provided by latestMessageLength prop', () => {
    const latestMessageLength = 20;
    const { getByText } = render(
      <ChannelPreviewMessenger
        latestMessage={latestMessage}
        latestMessageLength={latestMessageLength}
        channel={channel}
        activeChannel={channel}
      />,
    );

    const truncatedLatestMessage = truncate(latestMessage, {
      length: latestMessageLength,
    });

    expect(getByText(truncatedLatestMessage)).toBeTruthy();
  });

  it('should show updated latest message when latestMessage prop changes', () => {
    const { getByText, rerender } = render(
      <ChannelPreviewMessenger
        latestMessage={latestMessage}
        latestMessageLength={10000}
        channel={channel}
        activeChannel={channel}
      />,
    );
    expect(getByText(latestMessage)).toBeTruthy();

    // Updating the latest message should reflect in view.
    const updatedLatestMessage =
      'New Message from me. This should be updated in preview!!';
    rerender(
      <ChannelPreviewMessenger
        latestMessage={updatedLatestMessage}
        latestMessageLength={10000}
        channel={channel}
        activeChannel={channel}
      />,
    );

    expect(getByText(updatedLatestMessage)).toBeTruthy();
  });

  it('should call `setActiveChannel` and `closeMenu` prop functions on click', () => {
    const setActiveChannel = jest.fn();
    const closeMenu = jest.fn();
    const watchers = {};
    const { container } = render(
      <ChannelPreviewMessenger
        latestMessage={latestMessage}
        channel={channel}
        activeChannel={channel}
        setActiveChannel={setActiveChannel}
        watchers={{}}
        closeMenu={closeMenu}
      />,
    );

    const containerBtn = container.querySelector(
      '.str-chat__channel-preview-messenger--last-message',
    );
    fireEvent.click(containerBtn);

    expect(setActiveChannel).toHaveBeenCalledTimes(1);
    expect(setActiveChannel).toHaveBeenLastCalledWith(channel, watchers);
    expect(closeMenu).toHaveBeenCalledTimes(1);
  });
});
