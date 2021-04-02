import React from 'react';
import { cleanup, render } from '@testing-library/react';
import '@testing-library/jest-dom';

import { Message } from '../Message';
import { MESSAGE_ACTIONS } from '../utils';

import { ChannelActionProvider } from '../../../context/ChannelActionContext';
import { ChannelStateProvider } from '../../../context/ChannelStateContext';
import { ChatProvider } from '../../../context/ChatContext';
import { TranslationProvider } from '../../../context/TranslationContext';
import {
  generateChannel,
  generateMessage,
  generateReaction,
  generateUser,
  getTestClientWithUser,
} from '../../../mock-builders';

const alice = generateUser({
  id: 'alice',
  image: 'alice-avatar.jpg',
  name: 'alice',
});
const bob = generateUser({ image: 'bob-avatar.jpg', name: 'bob' });

const CustomMessageUIComponent = jest.fn(() => <div>Message</div>);

const sendAction = jest.fn();
const sendReaction = jest.fn();
const deleteReaction = jest.fn();
const mouseEventMock = {
  preventDefault: jest.fn(() => {}),
};

async function renderComponent({
  channelActionOpts,
  channelConfig = { replies: true },
  channelStateOpts,
  clientOpts,
  message,
  props = {},
  renderer = render,
}) {
  const channel = generateChannel({
    deleteReaction,
    getConfig: () => channelConfig,
    sendAction,
    sendReaction,
    ...channelStateOpts,
  });
  const client = await getTestClientWithUser(alice);

  return renderer(
    <ChatProvider value={{ client, ...clientOpts }}>
      <ChannelStateProvider value={{ channel, ...channelStateOpts }}>
        <ChannelActionProvider
          value={{
            openThread: jest.fn(),
            removeMessage: jest.fn(),
            updateMessage: jest.fn(),
            ...channelActionOpts,
          }}
        >
          <TranslationProvider value={{ t: (key) => key }}>
            <Message
              message={message}
              Message={CustomMessageUIComponent}
              typing={false}
              {...props}
            />
          </TranslationProvider>
        </ChannelActionProvider>
      </ChannelStateProvider>
    </ChatProvider>,
  );
}

function renderComponentWithMessage(
  props = {},
  channelStateOpts = {},
  channelConfig = { replies: true },
) {
  const message = generateMessage();
  return renderComponent({ channelConfig, channelStateOpts, message, props });
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
    const message = generateMessage({ status: 'received', type: 'regular' });
    await renderComponent({ message });
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
    await renderComponent({ message });
    const { handleReaction } = getRenderedProps();
    handleReaction();
    expect(console.warn).toHaveBeenCalledTimes(1);
  });

  it('should delete own reaction from channel if it was already there', async () => {
    const reaction = generateReaction({ user: alice });
    const message = generateMessage({
      own_reactions: [reaction],
    });
    await renderComponent({ message });
    const { handleReaction } = getRenderedProps();
    await handleReaction(reaction.type);
    expect(deleteReaction).toHaveBeenCalledWith(message.id, reaction.type);
  });

  it('should send reaction', async () => {
    const reaction = generateReaction({ user: bob });
    const message = generateMessage({ own_reactions: [] });
    await renderComponent({ message });
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
    await renderComponent({ channelActionOpts: { updateMessage }, message });
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
    sendAction.mockImplementationOnce(() => Promise.resolve({ message: updatedMessage }));
    await renderComponent({ channelActionOpts: { updateMessage }, message: currentMessage });
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
    await renderComponent({ channelActionOpts: { removeMessage }, message: currentMessage });
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
    await renderComponent({ channelActionOpts: { retrySendMessage }, message });
    const { handleRetry } = getRenderedProps();
    await handleRetry(message);
    expect(retrySendMessage).toHaveBeenCalledWith(message);
  });

  it('should trigger channel mentions handler when there is one set and user clicks on a mention', async () => {
    const message = generateMessage({
      mentioned_users: [bob],
    });
    const onMentionsClick = jest.fn(() => {});
    await renderComponent({ channelActionOpts: { onMentionsClick }, message });
    const { onMentionsClickMessage } = getRenderedProps();
    onMentionsClickMessage(mouseEventMock);
    expect(onMentionsClick).toHaveBeenCalledWith(mouseEventMock, message.mentioned_users);
  });

  it('should trigger channel mentions hover on mentions hover', async () => {
    const message = generateMessage({
      mentioned_users: [bob],
    });
    const onMentionsHover = jest.fn(() => {});
    await renderComponent({ channelActionOpts: { onMentionsHover }, message });
    const { onMentionsHoverMessage } = getRenderedProps();
    onMentionsHoverMessage(mouseEventMock);
    expect(onMentionsHover).toHaveBeenCalledWith(mouseEventMock, message.mentioned_users);
  });

  it('should trigger channel onUserClick handler when a user element is clicked', async () => {
    const message = generateMessage({ user: bob });
    const onUserClickMock = jest.fn(() => {});
    await renderComponent({ message, props: { onUserClick: onUserClickMock } });
    const { onUserClick } = getRenderedProps();
    onUserClick(mouseEventMock);
    expect(onUserClickMock).toHaveBeenCalledWith(mouseEventMock, message.user);
  });

  it('should trigger channel onUserHover handler when a user element is hovered', async () => {
    const message = generateMessage({ user: bob });
    const onUserHoverMock = jest.fn(() => {});
    await renderComponent({ message, props: { onUserHover: onUserHoverMock } });
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
    await renderComponent({
      channelStateOpts: { mutes: [] },
      clientOpts: { client },
      message,
      props: { addNotification, getMuteUserSuccessNotification },
    });
    const { handleMute } = getRenderedProps();
    await handleMute(mouseEventMock);
    expect(muteUser).toHaveBeenCalledWith(bob.id);
    expect(addNotification).toHaveBeenCalledWith(userMutedNotification, 'success');
  });

  it('should allow to mute a user and notify with default success notification when it is successful', async () => {
    const message = generateMessage({ user: bob });
    const defaultSuccessMessage = '{{ user }} has been muted';
    const client = await getTestClientWithUser(alice);
    const addNotification = jest.fn();
    const muteUser = jest.fn(() => Promise.resolve());
    client.muteUser = muteUser;
    await renderComponent({
      channelStateOpts: { mutes: [] },
      clientOpts: { client },
      message,
      props: { addNotification },
      render,
    });
    const { handleMute } = getRenderedProps();
    await handleMute(mouseEventMock);
    expect(muteUser).toHaveBeenCalledWith(bob.id);
    expect(addNotification).toHaveBeenCalledWith(defaultSuccessMessage, 'success');
  });

  it('should allow to mute a user and notify with custom error message when muting a user fails', async () => {
    const message = generateMessage({ user: bob });
    const client = await getTestClientWithUser(alice);
    const addNotification = jest.fn();
    const muteUser = jest.fn(() => Promise.reject());
    const userMutedFailNotification = 'User mute failed!';
    const getMuteUserErrorNotification = jest.fn(() => userMutedFailNotification);
    client.muteUser = muteUser;
    await renderComponent({
      channelStateOpts: { mutes: [] },
      clientOpts: { client },
      message,
      props: { addNotification, getMuteUserErrorNotification },
      render,
    });
    const { handleMute } = getRenderedProps();
    await handleMute(mouseEventMock);
    expect(muteUser).toHaveBeenCalledWith(bob.id);
    expect(addNotification).toHaveBeenCalledWith(userMutedFailNotification, 'error');
  });

  it('should allow to mute a user and notify with default error message when muting a user fails', async () => {
    const message = generateMessage({ user: bob });
    const client = await getTestClientWithUser(alice);
    const addNotification = jest.fn();
    const muteUser = jest.fn(() => Promise.reject());
    const defaultFailNotification = 'Error muting a user ...';
    client.muteUser = muteUser;
    await renderComponent({
      channelStateOpts: { mutes: [] },
      clientOpts: { client },
      message,
      props: { addNotification },
      render,
    });
    const { handleMute } = getRenderedProps();
    await handleMute(mouseEventMock);
    expect(muteUser).toHaveBeenCalledWith(bob.id);
    expect(addNotification).toHaveBeenCalledWith(defaultFailNotification, 'error');
  });

  it('should allow to unmute a user and notify with custom success notification when it is successful', async () => {
    const message = generateMessage({ user: bob });
    const client = await getTestClientWithUser(alice);
    const addNotification = jest.fn();
    const unmuteUser = jest.fn(() => Promise.resolve());
    const userUnmutedNotification = 'User unmuted!';
    const getMuteUserSuccessNotification = jest.fn(() => userUnmutedNotification);
    client.unmuteUser = unmuteUser;
    await renderComponent({
      channelStateOpts: { mutes: [{ target: { id: bob.id } }] },
      clientOpts: { client },
      message,
      props: { addNotification, getMuteUserSuccessNotification },
      render,
    });
    const { handleMute } = getRenderedProps();
    await handleMute(mouseEventMock);
    expect(unmuteUser).toHaveBeenCalledWith(bob.id);
    expect(addNotification).toHaveBeenCalledWith(userUnmutedNotification, 'success');
  });

  it('should allow to unmute a user and notify with default success notification when it is successful', async () => {
    const message = generateMessage({ user: bob });
    const client = await getTestClientWithUser(alice);
    const addNotification = jest.fn();
    const unmuteUser = jest.fn(() => Promise.resolve());
    const defaultSuccessNotification = '{{ user }} has been unmuted';
    client.unmuteUser = unmuteUser;
    await renderComponent({
      channelStateOpts: { mutes: [{ target: { id: bob.id } }] },
      clientOpts: { client },
      message,
      props: { addNotification },
      render,
    });
    const { handleMute } = getRenderedProps();
    await handleMute(mouseEventMock);
    expect(unmuteUser).toHaveBeenCalledWith(bob.id);
    expect(addNotification).toHaveBeenCalledWith(defaultSuccessNotification, 'success');
  });

  it('should allow to unmute a user and notify with custom error message when it fails', async () => {
    const message = generateMessage({ user: bob });
    const client = await getTestClientWithUser(alice);
    const addNotification = jest.fn();
    const unmuteUser = jest.fn(() => Promise.reject());
    const userMutedFailNotification = 'User muted failed!';
    const getMuteUserErrorNotification = jest.fn(() => userMutedFailNotification);
    client.unmuteUser = unmuteUser;
    await renderComponent({
      channelStateOpts: { mutes: [{ target: { id: bob.id } }] },
      clientOpts: { client },
      message,
      props: { addNotification, getMuteUserErrorNotification },
      render,
    });
    const { handleMute } = getRenderedProps();
    await handleMute(mouseEventMock);
    expect(unmuteUser).toHaveBeenCalledWith(bob.id);
    expect(addNotification).toHaveBeenCalledWith(userMutedFailNotification, 'error');
  });

  it('should allow to unmute a user and notify with default error message when it fails', async () => {
    const message = generateMessage({ user: bob });
    const client = await getTestClientWithUser(alice);
    const addNotification = jest.fn();
    const unmuteUser = jest.fn(() => Promise.reject());
    const defaultFailNotification = 'Error unmuting a user ...';
    client.unmuteUser = unmuteUser;
    await renderComponent({
      channelStateOpts: { mutes: [{ target: { id: bob.id } }] },
      clientOpts: { client },
      message,
      props: { addNotification },
      render,
    });
    const { handleMute } = getRenderedProps();
    await handleMute(mouseEventMock);
    expect(unmuteUser).toHaveBeenCalledWith(bob.id);
    expect(addNotification).toHaveBeenCalledWith(defaultFailNotification, 'error');
  });

  it.each([
    ['empty', []],
    ['false', false],
  ])(
    'should return no message actions to UI component if message actions are %s',
    async (_, actionsValue) => {
      const message = generateMessage({ user: bob });
      const messageActions = actionsValue;
      await renderComponent({ message, props: { messageActions } });
      const { getMessageActions } = getRenderedProps();
      expect(getMessageActions()).toStrictEqual([]);
    },
  );

  it('should allow user to edit and delete message when message is from the user', async () => {
    const message = generateMessage({ user: alice });
    await renderComponent({ message });
    const { getMessageActions } = getRenderedProps();
    expect(getMessageActions()).toContain(MESSAGE_ACTIONS.edit);
    expect(getMessageActions()).toContain(MESSAGE_ACTIONS.delete);
  });

  it.each([
    ['moderator', 'moderator'],
    ['channel moderator', 'channel_moderator'],
  ])('should allow user to edit and delete message when user is %s', async (_, role) => {
    const message = generateMessage({ user: bob });
    await renderComponent({
      channelStateOpts: { state: { members: {}, membership: { role }, watchers: {} } },
      message,
    });
    const { getMessageActions } = getRenderedProps();
    expect(getMessageActions()).toContain(MESSAGE_ACTIONS.edit);
    expect(getMessageActions()).toContain(MESSAGE_ACTIONS.delete);
  });

  it('should allow user to edit and delete message when user is owner', async () => {
    const message = generateMessage({ user: bob });
    await renderComponent({
      channelStateOpts: { state: { members: {}, membership: { role: 'owner' }, watchers: {} } },
      message,
    });
    const { getMessageActions } = getRenderedProps();
    expect(getMessageActions()).toContain(MESSAGE_ACTIONS.edit);
    expect(getMessageActions()).toContain(MESSAGE_ACTIONS.delete);
  });

  it('should allow user to edit and delete message when moderator role is set on client', async () => {
    const amin = generateUser({
      name: 'amin',
      role: 'channel_moderator',
    });
    const client = await getTestClientWithUser(amin);
    const message = generateMessage({ user: bob });
    await renderComponent({ clientOpts: { client }, message });
    const { getMessageActions } = getRenderedProps();
    expect(getMessageActions()).toContain(MESSAGE_ACTIONS.edit);
    expect(getMessageActions()).toContain(MESSAGE_ACTIONS.delete);
  });

  it('should allow user to edit and delete message when user is admin', async () => {
    const message = generateMessage({ user: bob });
    await renderComponent({
      channelStateOpts: { state: { members: {}, membership: { role: 'admin' }, watchers: {} } },
      message,
    });
    const { getMessageActions } = getRenderedProps();
    expect(getMessageActions()).toContain(MESSAGE_ACTIONS.edit);
    expect(getMessageActions()).toContain(MESSAGE_ACTIONS.delete);
  });

  it('should not allow user to edit or delete message when user message is not from user and user has no special role', async () => {
    const message = generateMessage({ user: bob });
    await renderComponent({ message });
    const { getMessageActions } = getRenderedProps();
    expect(getMessageActions()).not.toContain(MESSAGE_ACTIONS.edit);
    expect(getMessageActions()).not.toContain(MESSAGE_ACTIONS.delete);
  });

  it('should allow user to flag others messages', async () => {
    const message = generateMessage({ user: bob });
    await renderComponent({ message });
    const { getMessageActions } = getRenderedProps();
    expect(getMessageActions()).toContain(MESSAGE_ACTIONS.flag);
  });

  it('should allow user to mute others messages', async () => {
    const message = generateMessage({ user: bob });
    await renderComponent({ channelConfig: { mutes: true }, message });
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
    const getFlagMessageSuccessNotification = jest.fn(() => messageFlaggedNotification);
    await renderComponent({
      clientOpts: { client },
      message,
      props: { addNotification, getFlagMessageSuccessNotification },
      render,
    });
    const { handleFlag } = getRenderedProps();
    await handleFlag(mouseEventMock);
    expect(flagMessage).toHaveBeenCalledWith(message.id);
    expect(addNotification).toHaveBeenCalledWith(messageFlaggedNotification, 'success');
  });

  it('should allow to flag a message and notify with default success notification when it is successful', async () => {
    const message = generateMessage();
    const client = await getTestClientWithUser(alice);
    const addNotification = jest.fn();
    const flagMessage = jest.fn(() => Promise.resolve());
    client.flagMessage = flagMessage;
    const defaultSuccessNotification = 'Message has been successfully flagged';
    await renderComponent({
      clientOpts: { client },
      message,
      props: { addNotification },
      render,
    });
    const { handleFlag } = getRenderedProps();
    await handleFlag(mouseEventMock);
    expect(flagMessage).toHaveBeenCalledWith(message.id);
    expect(addNotification).toHaveBeenCalledWith(defaultSuccessNotification, 'success');
  });

  it('should allow to flag a message and notify with custom error message when it fails', async () => {
    const message = generateMessage();
    const client = await getTestClientWithUser(alice);
    const addNotification = jest.fn();
    const flagMessage = jest.fn(() => Promise.reject());
    client.flagMessage = flagMessage;
    const messageFlagFailedNotification = 'Message flagged failed!';
    const getFlagMessageErrorNotification = jest.fn(() => messageFlagFailedNotification);
    await renderComponent({
      clientOpts: { client },
      message,
      props: { addNotification, getFlagMessageErrorNotification },
      render,
    });
    const { handleFlag } = getRenderedProps();
    await handleFlag(mouseEventMock);
    expect(flagMessage).toHaveBeenCalledWith(message.id);
    expect(addNotification).toHaveBeenCalledWith(messageFlagFailedNotification, 'error');
  });

  it('should allow to flag a user and notify with default error message when it fails', async () => {
    const message = generateMessage();
    const client = await getTestClientWithUser(alice);
    const addNotification = jest.fn();
    const flagMessage = jest.fn(() => Promise.reject());
    client.flagMessage = flagMessage;
    const defaultFlagMessageFailedNotification =
      'Error adding flag: Either the flag already exist or there is issue with network connection ...';
    await renderComponent({
      clientOpts: { client },
      message,
      props: { addNotification },
      render,
    });
    const { handleFlag } = getRenderedProps();
    await handleFlag(mouseEventMock);
    expect(flagMessage).toHaveBeenCalledWith(message.id);
    expect(addNotification).toHaveBeenCalledWith(defaultFlagMessageFailedNotification, 'error');
  });

  it('should allow user to pin messages when permissions allow', async () => {
    const message = generateMessage({ user: bob });
    await renderComponent({
      channelStateOpts: { state: { members: {}, watchers: {} }, type: 'messaging' },
      message,
      props: { pinPermissions: { messaging: { user: true } } },
    });
    const { getMessageActions } = getRenderedProps();
    expect(getMessageActions()).toContain(MESSAGE_ACTIONS.pin);
  });

  it('should not allow user to pin messages when permissions do not allow', async () => {
    const message = generateMessage({ user: bob });
    await renderComponent({
      channelStateOpts: { state: { members: {}, watchers: {} }, type: 'messaging' },
      message,
      props: { pinPermissions: { messaging: { user: false } } },
    });
    const { getMessageActions } = getRenderedProps();
    expect(getMessageActions()).not.toContain(MESSAGE_ACTIONS.pin);
  });

  it('should allow user to retry sending a message', async () => {
    const message = generateMessage();
    const retrySendMessage = jest.fn(() => Promise.resolve());
    await renderComponent({
      channelActionOpts: { retrySendMessage },
      message,
    });
    const { handleRetry } = getRenderedProps();
    handleRetry(message);
    expect(retrySendMessage).toHaveBeenCalledWith(message);
  });

  it('should allow user to open a thread', async () => {
    const message = generateMessage();
    const openThread = jest.fn();
    await renderComponent({
      channelActionOpts: { openThread },
      message,
    });
    const { handleOpenThread } = getRenderedProps();
    handleOpenThread(mouseEventMock);
    expect(openThread).toHaveBeenCalledWith(message, mouseEventMock);
  });

  it('should correctly tell if message belongs to currently set user', async () => {
    const message = generateMessage({ user: alice });
    const client = await getTestClientWithUser(alice);
    await renderComponent({
      clientOpts: { client },
      message,
    });
    const { isMyMessage } = getRenderedProps();
    expect(isMyMessage(message)).toBe(true);
  });

  it('should pass channel configuration to UI rendered UI component', async () => {
    const message = generateMessage({ user: alice });
    const channelConfigMock = { mutes: false, replies: false };
    await renderComponent({ channelConfig: channelConfigMock, message });
    const { channelConfig } = getRenderedProps();
    expect(channelConfig).toBe(channelConfigMock);
  });

  it('should rerender if message changes', async () => {
    const message = generateMessage({ text: 'Helo!', user: alice });
    const UIMock = jest.fn(() => <div>UI mock</div>);
    const { rerender } = await renderComponent({
      message,
      props: { Message: UIMock },
    });
    const updatedMessage = generateMessage({ text: 'Hello*', user: alice });
    expect(UIMock).toHaveBeenCalledTimes(1);
    UIMock.mockClear();
    await renderComponent({
      message: updatedMessage,
      props: { Message: UIMock },
      render: rerender,
    });
    expect(UIMock).toHaveBeenCalledTimes(1);
  });

  it('should rerender if readBy changes', async () => {
    const message = generateMessage({ user: alice });
    const UIMock = jest.fn(() => <div>UI mock</div>);
    const { rerender } = await renderComponent({
      message,
      props: { Message: UIMock },
    });
    expect(UIMock).toHaveBeenCalledTimes(1);
    UIMock.mockClear();
    await renderComponent({
      message,
      props: { Message: UIMock, readBy: [bob] },
      render: rerender,
    });
    expect(UIMock).toHaveBeenCalledTimes(1);
  });

  it('should rerender if groupStyles change', async () => {
    const message = generateMessage({ user: alice });
    const UIMock = jest.fn(() => <div>UI mock</div>);
    const { rerender } = await renderComponent({
      message,
      props: { groupStyles: ['bottom'], Message: UIMock },
    });
    expect(UIMock).toHaveBeenCalledTimes(1);
    UIMock.mockClear();
    await renderComponent({
      message,
      props: { groupStyles: ['bottom', 'left'], Message: UIMock },
      render: rerender,
    });
    expect(UIMock).toHaveBeenCalledTimes(1);
  });

  it('should last received id changes', async () => {
    const message = generateMessage({ user: alice });
    const UIMock = jest.fn(() => <div>UI mock</div>);
    const { rerender } = await renderComponent({
      message,
      props: { lastReceivedId: 'last-received-id-1', Message: UIMock },
    });
    expect(UIMock).toHaveBeenCalledTimes(1);
    UIMock.mockClear();
    await renderComponent({
      message,
      props: { lastReceivedId: 'last-received-id-2', Message: UIMock },
      render: rerender,
    });
    expect(UIMock).toHaveBeenCalledTimes(1);
  });

  it('should rerender if message list changes position', async () => {
    const message = generateMessage({ user: alice });
    const UIMock = jest.fn(() => <div>UI mock</div>);
    const { rerender } = await renderComponent({
      message,
      props: {
        Message: UIMock,
        messageListRect: {
          height: 100,
          width: 100,
          x: 10,
          y: 10,
        },
      },
    });
    expect(UIMock).toHaveBeenCalledTimes(1);
    UIMock.mockClear();
    await renderComponent({
      message,
      props: {
        Message: UIMock,
        messageListRect: {
          height: 200,
          width: 200,
          x: 20,
          y: 20,
        },
      },
      render: rerender,
    });
    expect(UIMock).toHaveBeenCalledTimes(1);
  });
});
