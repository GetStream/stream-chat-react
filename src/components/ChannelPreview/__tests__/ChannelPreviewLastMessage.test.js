import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import renderer from 'react-test-renderer';

import {
  generateChannel,
  generateUser,
  getOrCreateChannelApi,
  getTestClientWithUser,
  useMockedApis,
} from 'mock-builders';

import { ChannelPreviewLastMessage } from '../ChannelPreviewLastMessage';

describe('ChannelPreviewLastMessage', () => {
  const clientUser = generateUser();
  let chatClient;
  let channel;
  const renderComponent = (props) => (
    <ChannelPreviewLastMessage
      channel={channel}
      displayImage='https://randomimage.com/src.jpg'
      displayTitle='Channel name'
      latestMessage='This is latest message !!!'
      latestMessageLength={6}
      setActiveChannel={jest.fn()}
      unread={10}
      {...props}
    />
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
    const { getByTestId } = render(
      renderComponent({
        setActiveChannel,
        watchers: {},
      }),
    );

    await waitFor(() => {
      expect(getByTestId('channel-preview-button')).toBeInTheDocument();
    });

    fireEvent.click(getByTestId('channel-preview-button'));

    await waitFor(() => {
      // eslint-disable-next-line jest/prefer-called-with
      expect(setActiveChannel).toHaveBeenCalledTimes(1);
      expect(setActiveChannel).toHaveBeenCalledWith(channel, {});
    });
  });
});
