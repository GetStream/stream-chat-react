/* eslint-disable jest-dom/prefer-to-have-class */
import React from 'react';
import { fireEvent, render } from '@testing-library/react';
import '@testing-library/jest-dom';

import { Message } from '../Message';
import { MessageOptions } from '../MessageOptions';
import { MessageSimple } from '../MessageSimple';
import { MESSAGE_ACTIONS } from '../utils';

import { Attachment } from '../../Attachment';
import { MessageActions as MessageActionsMock } from '../../MessageActions';

import { ChannelActionProvider } from '../../../context/ChannelActionContext';
import { ChannelStateProvider } from '../../../context/ChannelStateContext';
import { ChatProvider } from '../../../context/ChatContext';
import { ComponentProvider } from '../../../context/ComponentContext';

import {
  generateChannel,
  generateMessage,
  generateUser,
  getTestClientWithUser,
} from '../../../mock-builders';

jest.mock('../../MessageActions', () => ({
  MessageActions: jest.fn(() => <div />),
}));

const alice = generateUser({ name: 'alice' });
const defaultMessageProps = {
  initialMessage: false,
  message: generateMessage(),
  messageActions: Object.keys(MESSAGE_ACTIONS),
  onReactionListClick: () => {},
  threadList: false,
};
const defaultOptionsProps = {
  messageWrapperRef: { current: document.createElement('div') },
};

function generateAliceMessage(messageOptions) {
  return generateMessage({
    user: alice,
    ...messageOptions,
  });
}

async function renderMessageOptions({
  channelConfig,
  channelStateOpts = {},
  customMessageProps = {},
  customOptionsProps = {},
}) {
  const client = await getTestClientWithUser(alice);
  const channel = generateChannel({ getConfig: () => channelConfig, state: { membership: {} } });

  return render(
    <ChatProvider value={{ client }}>
      <ChannelStateProvider value={{ channel, ...channelStateOpts }}>
        <ChannelActionProvider
          value={{
            openThread: jest.fn(),
            removeMessage: jest.fn(),
            updateMessage: jest.fn(),
          }}
        >
          <ComponentProvider
            value={{
              Attachment,
              // eslint-disable-next-line react/display-name
              Message: () => (
                <MessageSimple
                  channelConfig={channelConfig}
                  onReactionListClick={customMessageProps?.onReactionListClick}
                />
              ),
            }}
          >
            <Message {...defaultMessageProps} {...customMessageProps}>
              <MessageOptions {...defaultOptionsProps} {...customOptionsProps} />
            </Message>
          </ComponentProvider>
        </ChannelActionProvider>
      </ChannelStateProvider>
    </ChatProvider>,
  );
}

const threadActionTestId = 'thread-action';
const reactionActionTestId = 'message-reaction-action';

describe('<MessageOptions />', () => {
  beforeEach(jest.clearAllMocks);
  it('should not render message options when there is no message set', async () => {
    const { queryByTestId } = await renderMessageOptions({
      customMessageProps: {
        message: {},
      },
    });
    expect(queryByTestId(/message-options/)).not.toBeInTheDocument();
  });

  it.each([
    ['type', 'error'],
    ['type', 'system'],
    ['type', 'ephemeral'],
    ['status', 'failed'],
    ['status', 'sending'],
  ])(
    'should not render message options when message is of %s %s and is from current user.',
    async (key, value) => {
      const message = generateAliceMessage({ [key]: value });
      const { queryByTestId } = await renderMessageOptions({ customMessageProps: { message } });
      expect(queryByTestId(/message-options/)).not.toBeInTheDocument();
    },
  );

  it('should not render message options when it is parent message in a thread', async () => {
    const { queryByTestId } = await renderMessageOptions({
      customMessageProps: {
        initialMessage: true,
      },
    });
    expect(queryByTestId(/message-options/)).not.toBeInTheDocument();
  });

  it('should display thread actions when message is not displayed in a thread list and channel has replies configured', async () => {
    const { getByTestId } = await renderMessageOptions({
      channelStateOpts: {
        channelCapabilities: { 'send-reply': true },
        channelConfig: { replies: true },
      },
      customMessageProps: defaultMessageProps,
    });
    expect(getByTestId(threadActionTestId)).toBeInTheDocument();
  });

  it('should not display thread actions when message is in a thread list', async () => {
    const { queryByTestId } = await renderMessageOptions({
      channelConfig: { replies: true },
      customMessageProps: { threadList: true },
    });
    expect(queryByTestId(threadActionTestId)).not.toBeInTheDocument();
  });

  it('should not display thread actions when channel does not have replies enabled', async () => {
    const { queryByTestId } = await renderMessageOptions({ channelConfig: { replies: false } });
    expect(queryByTestId(threadActionTestId)).not.toBeInTheDocument();
  });

  it('should trigger open thread handler when custom thread action is set and thread action is clicked', async () => {
    const handleOpenThread = jest.fn(() => {});
    const message = generateMessage();
    const { getByTestId } = await renderMessageOptions({
      channelStateOpts: {
        channelCapabilities: { 'send-reply': true },
        channelConfig: { replies: true },
      },
      customMessageProps: { message, openThread: handleOpenThread, threadList: false },
    });
    expect(handleOpenThread).not.toHaveBeenCalled();
    fireEvent.click(getByTestId(threadActionTestId));
    // eslint-disable-next-line jest/prefer-called-with
    expect(handleOpenThread).toHaveBeenCalled();
  });

  it('should display reactions action when channel has reactions enabled', async () => {
    const { getByTestId } = await renderMessageOptions({
      channelStateOpts: {
        channelCapabilities: { 'send-reaction': true },
        channelConfig: { reactions: true },
      },
    });
    expect(getByTestId(reactionActionTestId)).toBeInTheDocument();
  });

  it('should not display reactions action when channel has reactions disabled', async () => {
    const { queryByTestId } = await renderMessageOptions({ channelConfig: { reactions: false } });
    expect(queryByTestId(reactionActionTestId)).not.toBeInTheDocument();
  });

  it('should render message actions', async () => {
    const minimumCapabilitiesToRenderMessageActions = { 'delete-any-message': true };
    await renderMessageOptions({
      channelStateOpts: { channelCapabilities: minimumCapabilitiesToRenderMessageActions },
    });
    // eslint-disable-next-line jest/prefer-called-with
    expect(MessageActionsMock).toHaveBeenCalled();
  });
});
