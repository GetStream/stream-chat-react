import React from 'react';
import { cleanup, render } from '@testing-library/react';
import '@testing-library/jest-dom';
import {
  generateChannel,
  getTestClientWithUser,
  generateUser,
  generateMessage,
  generateReaction,
} from 'mock-builders';
import { ChannelContext, TranslationContext } from '../../../context';
import { MESSAGE_ACTIONS } from '../utils';
import Message from '../Message';

const alice = generateUser({
  name: 'alice',
  image: 'alice-avatar.jpg',
  id: 'alice',
});
const bob = generateUser({ name: 'bob', image: 'bob-avatar.jpg' });

const CustomMessageUIComponent = jest.fn(() => <div>Message</div>);

const sendAction = jest.fn();
const sendReaction = jest.fn();
const deleteReaction = jest.fn();
const mouseEventMock = {
  preventDefault: jest.fn(() => {}),
};

async function renderComponent(
  message,
  props = {},
  channelOpts,
  channelConfig = { replies: true },
  renderer = render,
) {
  const channel = generateChannel({
    getConfig: () => channelConfig,
    sendAction,
    sendReaction,
    deleteReaction,
    ...channelOpts,
  });
  const client = await getTestClientWithUser(alice);
  return renderer(
    <ChannelContext.Provider
      value={{
        client,
        channel,
        updateMessage: jest.fn(),
        removeMessage: jest.fn(),
        openThread: jest.fn(),
        ...channelOpts,
      }}
    >
      <TranslationContext.Provider value={{ t: (key) => key }}>
        <Message
          message={message}
          typing={false}
          Message={CustomMessageUIComponent}
          {...props}
        />
      </TranslationContext.Provider>
    </ChannelContext.Provider>,
  );
}

function renderComponentWithMessage(
  props = {},
  channelOpts = {},
  channelConfig = { replies: true },
) {
  const message = generateMessage();
  return renderComponent(message, props, channelOpts, channelConfig);
}

function getRenderedProps() {
  return CustomMessageUIComponent.mock.calls[0][0];
}

describe('<Message /> component', () => {
  beforeEach(jest.clearAllMocks);
  afterEach(cleanup);

  it('should pass custom props to its Message child component', async () => {
    await renderComponentWithMessage({
      customProp: 'some custom prop',
    });
    expect(CustomMessageUIComponent).toHaveBeenCalledWith(
      expect.objectContaining({
        customProp: 'some custom prop',
      }),
      {},
    );
  });

  it('should enable actions if message is of type regular and status received', async () => {
    const message = generateMessage({ type: 'regular', status: 'received' });
    await renderComponent(message);
    expect(CustomMessageUIComponent).toHaveBeenCalledWith(
      expect.objectContaining({
        actionsEnabled: true,
      }),
      {},
    );
  });

  it("should warn if message's own reactions contain a reaction from a different user then the currently active one", async () => {
    const reaction = generateReaction({ user: bob });
    const message = generateMessage({
      own_reactions: [reaction],
    });
    jest.spyOn(console, 'warn').mockImplementationOnce(() => null);
    await renderComponent(message);
    const { handleReaction } = getRenderedProps();
    handleReaction();
    expect(console.warn).toHaveBeenCalledTimes(1);
  });

  it('should delete own reaction from channel if it was already there', async () => {
    const reaction = generateReaction({ user: alice });
    const message = generateMessage({
      own_reactions: [reaction],
    });
    await renderComponent(message);
    const { handleReaction } = getRenderedProps();
    await handleReaction(reaction.type);
    expect(deleteReaction).toHaveBeenCalledWith(message.id, reaction.type);
  });

  it('should send reaction', async () => {
    const reaction = generateReaction({ user: bob });
    const message = generateMessage({ own_reactions: [] });
    await renderComponent(message);
    const { handleReaction } = getRenderedProps();
    await handleReaction(reaction.type);
    expect(sendReaction).toHaveBeenCalledWith(message.id, {
      type: reaction.type,
    });
  });

  it('should rollback reaction if channel update fails', async () => {
    const reaction = generateReaction({ user: bob });
    const message = generateMessage({ own_reactions: [] });
    const updateMessage = jest.fn();
    await renderComponent(message, {}, { updateMessage });
    const { handleReaction } = getRenderedProps();
    sendReaction.mockImplementationOnce(() => Promise.reject());
    await handleReaction(reaction.type);
    expect(updateMessage).toHaveBeenCalledWith(message);
  });

  it('should update message after an action', async () => {
    const updateMessage = jest.fn();
    const currentMessage = generateMessage();
    const updatedMessage = generateMessage();
    const action = {
      name: 'action',
      value: 'value',
    };
    sendAction.mockImplementationOnce(() =>
      Promise.resolve({ message: updatedMessage }),
    );
    await renderComponent(currentMessage, {}, { updateMessage });
    const { handleAction } = getRenderedProps();
    await handleAction(action.name, action.value, mouseEventMock);
    expect(sendAction).toHaveBeenCalledWith(currentMessage.id, {
      [action.name]: action.value,
    });
    expect(updateMessage).toHaveBeenCalledWith(updatedMessage);
  });

  it('should fallback to original message after an action fails', async () => {
    const removeMessage = jest.fn();
    const currentMessage = generateMessage({ user: bob });
    const action = {
      name: 'action',
      value: 'value',
    };
    sendAction.mockImplementationOnce(() => Promise.resolve(undefined));
    await renderComponent(currentMessage, {}, { removeMessage });
    const { handleAction } = getRenderedProps();
    await handleAction(action.name, action.value, mouseEventMock);
    expect(sendAction).toHaveBeenCalledWith(currentMessage.id, {
      [action.name]: action.value,
    });
    expect(removeMessage).toHaveBeenCalledWith(currentMessage);
  });

  it('should handle retry', async () => {
    const message = generateMessage();
    const retrySendMessage = jest.fn(() => Promise.resolve());
    await renderComponent(message, {}, { retrySendMessage });
    const { handleRetry } = getRenderedProps();
    await handleRetry(message);
    expect(retrySendMessage).toHaveBeenCalledWith(message);
  });

  it('should trigger channel mentions handler when there is one set and user clicks on a mention', async () => {
    const message = generateMessage({
      mentioned_users: [bob],
    });
    const onMentionsClick = jest.fn(() => {});
    await renderComponent(message, {}, { onMentionsClick });
    const { onMentionsClickMessage } = getRenderedProps();
    onMentionsClickMessage(mouseEventMock);
    expect(onMentionsClick).toHaveBeenCalledWith(
      mouseEventMock,
      message.mentioned_users,
    );
  });

  it('should trigger channel mentions hover on mentions hover', async () => {
    const message = generateMessage({
      mentioned_users: [bob],
    });
    const onMentionsHover = jest.fn(() => {});
    await renderComponent(message, {}, { onMentionsHover });
    const { onMentionsHoverMessage } = getRenderedProps();
    onMentionsHoverMessage(mouseEventMock);
    expect(onMentionsHover).toHaveBeenCalledWith(
      mouseEventMock,
      message.mentioned_users,
    );
  });

  it('should trigger channel onUserClick handler when a user element is clicked', async () => {
    const message = generateMessage({ user: bob });
    const onUserClickMock = jest.fn(() => {});
    await renderComponent(message, { onUserClick: onUserClickMock });
    const { onUserClick } = getRenderedProps();
    onUserClick(mouseEventMock);
    expect(onUserClickMock).toHaveBeenCalledWith(mouseEventMock, message.user);
  });

  it('should trigger channel onUserHover handler when a user element is hovered', async () => {
    const message = generateMessage({ user: bob });
    const onUserHoverMock = jest.fn(() => {});
    await renderComponent(message, { onUserHover: onUserHoverMock });
    const { onUserHover } = getRenderedProps();
    onUserHover(mouseEventMock);
    expect(onUserHoverMock).toHaveBeenCalledWith(mouseEventMock, message.user);
  });

  it('should allow to mute a user and notify with custom success notification when it is successful', async () => {
    const message = generateMessage({ user: bob });
    const client = await getTestClientWithUser(alice);
    const addNotification = jest.fn();
    const muteUser = jest.fn(() => Promise.resolve());
    const userMutedNotification = 'User muted!';
    const getMuteUserSuccessNotification = jest.fn(() => userMutedNotification);
    client.muteUser = muteUser;
    await renderComponent(
      message,
      {
        addNotification,
        getMuteUserSuccessNotification,
      },
      {
        client,
        mutes: [],
      },
    );
    const { handleMute } = getRenderedProps();
    await handleMute(mouseEventMock);
    expect(muteUser).toHaveBeenCalledWith(bob.id);
    expect(addNotification).toHaveBeenCalledWith(
      userMutedNotification,
      'success',
    );
  });

  it('should allow to mute a user and notify with default success notification when it is successful', async () => {
    const message = generateMessage({ user: bob });
    const defaultSuccessMessage = '{{ user }} has been muted';
    const client = await getTestClientWithUser(alice);
    const addNotification = jest.fn();
    const muteUser = jest.fn(() => Promise.resolve());
    client.muteUser = muteUser;
    await renderComponent(
      message,
      {
        addNotification,
      },
      {
        client,
        mutes: [],
      },
    );
    const { handleMute } = getRenderedProps();
    await handleMute(mouseEventMock);
    expect(muteUser).toHaveBeenCalledWith(bob.id);
    expect(addNotification).toHaveBeenCalledWith(
      defaultSuccessMessage,
      'success',
    );
  });

  it('should allow to mute a user and notify with custom error message when muting a user fails', async () => {
    const message = generateMessage({ user: bob });
    const client = await getTestClientWithUser(alice);
    const addNotification = jest.fn();
    const muteUser = jest.fn(() => Promise.reject());
    const userMutedFailNotification = 'User mute failed!';
    const getMuteUserErrorNotification = jest.fn(
      () => userMutedFailNotification,
    );
    client.muteUser = muteUser;
    await renderComponent(
      message,
      {
        addNotification,
        getMuteUserErrorNotification,
      },
      {
        client,
        mutes: [],
      },
    );
    const { handleMute } = getRenderedProps();
    await handleMute(mouseEventMock);
    expect(muteUser).toHaveBeenCalledWith(bob.id);
    expect(addNotification).toHaveBeenCalledWith(
      userMutedFailNotification,
      'error',
    );
  });

  it('should allow to mute a user and notify with default error message when muting a user fails', async () => {
    const message = generateMessage({ user: bob });
    const client = await getTestClientWithUser(alice);
    const addNotification = jest.fn();
    const muteUser = jest.fn(() => Promise.reject());
    const defaultFailNotification = 'Error muting a user ...';
    client.muteUser = muteUser;
    await renderComponent(
      message,
      {
        addNotification,
      },
      {
        client,
        mutes: [],
      },
    );
    const { handleMute } = getRenderedProps();
    await handleMute(mouseEventMock);
    expect(muteUser).toHaveBeenCalledWith(bob.id);
    expect(addNotification).toHaveBeenCalledWith(
      defaultFailNotification,
      'error',
    );
  });

  it('should allow to unmute a user and notify with custom success notification when it is successful', async () => {
    const message = generateMessage({ user: bob });
    const client = await getTestClientWithUser(alice);
    const addNotification = jest.fn();
    const unmuteUser = jest.fn(() => Promise.resolve());
    const userUnmutedNotification = 'User unmuted!';
    const getMuteUserSuccessNotification = jest.fn(
      () => userUnmutedNotification,
    );
    client.unmuteUser = unmuteUser;
    await renderComponent(
      message,
      {
        addNotification,
        getMuteUserSuccessNotification,
      },
      {
        client,
        mutes: [{ target: { id: bob.id } }],
      },
    );
    const { handleMute } = getRenderedProps();
    await handleMute(mouseEventMock);
    expect(unmuteUser).toHaveBeenCalledWith(bob.id);
    expect(addNotification).toHaveBeenCalledWith(
      userUnmutedNotification,
      'success',
    );
  });

  it('should allow to unmute a user and notify with default success notification when it is successful', async () => {
    const message = generateMessage({ user: bob });
    const client = await getTestClientWithUser(alice);
    const addNotification = jest.fn();
    const unmuteUser = jest.fn(() => Promise.resolve());
    const defaultSuccessNotification = '{{ user }} has been unmuted';
    client.unmuteUser = unmuteUser;
    await renderComponent(
      message,
      {
        addNotification,
      },
      {
        client,
        mutes: [{ target: { id: bob.id } }],
      },
    );
    const { handleMute } = getRenderedProps();
    await handleMute(mouseEventMock);
    expect(unmuteUser).toHaveBeenCalledWith(bob.id);
    expect(addNotification).toHaveBeenCalledWith(
      defaultSuccessNotification,
      'success',
    );
  });

  it('should allow to unmute a user and notify with custom error message when it fails', async () => {
    const message = generateMessage({ user: bob });
    const client = await getTestClientWithUser(alice);
    const addNotification = jest.fn();
    const unmuteUser = jest.fn(() => Promise.reject());
    const userMutedFailNotification = 'User muted failed!';
    const getMuteUserErrorNotification = jest.fn(
      () => userMutedFailNotification,
    );
    client.unmuteUser = unmuteUser;
    await renderComponent(
      message,
      {
        addNotification,
        getMuteUserErrorNotification,
      },
      {
        client,
        mutes: [{ target: { id: bob.id } }],
      },
    );
    const { handleMute } = getRenderedProps();
    await handleMute(mouseEventMock);
    expect(unmuteUser).toHaveBeenCalledWith(bob.id);
    expect(addNotification).toHaveBeenCalledWith(
      userMutedFailNotification,
      'error',
    );
  });

  it('should allow to unmute a user and notify with default error message when it fails', async () => {
    const message = generateMessage({ user: bob });
    const client = await getTestClientWithUser(alice);
    const addNotification = jest.fn();
    const unmuteUser = jest.fn(() => Promise.reject());
    const defaultFailNotification = 'Error unmuting a user ...';
    client.unmuteUser = unmuteUser;
    await renderComponent(
      message,
      {
        addNotification,
      },
      {
        client,
        mutes: [{ target: { id: bob.id } }],
      },
    );
    const { handleMute } = getRenderedProps();
    await handleMute(mouseEventMock);
    expect(unmuteUser).toHaveBeenCalledWith(bob.id);
    expect(addNotification).toHaveBeenCalledWith(
      defaultFailNotification,
      'error',
    );
  });

  it.each([
    ['empty', []],
    ['false', false],
  ])(
    'should return no message actions to UI component if message actions are %s',
    async (_, actionsValue) => {
      const message = generateMessage({ user: bob });
      const messageActions = actionsValue;
      await renderComponent(message, { messageActions });
      const { getMessageActions } = getRenderedProps();
      expect(getMessageActions()).toStrictEqual([]);
    },
  );

  it('should allow user to edit and delete message when message is from the user', async () => {
    const message = generateMessage({ user: alice });
    await renderComponent(message);
    const { getMessageActions } = getRenderedProps();
    expect(getMessageActions()).toContain(MESSAGE_ACTIONS.edit);
    expect(getMessageActions()).toContain(MESSAGE_ACTIONS.delete);
  });

  it.each([
    ['moderator', 'moderator'],
    ['channel moderator', 'channel_moderator'],
  ])(
    'should allow user to edit and delete message when user is %s',
    async (_, role) => {
      const message = generateMessage({ user: bob });
      await renderComponent(message, {}, { state: { membership: { role } } });
      const { getMessageActions } = getRenderedProps();
      expect(getMessageActions()).toContain(MESSAGE_ACTIONS.edit);
      expect(getMessageActions()).toContain(MESSAGE_ACTIONS.delete);
    },
  );

  it('should allow user to edit and delete message when user is owner', async () => {
    const message = generateMessage({ user: bob });
    await renderComponent(
      message,
      {},
      { state: { membership: { role: 'owner' } } },
    );
    const { getMessageActions } = getRenderedProps();
    expect(getMessageActions()).toContain(MESSAGE_ACTIONS.edit);
    expect(getMessageActions()).toContain(MESSAGE_ACTIONS.delete);
  });

  it('should allow user to edit and delete message when user is admin', async () => {
    const message = generateMessage({ user: bob });
    await renderComponent(
      message,
      {},
      { state: { membership: { role: 'admin' } } },
    );
    const { getMessageActions } = getRenderedProps();
    expect(getMessageActions()).toContain(MESSAGE_ACTIONS.edit);
    expect(getMessageActions()).toContain(MESSAGE_ACTIONS.delete);
  });

  it('should not allow user to edit or delete message when user message is not from user and user has no special role', async () => {
    const message = generateMessage({ user: bob });
    await renderComponent(message);
    const { getMessageActions } = getRenderedProps();
    expect(getMessageActions()).not.toContain(MESSAGE_ACTIONS.edit);
    expect(getMessageActions()).not.toContain(MESSAGE_ACTIONS.delete);
  });

  it('should allow user to flag others messages', async () => {
    const message = generateMessage({ user: bob });
    await renderComponent(message);
    const { getMessageActions } = getRenderedProps();
    expect(getMessageActions()).toContain(MESSAGE_ACTIONS.flag);
  });

  it('should allow user to mute others messages', async () => {
    const message = generateMessage({ user: bob });
    await renderComponent(message, {}, {}, { mutes: true });
    const { getMessageActions } = getRenderedProps();
    expect(getMessageActions()).toContain(MESSAGE_ACTIONS.mute);
  });

  it('should allow to flag a message and notify with custom success notification when it is successful', async () => {
    const message = generateMessage();
    const client = await getTestClientWithUser(alice);
    const addNotification = jest.fn();
    const flagMessage = jest.fn(() => Promise.resolve());
    client.flagMessage = flagMessage;
    const messageFlaggedNotification = 'Message flagged!';
    const getFlagMessageSuccessNotification = jest.fn(
      () => messageFlaggedNotification,
    );
    await renderComponent(
      message,
      {
        addNotification,
        getFlagMessageSuccessNotification,
      },
      {
        client,
      },
    );
    const { handleFlag } = getRenderedProps();
    await handleFlag(mouseEventMock);
    expect(flagMessage).toHaveBeenCalledWith(message.id);
    expect(addNotification).toHaveBeenCalledWith(
      messageFlaggedNotification,
      'success',
    );
  });

  it('should allow to flag a message and notify with default success notification when it is successful', async () => {
    const message = generateMessage();
    const client = await getTestClientWithUser(alice);
    const addNotification = jest.fn();
    const flagMessage = jest.fn(() => Promise.resolve());
    client.flagMessage = flagMessage;
    const defaultSuccessNotification = 'Message has been successfully flagged';
    await renderComponent(
      message,
      {
        addNotification,
      },
      { client },
    );
    const { handleFlag } = getRenderedProps();
    await handleFlag(mouseEventMock);
    expect(flagMessage).toHaveBeenCalledWith(message.id);
    expect(addNotification).toHaveBeenCalledWith(
      defaultSuccessNotification,
      'success',
    );
  });

  it('should allow to flag a message and notify with custom error message when it fails', async () => {
    const message = generateMessage();
    const client = await getTestClientWithUser(alice);
    const addNotification = jest.fn();
    const flagMessage = jest.fn(() => Promise.reject());
    client.flagMessage = flagMessage;
    const messageFlagFailedNotification = 'Message flagged failed!';
    const getFlagMessageErrorNotification = jest.fn(
      () => messageFlagFailedNotification,
    );
    await renderComponent(
      message,
      {
        addNotification,
        getFlagMessageErrorNotification,
      },
      { client },
    );
    const { handleFlag } = getRenderedProps();
    await handleFlag(mouseEventMock);
    expect(flagMessage).toHaveBeenCalledWith(message.id);
    expect(addNotification).toHaveBeenCalledWith(
      messageFlagFailedNotification,
      'error',
    );
  });

  it('should allow to flag a user and notify with default error message when it fails', async () => {
    const message = generateMessage();
    const client = await getTestClientWithUser(alice);
    const addNotification = jest.fn();
    const flagMessage = jest.fn(() => Promise.reject());
    client.flagMessage = flagMessage;
    const defaultFlagMessageFailedNotification =
      'Error adding flag: Either the flag already exist or there is issue with network connection ...';
    await renderComponent(
      message,
      {
        addNotification,
      },
      {
        client,
      },
    );
    const { handleFlag } = getRenderedProps();
    await handleFlag(mouseEventMock);
    expect(flagMessage).toHaveBeenCalledWith(message.id);
    expect(addNotification).toHaveBeenCalledWith(
      defaultFlagMessageFailedNotification,
      'error',
    );
  });

  it('should allow user to retry sending a message', async () => {
    const message = generateMessage();
    const retrySendMessage = jest.fn(() => Promise.resolve());
    await renderComponent(
      message,
      {},
      {
        retrySendMessage,
      },
    );
    const { handleRetry } = getRenderedProps();
    handleRetry(message);
    expect(retrySendMessage).toHaveBeenCalledWith(message);
  });

  it('should allow user to open a thread', async () => {
    const message = generateMessage();
    const openThread = jest.fn();
    await renderComponent(
      message,
      {},
      {
        openThread,
      },
    );
    const { handleOpenThread } = getRenderedProps();
    handleOpenThread(mouseEventMock);
    expect(openThread).toHaveBeenCalledWith(message, mouseEventMock);
  });

  it('should correctly tell if message owner is muted', async () => {
    const message = generateMessage({ user: bob });
    await renderComponent(message, {
      mutes: [{ target: { id: bob.id } }],
    });
    const { isUserMuted } = getRenderedProps();
    expect(isUserMuted()).toBe(true);
  });

  it('should correctly tell if message belongs to currently set user', async () => {
    const message = generateMessage({ user: alice });
    const client = await getTestClientWithUser(alice);
    await renderComponent(message, {
      client,
    });
    const { isMyMessage } = getRenderedProps();
    expect(isMyMessage(message)).toBe(true);
  });

  it('should pass channel configuration to UI rendered UI component', async () => {
    const message = generateMessage({ user: alice });
    const channelConfigMock = { replies: false, mutes: false };
    await renderComponent(message, {}, {}, channelConfigMock);
    const { channelConfig } = getRenderedProps();
    expect(channelConfig).toBe(channelConfigMock);
  });

  it('should rerender if message changes', async () => {
    const message = generateMessage({ user: alice, text: 'Helo!' });
    const UIMock = jest.fn(() => <div>UI mock</div>);
    const { rerender } = await renderComponent(message, {
      Message: UIMock,
    });
    const updatedMessage = generateMessage({ user: alice, text: 'Hello*' });
    expect(UIMock).toHaveBeenCalledTimes(1);
    UIMock.mockClear();
    await renderComponent(
      updatedMessage,
      {
        Message: UIMock,
      },
      undefined,
      undefined,
      rerender,
    );
    expect(UIMock).toHaveBeenCalledTimes(1);
  });

  it('should rerender if readBy changes', async () => {
    const message = generateMessage({ user: alice });
    const UIMock = jest.fn(() => <div>UI mock</div>);
    const { rerender } = await renderComponent(message, {
      Message: UIMock,
    });
    expect(UIMock).toHaveBeenCalledTimes(1);
    UIMock.mockClear();
    await renderComponent(
      message,
      {
        Message: UIMock,
        readBy: [bob],
      },
      undefined,
      undefined,
      rerender,
    );
    expect(UIMock).toHaveBeenCalledTimes(1);
  });

  it('should rerender if groupStyles change', async () => {
    const message = generateMessage({ user: alice });
    const UIMock = jest.fn(() => <div>UI mock</div>);
    const { rerender } = await renderComponent(message, {
      Message: UIMock,
      groupStyles: ['bottom'],
    });
    expect(UIMock).toHaveBeenCalledTimes(1);
    UIMock.mockClear();
    await renderComponent(
      message,
      {
        Message: UIMock,
        groupStyles: ['bottom', 'left'],
      },
      undefined,
      undefined,
      rerender,
    );
    expect(UIMock).toHaveBeenCalledTimes(1);
  });

  it('should last received id changes', async () => {
    const message = generateMessage({ user: alice });
    const UIMock = jest.fn(() => <div>UI mock</div>);
    const { rerender } = await renderComponent(message, {
      Message: UIMock,
      lastReceivedId: 'last-received-id-1',
    });
    expect(UIMock).toHaveBeenCalledTimes(1);
    UIMock.mockClear();
    await renderComponent(
      message,
      {
        Message: UIMock,
        lastReceivedId: 'last-received-id-2',
      },
      undefined,
      undefined,
      rerender,
    );
    expect(UIMock).toHaveBeenCalledTimes(1);
  });

  it('should rerender if it enters edit mode', async () => {
    const message = generateMessage({ user: alice });
    const UIMock = jest.fn(() => <div>UI mock</div>);
    const { rerender } = await renderComponent(message, {
      Message: UIMock,
      editing: false,
    });
    expect(UIMock).toHaveBeenCalledTimes(1);
    UIMock.mockClear();
    await renderComponent(
      message,
      {
        Message: UIMock,
        editing: true,
      },
      undefined,
      undefined,
      rerender,
    );
    expect(UIMock).toHaveBeenCalledTimes(1);
  });

  it('should rerender if message list changes position', async () => {
    const message = generateMessage({ user: alice });
    const UIMock = jest.fn(() => <div>UI mock</div>);
    const { rerender } = await renderComponent(message, {
      Message: UIMock,
      messageListRect: {
        height: 100,
        width: 100,
        x: 10,
        y: 10,
      },
    });
    expect(UIMock).toHaveBeenCalledTimes(1);
    UIMock.mockClear();
    await renderComponent(
      message,
      {
        Message: UIMock,
        messageListRect: {
          height: 200,
          width: 200,
          x: 20,
          y: 20,
        },
      },
      undefined,
      undefined,
      rerender,
    );
    expect(UIMock).toHaveBeenCalledTimes(1);
  });
});
