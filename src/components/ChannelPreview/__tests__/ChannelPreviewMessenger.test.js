import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import renderer from 'react-test-renderer';
import { toHaveNoViolations } from 'jest-axe';
import { axe } from '../../../../axe-helper';
import {
  generateChannel,
  generateUser,
  getOrCreateChannelApi,
  getTestClientWithUser,
  useMockedApis,
} from 'mock-builders';

import { ChannelPreviewMessenger } from '../ChannelPreviewMessenger';
import { ChatProvider, ComponentProvider } from '../../../context';

expect.extend(toHaveNoViolations);

const PREVIEW_TEST_ID = 'channel-preview-button';

describe('ChannelPreviewMessenger', () => {
  const clientUser = generateUser();
  let chatClient;
  let channel;
  const renderComponent = (props, componentOverrides) => (
    <ChatProvider value={{ client: { user: { id: 'id' } } }}>
      <ComponentProvider value={componentOverrides}>
        <div aria-label='Select Channel' role='listbox'>
          <ChannelPreviewMessenger
            channel={channel}
            displayImage='https://randomimage.com/src.jpg'
            displayTitle='Channel name'
            latestMessagePreview='Latest message!'
            setActiveChannel={jest.fn()}
            unread={10}
            {...props}
          />
        </div>
      </ComponentProvider>
    </ChatProvider>
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

  it('gives preference to ChannelAvatar from component context over the props Avatar component', () => {
    const channelAvatarTestID = 'custom-channel-avatar';
    const propsAvatarTestID = 'props-avatar';
    const ChannelAvatar = () => <div data-testid={channelAvatarTestID} />;
    const PropsAvatar = () => <div data-testid={propsAvatarTestID} />;
    render(
      renderComponent(
        {
          Avatar: PropsAvatar,
        },
        { ChannelAvatar },
      ),
    );
    expect(screen.queryByTestId(propsAvatarTestID)).not.toBeInTheDocument();
    expect(screen.getByTestId(channelAvatarTestID)).toBeInTheDocument();
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
});
