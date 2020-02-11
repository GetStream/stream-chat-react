import React from 'react';
import { cleanup, render, fireEvent } from '@testing-library/react';
import uuidv4 from 'uuid/v4';
import truncate from 'lodash/truncate';

import { getTestClient, createUserToken } from './utils';

import { ChannelPreviewLastMessage } from '../src/components/ChannelPreviewLastMessage';

// eslint-disable-next-line no-undef
afterEach(cleanup);

const latestMessage = 'This is a message from me, this is so cool man!!';
const unreadCountTestId = 'channel-preview-last-message-unread-count';
const previewDotTestId = 'channel-preview-last-message-dot';

describe('ChannelPreviewLastMessage', () => {
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
      <ChannelPreviewLastMessage
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
      <ChannelPreviewLastMessage
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

  it('should reflect the updated latest message in channel (from latestMessage prop)', () => {
    const { getByText, rerender } = render(
      <ChannelPreviewLastMessage
        latestMessage={latestMessage}
        latestMessageLength={10000}
        channel={channel}
        activeChannel={channel}
      />,
    );

    // Updating the latest message should reflect in view.
    const updatedLatestMessage =
      'New Message from me. This should be updated in preview!!';
    rerender(
      <ChannelPreviewLastMessage
        latestMessage={updatedLatestMessage}
        latestMessageLength={10000}
        channel={channel}
        activeChannel={channel}
      />,
    );

    expect(getByText(updatedLatestMessage)).toBeTruthy();
  });

  it('should call setActiveChannel on click', () => {
    const setActiveChannel = jest.fn();
    const watchers = {};
    const { container } = render(
      <ChannelPreviewLastMessage
        latestMessage={latestMessage}
        latestMessageLength={20}
        channel={channel}
        activeChannel={channel}
        setActiveChannel={setActiveChannel}
        watchers={{}}
      />,
    );

    const containerBtn = container.querySelector('button');

    fireEvent.click(containerBtn);
    expect(setActiveChannel).toHaveBeenCalledTimes(1);
    expect(setActiveChannel).toHaveBeenLastCalledWith(channel, watchers);
  });

  it('should not display unread message count if count is 0', () => {
    const { queryByTestId } = render(
      <ChannelPreviewLastMessage
        latestMessage={latestMessage}
        latestMessageLength={20}
        unread={0}
        channel={channel}
        activeChannel={channel}
      />,
    );
    expect(queryByTestId(unreadCountTestId)).toBeNull();
  });

  it('should show updated unread count when unread prop changes', () => {
    let unreadCount = 10;
    const { getByTestId, queryByTestId, rerender } = render(
      <ChannelPreviewLastMessage
        latestMessage={latestMessage}
        unread={unreadCount}
        channel={channel}
        activeChannel={channel}
      />,
    );
    const unreadCountDiv = getByTestId(unreadCountTestId);
    expect(unreadCountDiv).toBeTruthy();
    expect(unreadCountDiv.textContent).toBe(unreadCount.toString());

    unreadCount = unreadCount + 1;
    rerender(
      <ChannelPreviewLastMessage
        latestMessage={latestMessage}
        unread={unreadCount}
        channel={channel}
        activeChannel={channel}
      />,
    );
    expect(unreadCountDiv.textContent).toBe(unreadCount.toString());

    unreadCount = 0;
    rerender(
      <ChannelPreviewLastMessage
        latestMessage={latestMessage}
        unread={unreadCount}
        channel={channel}
        activeChannel={channel}
      />,
    );

    expect(queryByTestId(unreadCountTestId)).toBeNull();
  });

  it('should display unread count indicator (small dot) only if count is greater than 0', () => {
    const { queryByTestId, rerender } = render(
      <ChannelPreviewLastMessage
        latestMessage={latestMessage}
        unread={10}
        channel={channel}
        activeChannel={channel}
      />,
    );

    expect(queryByTestId(previewDotTestId)).toBeTruthy();

    rerender(
      <ChannelPreviewLastMessage
        latestMessage={latestMessage}
        unread={0}
        channel={channel}
        activeChannel={channel}
      />,
    );

    expect(queryByTestId(previewDotTestId)).toBeNull();
  });
});
