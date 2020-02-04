// Copyright 2004-present Facebook. All Rights Reserved.

import React from 'react';
import { cleanup, render, fireEvent } from '@testing-library/react';
import { ChannelPreviewMessenger } from '../src/components/ChannelPreviewMessenger';
import uuidv4 from 'uuid/v4';
import { getTestClient, createUserToken } from './utils';

// Note: running cleanup afterEach is done automatically for you in @testing-library/react@9.0.0 or higher
// unmount and cleanup DOM after the test is finished.
// eslint-disable-next-line no-undef
afterEach(cleanup);

describe('ChannelPreviewMessenger', () => {
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

  it('should display latest message in channel (from latestMessage prop)', () => {
    const { getByText, rerender } = render(
      <ChannelPreviewMessenger
        latestMessage="This is a message from me, this is so cool man!!"
        latestMessageLength={20}
        channel={channel}
        activeChannel={channel}
      />,
    );
    expect(getByText('This is a message...')).toBeTruthy();

    // Updating the latest message should reflect in view.
    rerender(
      <ChannelPreviewMessenger
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
      <ChannelPreviewMessenger
        latestMessage="This is a message from me, this is so cool man!!"
        latestMessageLength={20}
        channel={channel}
        activeChannel={channel}
      />,
    );

    // Updating the latest message should reflect in view.
    rerender(
      <ChannelPreviewMessenger
        latestMessage="New Message from me. This should be updated in preview!!"
        latestMessageLength={20}
        channel={channel}
        activeChannel={channel}
      />,
    );

    expect(getByText('New Message from ...')).toBeTruthy();
  });

  it('should call setActiveChannel and closeMenu on click', () => {
    const setActiveChannel = jest.fn();
    const closeMenu = jest.fn();
    const watchers = {};
    const { container } = render(
      <ChannelPreviewMessenger
        latestMessage="This is a message from me, this is so cool man!!"
        latestMessageLength={20}
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
