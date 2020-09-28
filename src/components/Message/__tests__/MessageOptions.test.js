import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import {
  generateChannel,
  generateUser,
  getTestClientWithUser,
  generateMessage,
} from 'mock-builders';
import { ChannelContext } from '../../../context';
import { MessageActions as MessageActionsMock } from '../../MessageActions';
import { MESSAGE_ACTIONS } from '../utils';
import MessageOptions from '../MessageOptions';

jest.mock('../../MessageActions', () => ({
  MessageActions: jest.fn(() => <div />),
}));

const alice = generateUser({ name: 'alice' });
const defaultProps = {
  message: generateMessage(),
  initialMessage: false,
  threadList: false,
  messageWrapperRef: { current: document.createElement('div') },
  onReactionListClick: () => {},
  getMessageActions: () => Object.keys(MESSAGE_ACTIONS),
};

function generateAliceMessage(messageOptions) {
  return generateMessage({
    user: alice,
    ...messageOptions,
  });
}

async function renderMessageOptions(customProps, channelConfig) {
  const client = await getTestClientWithUser(alice);
  const channel = generateChannel({ getConfig: () => channelConfig });
  return render(
    <ChannelContext.Provider value={{ channel, client }}>
      <MessageOptions {...defaultProps} {...customProps} />
    </ChannelContext.Provider>,
  );
}
const threadActionTestId = 'thread-action';
const reactionActionTestId = 'message-reaction-action';
const messageOptionsTestId = 'message-options';
describe('<MessageOptions />', () => {
  beforeEach(jest.clearAllMocks);
  it('should not render message options when there is no message set', async () => {
    const { queryByTestId } = await renderMessageOptions({
      message: undefined,
    });
    expect(queryByTestId(/message-options/)).toBeNull();
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
      const { queryByTestId } = await renderMessageOptions({ message });
      expect(queryByTestId(/message-options/)).toBeNull();
    },
  );

  it('should not render message options when it is parent message in a thread', async () => {
    const { queryByTestId } = await renderMessageOptions({
      initialMessage: true,
    });
    expect(queryByTestId(/message-options/)).toBeNull();
  });

  it('should display thread actions when message is not displayed on a thread list and channel has replies configured', async () => {
    const { getByTestId } = await renderMessageOptions(defaultProps, {
      replies: true,
    });
    expect(getByTestId(threadActionTestId)).toBeInTheDocument();
  });

  it('should not display thread actions when message is in a thread list', async () => {
    const { queryByTestId } = await renderMessageOptions(
      { threadList: true },
      { replies: true },
    );
    expect(queryByTestId(threadActionTestId)).toBeNull();
  });

  it('should not display thread actions when channel does not have replies enabled', async () => {
    const { queryByTestId } = await renderMessageOptions(
      {},
      { replies: false },
    );
    expect(queryByTestId(threadActionTestId)).toBeNull();
  });

  it('should trigger open thread handler when custom thread action is set and thread action is clicked', async () => {
    const handleOpenThread = jest.fn(() => {});
    const message = generateMessage();
    const { getByTestId } = await renderMessageOptions(
      { threadList: false, handleOpenThread, message },
      { replies: true },
    );
    expect(handleOpenThread).not.toHaveBeenCalled();
    fireEvent.click(getByTestId(threadActionTestId));
    expect(handleOpenThread).toHaveBeenCalledTimes(1);
  });

  it('should display reactions action when channel has reactions enabled', async () => {
    const { getByTestId } = await renderMessageOptions({}, { reactions: true });
    expect(getByTestId(reactionActionTestId)).toBeInTheDocument();
  });

  it('should not display reactions action when channel has reactions disabled', async () => {
    const { queryByTestId } = await renderMessageOptions(
      {},
      { reactions: false },
    );
    expect(queryByTestId(reactionActionTestId)).toBeNull();
  });

  it('should trigger reaction list click when reaction action is clicked', async () => {
    const opentReationList = jest.fn();
    const { getByTestId } = await renderMessageOptions(
      { onReactionListClick: opentReationList },
      { reactions: true },
    );
    expect(opentReationList).not.toHaveBeenCalled();
    fireEvent.click(getByTestId(reactionActionTestId));
    expect(opentReationList).toHaveBeenCalledTimes(1);
  });

  it('should render message actions', async () => {
    await renderMessageOptions();
    expect(MessageActionsMock).toHaveBeenCalledWith(
      expect.objectContaining(defaultProps),
      {},
    );
  });

  it('should not render message with "left-to-the-bubble" style if displayLeft is false', async () => {
    const message = generateAliceMessage();
    const { queryByTestId } = await renderMessageOptions({
      message,
      displayLeft: false,
    });
    expect(queryByTestId('message-options-left')).toBeNull();
  });

  it('should not render message thread actinos if displayReplies is false', async () => {
    const { queryByTestId } = await renderMessageOptions(
      {
        displayReplies: false,
      },
      {
        replies: true,
      },
    );
    expect(queryByTestId(threadActionTestId)).toBeNull();
  });

  it('should render css classes with corresonding theme when it is set', async () => {
    const { queryByTestId } = await renderMessageOptions(
      { theme: 'custom' },
      { reactions: true },
    );
    expect(queryByTestId(messageOptionsTestId).className).toContain(
      'str-chat__message-custom__actions',
    );
    expect(queryByTestId(reactionActionTestId).className).toContain(
      'str-chat__message-custom__actions__action',
    );
  });
});
