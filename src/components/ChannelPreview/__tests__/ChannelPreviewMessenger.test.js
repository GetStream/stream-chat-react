import React from 'react';
import { render, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import renderer from 'react-test-renderer';

import {
  useMockedApis,
  generateUser,
  generateChannel,
  getTestClientWithUser,
  getOrCreateChannelApi,
} from 'mock-builders';

import ChannelPreviewMessenger from '../ChannelPreviewMessenger';

describe('ChannelPreviewMessenger', () => {
  const clientUser = generateUser();
  let chatClient;
  let channel;
  const renderComponent = (props) => {
    return (
      <ChannelPreviewMessenger
        channel={channel}
        latestMessage="This is latest message !!!"
        unread={10}
        latestMessageLength={6}
        displayTitle="Channel name"
        displayImage="https://randomimage.com/src.jpg"
        setActiveChannel={jest.fn()}
        {...props}
      />
    );
  };

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
