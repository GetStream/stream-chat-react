import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import { Message } from '../Message';
import { MessageOptions } from '../MessageOptions';
import { MessageSimple } from '../MessageSimple';
import { ACTIONS_NOT_WORKING_IN_THREAD, MESSAGE_ACTIONS } from '../utils';

import { Attachment } from '../../Attachment';
import { defaultReactionOptions } from '../../Reactions';

import {
  ChannelActionProvider,
  ChannelStateProvider,
  ChatProvider,
  ComponentProvider,
  DialogManagerProvider,
} from '../../../context';

import {
  generateChannel,
  generateMessage,
  generateUser,
  getTestClientWithUser,
} from '../../../mock-builders';

const MESSAGE_ACTIONS_TEST_ID = 'message-actions';

const minimumCapabilitiesToRenderMessageActions = { 'delete-any-message': true };
const alice = generateUser({ name: 'alice' });
const defaultMessageProps = {
  initialMessage: false,
  message: generateMessage(),
  messageActions: Object.keys(MESSAGE_ACTIONS),
  threadList: false,
};
const defaultOptionsProps = {};

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
  const channel = generateChannel({
    getConfig: () => channelConfig,
    state: { membership: {} },
  });

  return render(
    <ChatProvider value={{ client }}>
      <DialogManagerProvider id='message-options-dialog-provider'>
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

                Message: () => <MessageSimple channelConfig={channelConfig} />,
                reactionOptions: defaultReactionOptions,
              }}
            >
              <Message {...defaultMessageProps} {...customMessageProps}>
                <MessageOptions {...defaultOptionsProps} {...customOptionsProps} />
              </Message>
            </ComponentProvider>
          </ChannelActionProvider>
        </ChannelStateProvider>
      </DialogManagerProvider>
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
      const { queryByTestId } = await renderMessageOptions({
        customMessageProps: { message },
      });
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
    const { queryByTestId } = await renderMessageOptions({
      channelConfig: { replies: false },
    });
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

    expect(handleOpenThread).toHaveBeenCalled();
  });

  it('should display reactions action when channel has reactions enabled', async () => {
    const { getByTestId } = await renderMessageOptions({
      channelStateOpts: {
        channelCapabilities: { 'send-reaction': true },
      },
    });
    expect(getByTestId(reactionActionTestId)).toBeInTheDocument();
  });

  it('should not display reactions action when channel has reactions disabled', async () => {
    const { queryByTestId } = await renderMessageOptions({
      channelStateOpts: {
        channelCapabilities: { 'send-reaction': false },
      },
    });
    expect(queryByTestId(reactionActionTestId)).not.toBeInTheDocument();
  });

  it('should not render ReactionsSelector until open', async () => {
    const { queryByTestId } = await renderMessageOptions({
      channelStateOpts: {
        channelCapabilities: { 'send-reaction': true },
      },
    });
    expect(screen.queryByTestId('reaction-selector')).not.toBeInTheDocument();
    await act(async () => {
      await fireEvent.click(queryByTestId(reactionActionTestId));
    });
    expect(screen.getByTestId('reaction-selector')).toBeInTheDocument();
  });

  it('should unmount ReactionsSelector when closed by click on dialog overlay', async () => {
    const { queryByTestId } = await renderMessageOptions({
      channelStateOpts: {
        channelCapabilities: { 'send-reaction': true },
      },
    });
    await act(async () => {
      await fireEvent.click(queryByTestId(reactionActionTestId));
    });
    await act(async () => {
      await fireEvent.click(screen.getByTestId('str-chat__dialog-overlay'));
    });
    expect(screen.queryByTestId('reaction-selector')).not.toBeInTheDocument();
  });

  it('should unmount ReactionsSelector when closed pressed Esc button', async () => {
    const { queryByTestId } = await renderMessageOptions({
      channelStateOpts: {
        channelCapabilities: { 'send-reaction': true },
      },
    });
    await act(async () => {
      await fireEvent.click(queryByTestId(reactionActionTestId));
    });
    await act(async () => {
      await fireEvent.keyUp(document, { charCode: 27, code: 'Escape', key: 'Escape' });
    });
    expect(screen.queryByTestId('reaction-selector')).not.toBeInTheDocument();
  });

  it('should unmount ReactionsSelector when closed on reaction selection and closeReactionSelectorOnClick enabled', async () => {
    const { queryByTestId } = await renderMessageOptions({
      channelStateOpts: {
        channelCapabilities: { 'send-reaction': true },
      },
      customMessageProps: {
        closeReactionSelectorOnClick: true,
      },
    });
    await act(async () => {
      await fireEvent.click(queryByTestId(reactionActionTestId));
    });
    await act(async () => {
      await fireEvent.click(screen.queryAllByTestId('select-reaction-button')[0]);
    });
    expect(screen.queryByTestId('reaction-selector')).not.toBeInTheDocument();
  });

  it('should not unmount ReactionsSelector when closed on reaction selection and closeReactionSelectorOnClick enabled', async () => {
    const { queryByTestId } = await renderMessageOptions({
      channelStateOpts: {
        channelCapabilities: { 'send-reaction': true },
      },
      customMessageProps: {
        closeReactionSelectorOnClick: false,
      },
    });
    await act(async () => {
      await fireEvent.click(queryByTestId(reactionActionTestId));
    });
    await act(async () => {
      await fireEvent.click(screen.queryAllByTestId('select-reaction-button')[0]);
    });
    expect(screen.queryByTestId('reaction-selector')).toBeInTheDocument();
  });

  it('should render message actions', async () => {
    const { queryByTestId } = await renderMessageOptions({
      channelStateOpts: {
        channelCapabilities: minimumCapabilitiesToRenderMessageActions,
      },
    });

    expect(queryByTestId(MESSAGE_ACTIONS_TEST_ID)).toBeInTheDocument();
  });

  it('should not show message actions button if actions are disabled', async () => {
    const { queryByTestId } = await renderMessageOptions({
      channelStateOpts: {
        channelCapabilities: minimumCapabilitiesToRenderMessageActions,
      },
      customMessageProps: { messageActions: [] },
    });

    expect(queryByTestId(MESSAGE_ACTIONS_TEST_ID)).not.toBeInTheDocument();
  });

  it('should not show actions box for message in thread if only non-thread actions are available', async () => {
    const { queryByTestId } = await renderMessageOptions({
      channelStateOpts: {
        channelCapabilities: minimumCapabilitiesToRenderMessageActions,
      },
      customMessageProps: {
        messageActions: ACTIONS_NOT_WORKING_IN_THREAD,
        threadList: true,
      },
    });

    expect(queryByTestId(MESSAGE_ACTIONS_TEST_ID)).not.toBeInTheDocument();
  });

  it('should show actions box for message in thread if not only non-thread actions are available', async () => {
    const { queryByTestId } = await renderMessageOptions({
      channelStateOpts: {
        channelCapabilities: minimumCapabilitiesToRenderMessageActions,
      },
      customMessageProps: {
        messageActions: [...ACTIONS_NOT_WORKING_IN_THREAD, MESSAGE_ACTIONS.delete],
        threadList: true,
      },
    });

    expect(queryByTestId(MESSAGE_ACTIONS_TEST_ID)).toBeInTheDocument();
  });

  it('should show actions box for a message in thread if custom actions provided are non-thread', async () => {
    const { queryByTestId } = await renderMessageOptions({
      channelStateOpts: {
        channelCapabilities: minimumCapabilitiesToRenderMessageActions,
      },
      customMessageProps: {
        customMessageActions: ACTIONS_NOT_WORKING_IN_THREAD,
        messageActions: ACTIONS_NOT_WORKING_IN_THREAD,
        threadList: true,
      },
    });
    expect(queryByTestId(MESSAGE_ACTIONS_TEST_ID)).toBeInTheDocument();
  });

  it('should not show actions box for message outside thread with single action "react"', async () => {
    const { queryByTestId } = await renderMessageOptions({
      channelStateOpts: {
        channelCapabilities: minimumCapabilitiesToRenderMessageActions,
      },
      customMessageProps: {
        messageActions: [MESSAGE_ACTIONS.react],
      },
    });
    expect(queryByTestId(MESSAGE_ACTIONS_TEST_ID)).not.toBeInTheDocument();
  });

  it('should show actions box for message outside thread with single action "react" if custom actions available', async () => {
    const { queryByTestId } = await renderMessageOptions({
      channelStateOpts: {
        channelCapabilities: minimumCapabilitiesToRenderMessageActions,
      },
      customMessageProps: {
        customMessageActions: [MESSAGE_ACTIONS.react],
        messageActions: [MESSAGE_ACTIONS.react],
      },
    });

    expect(queryByTestId(MESSAGE_ACTIONS_TEST_ID)).toBeInTheDocument();
  });

  it('should not show actions box for message outside thread with single action "reply"', async () => {
    const { queryByTestId } = await renderMessageOptions({
      channelStateOpts: {
        channelCapabilities: minimumCapabilitiesToRenderMessageActions,
      },
      customMessageProps: {
        messageActions: [MESSAGE_ACTIONS.reply],
      },
    });

    expect(queryByTestId(MESSAGE_ACTIONS_TEST_ID)).not.toBeInTheDocument();
  });

  it('should show actions box for message outside thread with single action "reply" if custom actions available', async () => {
    const { queryByTestId } = await renderMessageOptions({
      channelStateOpts: {
        channelCapabilities: minimumCapabilitiesToRenderMessageActions,
      },
      customMessageProps: {
        customMessageActions: [MESSAGE_ACTIONS.reply],
        messageActions: [MESSAGE_ACTIONS.reply],
      },
    });

    expect(queryByTestId(MESSAGE_ACTIONS_TEST_ID)).toBeInTheDocument();
  });

  it('should not show actions box for message outside thread with two actions "react" & "reply"', async () => {
    const actions = [MESSAGE_ACTIONS.react, MESSAGE_ACTIONS.reply];
    const { queryByTestId } = await renderMessageOptions({
      channelStateOpts: {
        channelCapabilities: minimumCapabilitiesToRenderMessageActions,
      },
      customMessageProps: {
        messageActions: actions,
      },
    });

    expect(queryByTestId(MESSAGE_ACTIONS_TEST_ID)).not.toBeInTheDocument();
  });

  it('should show actions box for message outside thread with single actions "react" & "reply" if custom actions available', async () => {
    const actions = [MESSAGE_ACTIONS.react, MESSAGE_ACTIONS.reply];
    const { queryByTestId } = await renderMessageOptions({
      channelStateOpts: {
        channelCapabilities: minimumCapabilitiesToRenderMessageActions,
      },
      customMessageProps: {
        customMessageActions: actions,
        messageActions: actions,
      },
    });

    expect(queryByTestId(MESSAGE_ACTIONS_TEST_ID)).toBeInTheDocument();
  });
});
