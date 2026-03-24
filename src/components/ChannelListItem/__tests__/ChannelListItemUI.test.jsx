import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { axe } from '../../../../axe-helper';
import {
  generateChannel,
  generateUser,
  getOrCreateChannelApi,
  getTestClientWithUser,
  useMockedApis,
} from 'mock-builders';

import { ChannelListItemUI } from '../ChannelListItemUI';
import { ChatProvider, ComponentProvider, DialogManagerProvider } from '../../../context';

const PREVIEW_TEST_ID = 'channel-list-item-button';

// Stub out ChannelListItemActionButtons to avoid needing ChannelListItemContext and DialogManager
const NoopActionButtons = () => null;
NoopActionButtons.getDialogId = () => '';
NoopActionButtons.displayName = 'ChannelListItemActionButtons';

describe('ChannelPreviewMessenger', () => {
  const clientUser = generateUser();

  let chatClient;
  let channel;
  const renderComponent = (props, componentOverrides = {}) => (
    <ChatProvider value={{ client: chatClient }}>
      <DialogManagerProvider>
        <ComponentProvider
          value={{
            ChannelListItemActionButtons: NoopActionButtons,
            ...componentOverrides,
          }}
        >
          <div aria-label='Select Channel' role='listbox'>
            <ChannelListItemUI
              channel={channel}
              displayImage='https://randomimage.com/src.jpg'
              displayTitle='Channel name'
              latestMessagePreview='Latest message!'
              setActiveChannel={vi.fn()}
              unread={10}
              {...props}
            />
          </div>
        </ComponentProvider>
      </DialogManagerProvider>
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
    const { container } = render(renderComponent());
    expect(container).toMatchSnapshot();
  });

  it('should call setActiveChannel on click', async () => {
    const setActiveChannel = vi.fn();
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
      expect(setActiveChannel).toHaveBeenCalledTimes(1);
      expect(setActiveChannel).toHaveBeenCalledWith(channel, {});
    });

    const results = await axe(container.firstChild.firstChild);

    expect(results).toHaveNoViolations();
  });

  it('should render custom class name', () => {
    const className = 'custom-xxx';
    const { container } = render(renderComponent({ className }));
    expect(container.querySelector(`.${className}`)).toBeInTheDocument();
  });

  it('should call custom onSelect function', () => {
    const onSelect = vi.fn();
    render(renderComponent({ onSelect }));
    const previewButton = screen.queryByTestId(PREVIEW_TEST_ID);
    fireEvent.click(previewButton);
    expect(onSelect).toHaveBeenCalledTimes(1);
  });
});
