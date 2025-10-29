import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import {
  ChatProvider,
  ComponentProvider,
  MessageProvider,
  TranslationProvider,
} from '../../../context';
import { MessageStatus } from '../MessageStatus';
import {
  generateMessage,
  generateUser,
  getTestClientWithUser,
} from '../../../mock-builders';

const MESSAGE_STATUS_SENDING_TEST_ID = 'message-status-sending';
const MESSAGE_STATUS_DELIVERED_TEST_ID = 'message-status-delivered';
const MESSAGE_STATUS_READ_TEST_ID = 'message-status-read-by';
const MESSAGE_STATUS_READ_COUNT_TEST_ID = 'message-status-read-by-many';

const otherUser = { id: 'other-user' };
const user = { id: 'me' };
const foreignMsg = {
  __html: '<p>regular</p>',
  attachments: [],
  created_at: '2024-05-28T15:13:20.899Z',
  html: '<p>regular</p>',
  id: '5kIE4fIArv11V4YHYdXKO',
  mentioned_users: [],
  pinned_at: null,
  status: 'received',
  text: 'udSNfyk7Z-0MRn17WUQwY',
  type: 'regular',
  updated_at: '2024-05-28T15:13:20.900Z',
  user: otherUser,
};

const ownMessage = generateMessage({ user });
const errorMsg = { ...foreignMsg, type: 'error', user };
const sendingMsg = { ...foreignMsg, status: 'sending', user };
const sentMsg = { ...foreignMsg, user };
const deliveredTo = [otherUser, user];
const readByOthers = [otherUser, user];
const t = jest.fn((s) => s);

const defaultMsgCtx = {
  isMyMessage: jest.fn().mockReturnValue(true),
};

const renderComponent = ({ chatCtx, componentCtx, messageCtx, props } = {}) =>
  render(
    <ChatProvider value={chatCtx}>
      <TranslationProvider value={{ t }}>
        <ComponentProvider value={componentCtx || {}}>
          <MessageProvider value={{ ...defaultMsgCtx, ...messageCtx }}>
            <MessageStatus {...props} />
          </MessageProvider>
        </ComponentProvider>
      </TranslationProvider>
    </ChatProvider>,
  );

describe('MessageStatus', () => {
  it('renders nothing for not own messages', async () => {
    const client = await getTestClientWithUser(user);
    const { container } = renderComponent({
      chatCtx: { client },
      messageCtx: {
        deliveredTo,
        isMyMessage: () => false,
        message: foreignMsg,
        readBy: readByOthers,
      },
    });
    expect(container).toBeEmptyDOMElement();
  });
  it('renders nothing for error messages', async () => {
    const client = await getTestClientWithUser(user);
    const { container } = renderComponent({
      chatCtx: { client },
      messageCtx: {
        deliveredTo,
        message: errorMsg,
        readBy: readByOthers,
      },
    });
    expect(container).toBeEmptyDOMElement();
  });

  it('renders default sending UI', async () => {
    const client = await getTestClientWithUser(user);
    renderComponent({
      chatCtx: { client },
      messageCtx: { message: sendingMsg },
    });
    expect(screen.getByTestId(MESSAGE_STATUS_SENDING_TEST_ID)).toMatchSnapshot();
  });

  it('renders custom sending UI', async () => {
    const text = 'CustomMessageSendingStatus';
    const MessageSendingStatus = () => <div>{text}</div>;
    const client = await getTestClientWithUser(user);
    renderComponent({
      chatCtx: { client },
      messageCtx: { message: sendingMsg },
      props: { MessageSendingStatus },
    });
    expect(screen.getByText(text)).toBeInTheDocument();
  });

  it('renders default sent message UI (returnAllReadData=true)', async () => {
    const client = await getTestClientWithUser(user);
    renderComponent({
      chatCtx: { client },
      messageCtx: {
        deliveredTo: [user],
        message: sentMsg,
        readBy: [user],
        returnAllReadData: true,
      },
    });
    expect(screen.getByTestId('message-sent-icon')).toBeInTheDocument();
  });

  it('renders custom sent message UI (returnAllReadData=true)', async () => {
    const text = 'CustomMessageSentStatus';
    const MessageSentStatus = () => <div>{text}</div>;
    const client = await getTestClientWithUser(user);
    renderComponent({
      chatCtx: { client },
      messageCtx: {
        deliveredTo: [user],
        message: sentMsg,
        readBy: [user],
        returnAllReadData: true,
      },
      props: { MessageSentStatus },
    });
    expect(screen.getByText(text)).toBeInTheDocument();
    expect(screen.queryByTestId('message-sent-icon')).not.toBeInTheDocument();
  });

  it('renders default sent message UI (returnAllReadData=false)', async () => {
    const client = await getTestClientWithUser(user);
    renderComponent({
      chatCtx: { client },
      messageCtx: {
        deliveredTo: [user],
        lastOwnMessage: ownMessage,
        message: ownMessage,
        readBy: [user],
      },
    });
    expect(screen.getByTestId('message-sent-icon')).toBeInTheDocument();
  });

  it('renders custom sent message UI (returnAllReadData=false)', async () => {
    const text = 'CustomMessageSentStatus';
    const MessageSentStatus = () => <div>{text}</div>;
    const client = await getTestClientWithUser(user);
    renderComponent({
      chatCtx: { client },
      messageCtx: {
        deliveredTo: [user],
        lastOwnMessage: ownMessage,
        message: ownMessage,
        readBy: [user],
      },
      props: { MessageSentStatus },
    });
    expect(screen.getByText(text)).toBeInTheDocument();
    expect(screen.queryByTestId('message-sent-icon')).not.toBeInTheDocument();
  });

  it('does not render default sent message UI (returnAllReadData=false) if the message is not the last own', async () => {
    const client = await getTestClientWithUser(user);
    renderComponent({
      chatCtx: { client },
      messageCtx: {
        deliveredTo: [user],
        lastOwnMessage: sentMsg,
        message: ownMessage,
        readBy: [user],
      },
    });
    expect(screen.queryByTestId('message-sent-icon')).not.toBeInTheDocument();
  });

  it('does not render custom sent message UI (returnAllReadData=false) if the message is not the last own', async () => {
    const text = 'CustomMessageSentStatus';
    const MessageSentStatus = () => <div>{text}</div>;
    const client = await getTestClientWithUser(user);
    renderComponent({
      chatCtx: { client },
      messageCtx: {
        deliveredTo: [user],
        lastOwnMessage: sentMsg,
        message: ownMessage,
        readBy: [user],
      },
      props: { MessageSentStatus },
    });
    expect(screen.queryByText(text)).not.toBeInTheDocument();
    expect(screen.queryByTestId('message-sent-icon')).not.toBeInTheDocument();
  });

  it('renders default delivered UI for the last message', async () => {
    const client = await getTestClientWithUser(user);
    renderComponent({
      chatCtx: { client },
      messageCtx: { deliveredTo, message: sentMsg, readBy: [user] },
    });
    expect(screen.getByTestId(MESSAGE_STATUS_DELIVERED_TEST_ID)).toBeInTheDocument();
  });

  it('renders custom delivered UI for the last message', async () => {
    const text = 'CustomMessageDeliveredStatus';
    const MessageDeliveredStatus = () => <div>{text}</div>;
    const client = await getTestClientWithUser(user);
    renderComponent({
      chatCtx: { client },
      messageCtx: { deliveredTo, message: sentMsg, readBy: [user] },
      props: { MessageDeliveredStatus },
    });
    expect(screen.getByText(text)).toBeInTheDocument();
  });

  it('renders default read UI for the last message', async () => {
    const client = await getTestClientWithUser(user);
    renderComponent({
      chatCtx: { client },
      messageCtx: {
        deliveredTo,
        message: sentMsg,
        readBy: readByOthers,
      },
    });
    expect(screen.getByTestId(MESSAGE_STATUS_READ_TEST_ID)).toBeInTheDocument();
  });
  it('renders custom read UI for the last message', async () => {
    const text = 'CustomMessageReadStatus';
    const MessageReadStatus = () => <div>{text}</div>;
    const client = await getTestClientWithUser(user);
    renderComponent({
      chatCtx: { client },
      messageCtx: {
        deliveredTo,
        message: sentMsg,
        readBy: readByOthers,
      },
      props: { MessageReadStatus },
    });
    expect(screen.getByText(text)).toBeInTheDocument();
  });

  it('renders custom Avatar in default read status', async () => {
    const text = 'CustomAvatar';
    const Avatar = () => <div>{text}</div>;
    const client = await getTestClientWithUser(user);
    renderComponent({
      chatCtx: { client },
      messageCtx: {
        deliveredTo,
        message: sentMsg,
        readBy: readByOthers,
      },
      props: { Avatar },
    });
    expect(screen.getByText(text)).toBeInTheDocument();
    expect(screen.queryByTestId('avatar')).not.toBeInTheDocument();
  });

  it('reflects messageType prop in root class', async () => {
    const client = await getTestClientWithUser(user);
    const { container } = renderComponent({
      chatCtx: { client },
      messageCtx: { message: sentMsg },
      props: { messageType: 'XXX' },
    });
    expect(container.children[0]).not.toHaveClass('str-chat__message-simple-status');
    expect(container.children[0]).toHaveClass('str-chat__message-XXX-status');
  });

  it('does not render count if read by own user only', async () => {
    const client = await getTestClientWithUser(user);
    renderComponent({
      chatCtx: { client },
      messageCtx: { message: ownMessage, readBy: [user] },
    });
    expect(
      screen.queryByTestId(MESSAGE_STATUS_READ_COUNT_TEST_ID),
    ).not.toBeInTheDocument();
  });

  it('does not render count if read by 1 other user', async () => {
    const client = await getTestClientWithUser(user);
    renderComponent({
      chatCtx: { client },
      messageCtx: { message: ownMessage, readBy: [otherUser] },
    });
    expect(
      screen.queryByTestId(MESSAGE_STATUS_READ_COUNT_TEST_ID),
    ).not.toBeInTheDocument();
  });

  it('renders count if read by 2 other users', async () => {
    const client = await getTestClientWithUser(user);
    renderComponent({
      chatCtx: { client },
      messageCtx: { message: ownMessage, readBy: [generateUser(), generateUser()] },
    });
    expect(screen.getByTestId(MESSAGE_STATUS_READ_COUNT_TEST_ID)).toHaveTextContent('2');
  });
});
