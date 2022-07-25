import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import renderer from 'react-test-renderer';
import { toHaveNoViolations } from 'jest-axe';
import { axe } from '../../../../axe-helper';
expect.extend(toHaveNoViolations);

import {
  generateChannel,
  generateUser,
  getOrCreateChannelApi,
  getTestClientWithUser,
  useMockedApis,
} from 'mock-builders';

import { ChannelPreviewMessenger } from '../ChannelPreviewMessenger';

describe('ChannelPreviewMessenger', () => {
  const clientUser = generateUser();
  let chatClient;
  let channel;
  const renderComponent = (props) => (
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
      expect(getByTestId('channel-preview-button')).toBeInTheDocument();
    });

    fireEvent.click(getByTestId('channel-preview-button'));

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
    const previewButton = screen.queryByTestId('channel-preview-button');
    fireEvent.click(previewButton);
    expect(onSelect).toHaveBeenCalledTimes(1);
  });
});
