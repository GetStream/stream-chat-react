import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
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

const PREVIEW_TEST_ID = 'channel-preview-button';

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
      expect(getByTestId(PREVIEW_TEST_ID)).toBeInTheDocument();
    });

    fireEvent.click(getByTestId(PREVIEW_TEST_ID));

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
    const previewButton = screen.queryByTestId(PREVIEW_TEST_ID);
    fireEvent.click(previewButton);
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  describe('mark active channel read', () => {
    let activeChannel;
    let otherChannel;
    let markRead;
    const renderComponent = ({
      activeChannel,
      activePreviewProps = {},
      otherChannel,
      otherPreviewProps = {},
    }) => {
      render(
        <div aria-label='Select Channel' role='listbox'>
          <ChannelPreviewMessenger
            activeChannel={activeChannel}
            channel={activeChannel}
            latestMessage='Latest message!'
            setActiveChannel={jest.fn()}
            {...activePreviewProps}
          />
          <ChannelPreviewMessenger
            activeChannel={activeChannel}
            channel={otherChannel}
            latestMessage='Latest message!'
            setActiveChannel={jest.fn()}
            {...otherPreviewProps}
          />
        </div>,
      );
    };

    beforeEach(() => {
      activeChannel = chatClient.channel('type', '1');
      otherChannel = chatClient.channel('type', '2');
      activeChannel.initialized = true;
      otherChannel.initialized = true;
      activeChannel.state.unreadCount = 1;
      markRead = jest.spyOn(activeChannel, 'markRead');
    });

    afterEach(jest.resetAllMocks);

    it('should mark active channel being left read when enabled', async () => {
      renderComponent({
        activeChannel,
        otherChannel,
        otherPreviewProps: { markActiveChannelReadOnClick: true },
      });
      // eslint-disable-next-line no-unused-vars
      const [_, inactiveChannelPreview] = screen.getAllByTestId(PREVIEW_TEST_ID);
      await act(() => {
        fireEvent.click(inactiveChannelPreview);
      });
      expect(markRead).toHaveBeenCalledTimes(1);
    });

    it('should not mark active channel being left read when enabled but without unread messages', async () => {
      activeChannel.state.unreadCount = 0;
      renderComponent({
        activeChannel,
        otherChannel,
        otherPreviewProps: { markActiveChannelReadOnClick: true },
      });
      // eslint-disable-next-line no-unused-vars
      const [_, inactiveChannelPreview] = screen.getAllByTestId(PREVIEW_TEST_ID);
      await act(() => {
        fireEvent.click(inactiveChannelPreview);
      });
      expect(markRead).not.toHaveBeenCalled();
    });

    it('should not mark active channel being left read when disabled', async () => {
      renderComponent({
        activeChannel,
        otherChannel,
        otherPreviewProps: { markActiveChannelReadOnClick: false },
      });
      // eslint-disable-next-line no-unused-vars
      const [_, inactiveChannelPreview] = screen.getAllByTestId(PREVIEW_TEST_ID);
      await act(() => {
        fireEvent.click(inactiveChannelPreview);
      });
      expect(markRead).not.toHaveBeenCalled();
    });
  });
});
