import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import renderer from 'react-test-renderer';
import { axe, toHaveNoViolations } from 'jest-axe';
expect.extend(toHaveNoViolations);
// import { render as rendered } from 'react-dom';

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
    <ChannelPreviewMessenger
      channel={channel}
      displayImage='https://randomimage.com/src.jpg'
      displayTitle='Channel name'
      latestMessage='Latest message!'
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

  it('should demonstrate this matcher`s usage with react testing library', async () => {
    const { container } = render(renderComponent());
    // rendered(renderComponent(), document.body);
    // const results = await axe(document.body);
    const results = await axe(container);

    // console.log(html, 'foo');
    // const results = await axe(container);
    // console.log(results, 'foo');
    expect(results).toHaveNoViolations();
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
