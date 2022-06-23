import React from 'react';
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
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

import { EmptyStateIndicator as EmptyStateIndicatorMock } from '../../EmptyStateIndicator';

jest.mock('../../EmptyStateIndicator', () => ({
  EmptyStateIndicator: jest.fn(),
}));

let chatClient;
let channel;
const user1 = generateUser();
const user2 = generateUser();
const message1 = generateMessage({ text: 'message1', user: user1 });
const reply1 = generateMessage({ parent_id: message1.id, text: 'reply1', user: user1 });
const reply2 = generateMessage({ parent_id: message1.id, text: 'reply2', user: user2 });
const mockedChannelData = generateChannel({
  members: [generateMember({ user: user1 }), generateMember({ user: user2 })],
  messages: [message1],
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
    useMockedApis(chatClient, [getOrCreateChannelApi(mockedChannelData)]);
    channel = chatClient.channel('messaging', mockedChannelData.id);
    await channel.watch();
  });

  afterEach(() => {
    cleanup();
    jest.clearAllMocks();
  });

  it('should add new message at bottom of the list', async () => {
    const { container, getByTestId, getByText } = renderComponent({
      channelProps: { channel },
      chatClient,
    });
    await waitFor(() => {
      expect(getByTestId('reverse-infinite-scroll')).toBeInTheDocument();
    });

    const newMessage = generateMessage({ user: user2 });
    act(() => dispatchMessageNewEvent(chatClient, newMessage, mockedChannelData.channel));

    await waitFor(() => {
      expect(getByText(newMessage.text)).toBeInTheDocument();
    });
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should render the thread head if provided', async () => {
    const MsgListHead = (props) => <div>{props.message.text}</div>;

    await act(() => {
      renderComponent({
        channelProps: { channel },
        chatClient,
        msgListProps: {
          head: <MsgListHead key={'head'} message={message1} />,
          messages: [reply1, reply2],
          threadList: true,
        },
      });
    });

    await waitFor(() => {
      expect(screen.queryByText(message1.text)).toBeInTheDocument();
      expect(screen.queryByText(reply1.text)).toBeInTheDocument();
      expect(screen.queryByText(reply2.text)).toBeInTheDocument();
    });
  });

  it('should not render the thread head if not provided', async () => {
    await act(() => {
      renderComponent({
        channelProps: { channel },
        chatClient,
        msgListProps: { messages: [reply1, reply2], thread: message1, threadList: true },
      });
    });

    await waitFor(() => {
      expect(screen.queryByText(message1.text)).not.toBeInTheDocument();
      expect(screen.queryByText(reply1.text)).toBeInTheDocument();
      expect(screen.queryByText(reply2.text)).toBeInTheDocument();
    });
  });

  it('should render EmptyStateIndicator with corresponding list type in main message list', async () => {
    await act(() => {
      renderComponent({
        channelProps: { channel },
        chatClient,
        msgListProps: { messages: [] },
      });
    });

    await waitFor(() => {
      expect(EmptyStateIndicatorMock).toHaveBeenCalledWith(
        expect.objectContaining({ listType: 'message' }),
        expect.any(Object),
      );
    });
  });

  it('should not render EmptyStateIndicator with corresponding list type in thread', async () => {
    await act(() => {
      renderComponent({
        channelProps: { channel },
        chatClient,
        msgListProps: { messages: [], threadList: true },
      });
    });

    await waitFor(() => {
      expect(EmptyStateIndicatorMock).toHaveBeenCalledTimes(0);
    });
  });

  it('Message UI components should render `Avatar` when the custom prop is provided', async () => {
    let renderResult;
    await act(() => {
      renderResult = renderComponent({
        channelProps: {
          Avatar,
          channel,
        },
        chatClient,
      });
    });

    await waitFor(() => {
      expect(screen.getByTestId('reverse-infinite-scroll')).toBeInTheDocument();
      expect(screen.getByTestId('custom-avatar')).toBeInTheDocument();
    });
    const results = await axe(renderResult.container);
    expect(results).toHaveNoViolations();
  });

  it('should accept a custom group style function', async () => {
    const classNameSuffix = 'msg-list-test';
    let renderResult;
    await act(() => {
      renderResult = renderComponent({
        channelProps: {
          Avatar,
          channel,
        },
        chatClient,
        msgListProps: { groupStyles: () => classNameSuffix },
      });
    });

    await waitFor(() => {
      expect(screen.getByTestId('reverse-infinite-scroll')).toBeInTheDocument();
    });

    for (let i = 0; i < 3; i++) {
      const newMessage = generateMessage({ text: `text-${i}`, user: user2 });
      act(() => dispatchMessageNewEvent(chatClient, newMessage, mockedChannelData.channel));
    }

    await waitFor(() => {
      expect(screen.getAllByTestId(`str-chat__li str-chat__li--${classNameSuffix}`)).toHaveLength(
        4,
      ); // 1 for channel initial message + 3 just sent
    });
    const results = await axe(renderResult.container);
    expect(results).toHaveNoViolations();
  });

  it('should render DateSeparator by default', async () => {
    let container;
    await act(() => {
      const result = renderComponent({
        channelProps: { channel },
        chatClient,
      });
      container = result.container;
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
