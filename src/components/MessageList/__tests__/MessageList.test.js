import React from 'react';
import { act, cleanup, render, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { toHaveNoViolations } from 'jest-axe';
import { axe } from '../../../../axe-helper';
expect.extend(toHaveNoViolations);

import {
  dispatchMessageNewEvent,
  generateChannel,
  generateMember,
  generateMessage,
  generateUser,
  getOrCreateChannelApi,
  getTestClientWithUser,
  useMockedApis,
} from '../../../mock-builders';

import { Chat } from '../../Chat';
import { MessageList } from '../MessageList';
import { Channel } from '../../Channel';

let chatClient;
let channel;
const user1 = generateUser();
const user2 = generateUser();
const mockedChannel = generateChannel({
  members: [generateMember({ user: user1 }), generateMember({ user: user2 })],
  messages: [generateMessage({ user: user1 })],
});

const Avatar = () => <div data-testid='custom-avatar'>Avatar</div>;

const renderComponent = ({ channelProps, chatClient, msgListProps }) =>
  render(
    <Chat client={chatClient}>
      <Channel {...channelProps}>
        <MessageList {...msgListProps} />
      </Channel>
    </Chat>,
  );

describe('MessageList', () => {
  beforeEach(async () => {
    chatClient = await getTestClientWithUser({ id: 'vishal' });
    useMockedApis(chatClient, [getOrCreateChannelApi(mockedChannel)]);
    channel = chatClient.channel('messaging', mockedChannel.id);
    await channel.query();
  });

  afterEach(cleanup);

  it('should add new message at bottom of the list', async () => {
    const { container, getByTestId, getByText } = renderComponent({
      channelProps: { channel },
      chatClient,
    });
    await waitFor(() => {
      expect(getByTestId('reverse-infinite-scroll')).toBeInTheDocument();
    });

    const newMessage = generateMessage({ user: user2 });
    act(() => dispatchMessageNewEvent(chatClient, newMessage, mockedChannel.channel));

    await waitFor(() => {
      expect(getByText(newMessage.text)).toBeInTheDocument();
    });
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('Message UI components should render `Avatar` when the custom prop is provided', async () => {
    const { container, getByTestId } = renderComponent({
      channelProps: {
        Avatar,
        channel,
      },
      chatClient,
    });

    await waitFor(() => {
      expect(getByTestId('reverse-infinite-scroll')).toBeInTheDocument();
      expect(getByTestId('custom-avatar')).toBeInTheDocument();
    });
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should accept a custom group style function', async () => {
    const classNameSuffix = 'msg-list-test';
    const { container, getAllByTestId, getByTestId } = renderComponent({
      channelProps: {
        Avatar,
        channel,
      },
      chatClient,
      msgListProps: { groupStyles: () => classNameSuffix },
    });

    await waitFor(() => {
      expect(getByTestId('reverse-infinite-scroll')).toBeInTheDocument();
    });

    for (let i = 0; i < 3; i++) {
      const newMessage = generateMessage({ text: `text-${i}`, user: user2 });
      act(() => dispatchMessageNewEvent(chatClient, newMessage, mockedChannel.channel));
    }

    await waitFor(() => {
      expect(getAllByTestId(`str-chat__li str-chat__li--${classNameSuffix}`)).toHaveLength(4); // 1 for channel initial message + 3 just sent
    });
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should render DateSeparator by default', async () => {
    const { container } = renderComponent({
      channelProps: { channel },
      chatClient,
    });

    await waitFor(() => {
      expect(document.querySelector('.str-chat__date-separator')).toBeTruthy();
    });

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should not render DateSeparator if disableDateSeparator is true', async () => {
    let container;
    await act(() => {
      const result = renderComponent({
        channelProps: { channel },
        chatClient,
        msgListProps: { disableDateSeparator: true },
      });
      container = result.container;
    });

    await waitFor(() => {
      expect(document.querySelector('.str-chat__date-separator')).toBeFalsy();
    });

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
