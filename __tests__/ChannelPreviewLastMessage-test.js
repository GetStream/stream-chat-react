// Copyright 2004-present Facebook. All Rights Reserved.

import React from 'react';
import { cleanup, render, fireEvent } from '@testing-library/react';
import { ChannelPreviewLastMessage } from '../src/components/ChannelPreviewLastMessage';
import uuidv4 from 'uuid/v4';
import { getTestClient, createUserToken } from './utils';

// Note: running cleanup afterEach is done automatically for you in @testing-library/react@9.0.0 or higher
// unmount and cleanup DOM after the test is finished.
// eslint-disable-next-line no-undef
afterEach(cleanup);
const unreadCountClassName = 'str-chat__channel-preview-unread-count';

describe('ChannelPreviewLastMessage', () => {
  let chatClient;
  let userId;
  let userToken;
  let channelID;
  let channel;
  let channelName;
  beforeEach(async function() {
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

  it('should display latest message in channel (from latestMessage prop)', () => {
    const { getByText, rerender } = render(
      <ChannelPreviewLastMessage
        latestMessage="This is a message from me, this is so cool man!!"
        latestMessageLength={20}
        channel={channel}
        activeChannel={channel}
      />,
    );
    expect(getByText('This is a message...')).toBeTruthy();

    // Updating the latest message should reflect in view.
    rerender(
      <ChannelPreviewLastMessage
        latestMessage="New Message from me. This should be updated in preview!!"
        latestMessageLength={20}
        channel={channel}
        activeChannel={channel}
      />,
    );

    expect(getByText('New Message from ...')).toBeTruthy();
  });

  it('should reflect the updated latest message in channel (from latestMessage prop)', () => {
    const { getByText, rerender } = render(
      <ChannelPreviewLastMessage
        latestMessage="This is a message from me, this is so cool man!!"
        latestMessageLength={20}
        channel={channel}
        activeChannel={channel}
      />,
    );

    // Updating the latest message should reflect in view.
    rerender(
      <ChannelPreviewLastMessage
        latestMessage="New Message from me. This should be updated in preview!!"
        latestMessageLength={20}
        channel={channel}
        activeChannel={channel}
      />,
    );

    expect(getByText('New Message from ...')).toBeTruthy();
  });

  it('should call setActiveChannel on click', () => {
    const setActiveChannel = jest.fn();
    const watchers = {};
    const { container } = render(
      <ChannelPreviewLastMessage
        latestMessage="This is a message from me, this is so cool man!!"
        latestMessageLength={20}
        channel={channel}
        activeChannel={channel}
        setActiveChannel={setActiveChannel}
        watchers={{}}
      />,
    );

    const containerBtn = container.querySelector(
      '.str-chat__channel-preview button',
    );
    fireEvent.click(containerBtn);
    expect(setActiveChannel).toHaveBeenCalledTimes(1);
    expect(setActiveChannel).toHaveBeenLastCalledWith(channel, watchers);
  });

  it('should not display unread message count if count is 0', () => {
    const { container } = render(
      <ChannelPreviewLastMessage
        latestMessage="This is a message from me, this is so cool man!!"
        latestMessageLength={20}
        unread_count={0}
        channel={channel}
        activeChannel={channel}
      />,
    );
    const unreadCountDiv = container.querySelector(`.${unreadCountClassName}`);
    expect(unreadCountDiv).toBeFalsy();
  });

  it('should display unread message count when count is greater than 0', () => {
    const unreadCount = 10;
    const { container } = render(
      <ChannelPreviewLastMessage
        latestMessage="This is a message from me, this is so cool man!!"
        latestMessageLength={20}
        unread_count={unreadCount}
        channel={channel}
        activeChannel={channel}
      />,
    );
    const unreadCountDiv = container.querySelector(`.${unreadCountClassName}`);
    expect(unreadCountDiv).toBeTruthy();
    expect(unreadCountDiv.textContent).toBe(unreadCount.toString());
  });

  it('should show new unread count in UI when unread message count changes', () => {
    let unreadCount = 10;
    const { container, rerender } = render(
      <ChannelPreviewLastMessage
        latestMessage="This is a message from me, this is so cool man!!"
        latestMessageLength={20}
        unread_count={unreadCount}
        channel={channel}
        activeChannel={channel}
      />,
    );
    let unreadCountDiv = container.querySelector(`.${unreadCountClassName}`);
    expect(unreadCountDiv).toBeTruthy();
    expect(unreadCountDiv.textContent).toBe(unreadCount.toString());

    unreadCount = unreadCount + 1;
    rerender(
      <ChannelPreviewLastMessage
        latestMessage="This is a message from me, this is so cool man!!"
        latestMessageLength={20}
        unread_count={unreadCount}
        channel={channel}
        activeChannel={channel}
      />,
    );
    expect(unreadCountDiv.textContent).toBe(unreadCount.toString());

    unreadCount = 0;
    rerender(
      <ChannelPreviewLastMessage
        latestMessage="This is a message from me, this is so cool man!!"
        latestMessageLength={20}
        unread_count={unreadCount}
        channel={channel}
        activeChannel={channel}
      />,
    );

    unreadCountDiv = container.querySelector(`.${unreadCountClassName}`);
    expect(unreadCountDiv).toBeFalsy();
  });

  it('should display unread count indicator (small dot) if count is greater than 0', () => {
    const { container } = render(
      <ChannelPreviewLastMessage
        latestMessage="This is a message from me, this is so cool man!!"
        latestMessageLength={20}
        unread_count={10}
        channel={channel}
        activeChannel={channel}
      />,
    );
    const unreadCountDiv = container.querySelector(
      '.str-chat__channel-preview--dot',
    );
    expect(unreadCountDiv).toBeTruthy();
  });

  it('should not display unread count indicator (small dot) if count is 0', () => {
    const { container } = render(
      <ChannelPreviewLastMessage
        latestMessage="This is a message from me, this is so cool man!!"
        latestMessageLength={20}
        unread_count={0}
        channel={channel}
        activeChannel={channel}
      />,
    );
    const unreadCountDiv = container.querySelector(
      '.str-chat__channel-preview--dot',
    );
    expect(unreadCountDiv).toBeFalsy();
  });
});
