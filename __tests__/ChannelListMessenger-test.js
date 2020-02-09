// Copyright 2004-present Facebook. All Rights Reserved.

import React from 'react';
import { cleanup, render } from '@testing-library/react';
import { ChannelListMessenger } from '../src/components/ChannelListMessenger';
import uuidv4 from 'uuid/v4';
import { getTestClient, createUserToken } from './utils';

// Note: running cleanup afterEach is done automatically for you in @testing-library/react@9.0.0 or higher
// unmount and cleanup DOM after the test is finished.
// eslint-disable-next-line no-undef
afterEach(cleanup);

describe('ChannelListMessenger', () => {
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
        name: 'Thierry',
        status: 'busy',
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

  it('should render <ChatDown /> only if error prop is true', () => {
    const { queryByTestId, rerender } = render(
      <ChannelListMessenger client={chatClient} error />,
    );

    expect(queryByTestId('chat-down')).toBeTruthy();

    rerender(<ChannelListMessenger client={chatClient} error={false} />);
    expect(queryByTestId('chat-down')).toBeNull();
  });

  it('should render <LoadingChannels /> only if loading prop is true', () => {
    const { queryByTestId, rerender } = render(
      <ChannelListMessenger client={chatClient} loading />,
    );

    expect(queryByTestId('loading-channels')).toBeTruthy();

    rerender(<ChannelListMessenger client={chatClient} error={false} />);
    expect(queryByTestId('loading-channels')).toBeNull();
  });
});
