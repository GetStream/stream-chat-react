// Copyright 2004-present Facebook. All Rights Reserved.

import React from 'react';
import { cleanup, render, fireEvent } from '@testing-library/react';
import { ChannelPreviewCompact } from '../src/components/ChannelPreviewCompact';
import uuidv4 from 'uuid/v4';
import { getTestClient, createUserToken } from './utils';

// Note: running cleanup afterEach is done automatically for you in @testing-library/react@9.0.0 or higher
// unmount and cleanup DOM after the test is finished.
// eslint-disable-next-line no-undef
afterEach(cleanup);
const unreadCountClassName = 'str-chat__channel-preview-compact--unread';
const activeChannelClassName = 'str-chat__channel-preview-compact--active';
describe('ChannelPreviewCompact', () => {
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

  it('should call setActiveChannel on click', () => {
    const setActiveChannel = jest.fn();
    const watchers = {};
    const { container } = render(
      <ChannelPreviewCompact
        latestMessage="This is a message from me, this is so cool man!!"
        latestMessageLength={20}
        channel={channel}
        activeChannel={channel}
        setActiveChannel={setActiveChannel}
        watchers={{}}
      />,
    );

    const containerBtn = container.querySelector(
      '.str-chat__channel-preview-compact',
    );
    fireEvent.click(containerBtn);
    expect(setActiveChannel).toHaveBeenCalledTimes(1);
    expect(setActiveChannel).toHaveBeenLastCalledWith(channel, watchers);
  });

  it('should have str-chat__channel-preview-compact--active class only when channel is active', () => {
    const { container, rerender } = render(
      <ChannelPreviewCompact active channel={channel} />,
    );
    let activeDiv = container.querySelector(`.${activeChannelClassName}`);
    expect(activeDiv).toBeTruthy();

    rerender(<ChannelPreviewCompact channel={channel} active={false} />);

    activeDiv = container.querySelector(`.${activeChannelClassName}`);
    expect(activeDiv).toBeFalsy();
  });

  it('should have str-chat__channel-preview-compact--unread class only when unread message count >= 0', () => {
    let unreadCount = 10;
    const { container, rerender } = render(
      <ChannelPreviewCompact
        latestMessage="This is a message from me, this is so cool man!!"
        latestMessageLength={20}
        unread={unreadCount}
        channel={channel}
        activeChannel={channel}
      />,
    );
    let unreadCountDiv = container.querySelector(`.${unreadCountClassName}`);
    expect(unreadCountDiv).toBeTruthy();

    unreadCount = unreadCount + 1;
    rerender(
      <ChannelPreviewCompact
        latestMessage="This is a message from me, this is so cool man!!"
        latestMessageLength={20}
        unread={unreadCount}
        channel={channel}
        activeChannel={channel}
      />,
    );
    expect(unreadCountDiv).toBeTruthy();

    unreadCount = 0;
    rerender(
      <ChannelPreviewCompact
        latestMessage="This is a message from me, this is so cool man!!"
        latestMessageLength={20}
        unread={unreadCount}
        channel={channel}
        activeChannel={channel}
      />,
    );

    unreadCountDiv = container.querySelector(`.${unreadCountClassName}`);
    expect(unreadCountDiv).toBeFalsy();
  });
});
