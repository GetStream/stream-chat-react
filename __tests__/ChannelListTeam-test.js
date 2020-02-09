// Copyright 2004-present Facebook. All Rights Reserved.

import React from 'react';
import { cleanup, render } from '@testing-library/react';
import { ChannelListTeam } from '../src/components/ChannelListTeam';
import uuidv4 from 'uuid/v4';
import { getTestClient, createUserToken } from './utils';

// Note: running cleanup afterEach is done automatically for you in @testing-library/react@9.0.0 or higher
// unmount and cleanup DOM after the test is finished.
// eslint-disable-next-line no-undef
afterEach(cleanup);

describe('ChannelListTeam', () => {
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
      <ChannelListTeam client={chatClient} error />,
    );

    expect(queryByTestId('chat-down')).toBeTruthy();

    rerender(<ChannelListTeam client={chatClient} error={false} />);
    expect(queryByTestId('chat-down')).toBeNull();
  });

  it('should render <LoadingChannels /> only if loading prop is true', () => {
    const { queryByTestId, rerender } = render(
      <ChannelListTeam client={chatClient} loading />,
    );

    expect(queryByTestId('loading-channels')).toBeTruthy();

    rerender(<ChannelListTeam client={chatClient} error={false} />);
    expect(queryByTestId('loading-channels')).toBeNull();
  });

  it('should show sidebar only when showSidebar prop is true', () => {
    const { container, rerender } = render(
      <ChannelListTeam client={chatClient} showSidebar />,
    );

    let sidebar = container.querySelector(
      `.str-chat__channel-list-team__sidebar`,
    );
    expect(sidebar).toBeTruthy();

    rerender(<ChannelListTeam client={chatClient} showSidebar={false} />);

    sidebar = container.querySelector(`.str-chat__channel-list-team__sidebar`);
    expect(sidebar).toBeFalsy();
  });

  it('should display user name', () => {
    const { getByText } = render(
      <ChannelListTeam client={chatClient} showSidebar />,
    );

    const userName = getByText(chatClient.user.name);
    expect(userName).toBeTruthy();
  });

  it('should display user status', () => {
    const { getByText } = render(
      <ChannelListTeam client={chatClient} showSidebar />,
    );

    const userStatus = getByText(chatClient.user.status);
    expect(userStatus).toBeTruthy();
  });
});
