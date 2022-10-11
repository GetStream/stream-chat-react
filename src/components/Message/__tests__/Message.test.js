import React from 'react';
import { cleanup, render } from '@testing-library/react';
import '@testing-library/jest-dom';

import { Message } from '../Message';
import { MESSAGE_ACTIONS } from '../utils';

import { ChannelActionProvider } from '../../../context/ChannelActionContext';
import { ChannelStateProvider } from '../../../context/ChannelStateContext';
import { ChatProvider } from '../../../context/ChatContext';
import { useMessageContext } from '../../../context/MessageContext';
import { TranslationProvider } from '../../../context/TranslationContext';
import {
  generateChannel,
  generateMessage,
  generateReaction,
  generateUser,
  getTestClientWithUser,
} from '../../../mock-builders';
import { ComponentProvider } from '../../../context/ComponentContext';

const alice = generateUser({ id: 'alice', image: 'alice-avatar.jpg', name: 'alice' });
const bob = generateUser({ image: 'bob-avatar.jpg', name: 'bob' });

const sendAction = jest.fn();
const sendReaction = jest.fn();
const deleteReaction = jest.fn();
const mouseEventMock = {
  preventDefault: jest.fn(() => {}),
};

const CustomMessageUIComponent = jest.fn(({ contextCallback }) => {
  const messageContext = useMessageContext();
  contextCallback(messageContext);
  return <div>Message</div>;
});

async function renderComponent({
  channelActionOpts,
  channelConfig = { replies: true },
  channelStateOpts,
  clientOpts,
  components,
  contextCallback = () => {},
  message,
  props = {},
  renderer = render,
}) {
  const channel = generateChannel({
    deleteReaction,
    getConfig: () => channelConfig,
    sendAction,
    sendReaction,
    state: { membership: {} },
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
          <ComponentProvider
            value={{
              // eslint-disable-next-line react/display-name
              Message: () => <CustomMessageUIComponent contextCallback={contextCallback} />,
              ...components,
            }}
          >
            <TranslationProvider value={{ t: (key) => key }}>
              <Message message={message} {...props} />
            </TranslationProvider>
          </ComponentProvider>
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

describe('<Message /> component', () => {
  beforeEach(jest.clearAllMocks);
  afterEach(cleanup);

  it('should not pass custom props to its Message child component', async () => {
    await renderComponentWithMessage({
      customProp: 'some custom prop',
    });

    expect(CustomMessageUIComponent).not.toHaveBeenCalledWith(
      expect.objectContaining({
        customProp: 'some custom prop',
      }),
      {},
    );
  });

  it('should enable actions if message is of type regular and status received', async () => {
    const message = generateMessage({ status: 'received', type: 'regular' });
    let context;

    await renderComponent({
      contextCallback: (ctx) => {
        context = ctx;
      },
      message,
    });

    expect(context.actionsEnabled).toBe(true);
  });

  it("should warn if message's own reactions contain a reaction from a different user then the currently active one", async () => {
    const reaction = generateReaction({ user: bob });
    const message = generateMessage({ own_reactions: [reaction] });
    let context;

    jest.spyOn(console, 'warn').mockImplementationOnce(() => null);

    await renderComponent({
      contextCallback: (ctx) => {
        context = ctx;
      },
      message,
    });

    context.handleReaction();
    expect(console.warn).toHaveBeenCalledTimes(1);
  });

  it('should delete own reaction from channel if it was already there', async () => {
    const reaction = generateReaction({ user: alice });
    const message = generateMessage({ own_reactions: [reaction] });
    let context;

    await renderComponent({
      contextCallback: (ctx) => {
        context = ctx;
      },
      message,
    });

    await context.handleReaction(reaction.type);
    expect(deleteReaction).toHaveBeenCalledWith(message.id, reaction.type);
  });

  it('should send reaction', async () => {
    const reaction = generateReaction({ user: bob });
    const message = generateMessage({ own_reactions: [] });
    let context;

    await renderComponent({
      contextCallback: (ctx) => {
        context = ctx;
      },
      message,
    });

    await context.handleReaction(reaction.type);
    expect(sendReaction).toHaveBeenCalledWith(message.id, { type: reaction.type });
  });

  it('should rollback reaction if channel update fails', async () => {
    const reaction = generateReaction({ user: bob });
    const message = generateMessage({ own_reactions: [] });
    const updateMessage = jest.fn();
    let context;

    await renderComponent({
      channelActionOpts: { updateMessage },
      contextCallback: (ctx) => {
        context = ctx;
      },
      message,
    });

    sendReaction.mockImplementationOnce(() => Promise.reject());

    await context.handleReaction(reaction.type);
    expect(updateMessage).toHaveBeenCalledWith(message);
  });

  it('should update message after an action', async () => {
    const updateMessage = jest.fn();
    const currentMessage = generateMessage();
    const updatedMessage = generateMessage();
    const action = { name: 'action', value: 'value' };
    let context;

    sendAction.mockImplementationOnce(() => Promise.resolve({ message: updatedMessage }));

    await renderComponent({
      channelActionOpts: { updateMessage },
      contextCallback: (ctx) => {
        context = ctx;
      },
      message: currentMessage,
    });

    await context.handleAction(action.name, action.value, mouseEventMock);

    expect(sendAction).toHaveBeenCalledWith(currentMessage.id, { [action.name]: action.value });
    expect(updateMessage).toHaveBeenCalledWith(updatedMessage);
  });

  it('should fallback to original message after an action fails', async () => {
    const removeMessage = jest.fn();
    const currentMessage = generateMessage({ user: bob });
    const action = { name: 'action', value: 'value' };
    let context;

    sendAction.mockImplementationOnce(() => Promise.resolve(undefined));

    await renderComponent({
      channelActionOpts: { removeMessage },
      contextCallback: (ctx) => {
        context = ctx;
      },
      message: currentMessage,
    });

    await context.handleAction(action.name, action.value, mouseEventMock);

    expect(sendAction).toHaveBeenCalledWith(currentMessage.id, { [action.name]: action.value });
    expect(removeMessage).toHaveBeenCalledWith(currentMessage);
  });

  it('should handle retry', async () => {
    const message = generateMessage();
    const retrySendMessage = jest.fn(() => Promise.resolve());
    let context;

    await renderComponent({
      channelActionOpts: { retrySendMessage },
      contextCallback: (ctx) => {
        context = ctx;
      },
      message,
    });

    await context.handleRetry(message);
    expect(retrySendMessage).toHaveBeenCalledWith(message);
  });

  it('should trigger channel mentions handler when there is one set and user clicks on a mention', async () => {
    const message = generateMessage({ mentioned_users: [bob] });
    const onMentionsClick = jest.fn(() => {});
    let context;

    await renderComponent({
      channelActionOpts: { onMentionsClick },
      contextCallback: (ctx) => {
        context = ctx;
      },
      message,
    });

    context.onMentionsClickMessage(mouseEventMock);
    expect(onMentionsClick).toHaveBeenCalledWith(mouseEventMock, message.mentioned_users);
  });

  it('should trigger channel mentions hover on mentions hover', async () => {
    const message = generateMessage({ mentioned_users: [bob] });
    const onMentionsHover = jest.fn(() => {});
    let context;

    await renderComponent({
      channelActionOpts: { onMentionsHover },
      contextCallback: (ctx) => {
        context = ctx;
      },
      message,
    });

    context.onMentionsHoverMessage(mouseEventMock);
    expect(onMentionsHover).toHaveBeenCalledWith(mouseEventMock, message.mentioned_users);
  });

  it('should trigger channel onUserClick handler when a user element is clicked', async () => {
    const message = generateMessage({ user: bob });
    const onUserClickMock = jest.fn(() => {});
    let context;

    await renderComponent({
      contextCallback: (ctx) => {
        context = ctx;
      },
      message,
      props: { onUserClick: onUserClickMock },
    });

    context.onUserClick(mouseEventMock);
    expect(onUserClickMock).toHaveBeenCalledWith(mouseEventMock, message.user);
  });

  it('should trigger channel onUserHover handler when a user element is hovered', async () => {
    const message = generateMessage({ user: bob });
    const onUserHoverMock = jest.fn(() => {});
    let context;

    await renderComponent({
      contextCallback: (ctx) => {
        context = ctx;
      },
      message,
      props: { onUserHover: onUserHoverMock },
    });

    context.onUserHover(mouseEventMock);
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
    let context;

    await renderComponent({
      channelActionOpts: { addNotification },
      channelStateOpts: { mutes: [] },
      clientOpts: { client },
      contextCallback: (ctx) => {
        context = ctx;
      },
      message,
      props: { getMuteUserSuccessNotification },
    });

    await context.handleMute(mouseEventMock);

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
    let context;

    await renderComponent({
      channelActionOpts: { addNotification },
      channelStateOpts: { mutes: [] },
      clientOpts: { client },
      contextCallback: (ctx) => {
        context = ctx;
      },
      message,
      render,
    });

    await context.handleMute(mouseEventMock);

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
    let context;

    await renderComponent({
      channelActionOpts: { addNotification },
      channelStateOpts: { mutes: [] },
      clientOpts: { client },
      contextCallback: (ctx) => {
        context = ctx;
      },
      message,
      props: { getMuteUserErrorNotification },
      render,
    });

    await context.handleMute(mouseEventMock);

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
    let context;

    await renderComponent({
      channelActionOpts: { addNotification },
      channelStateOpts: { mutes: [] },
      clientOpts: { client },
      contextCallback: (ctx) => {
        context = ctx;
      },
      message,
      render,
    });

    await context.handleMute(mouseEventMock);

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
    let context;

    await renderComponent({
      channelActionOpts: { addNotification },
      channelStateOpts: { mutes: [{ target: { id: bob.id } }] },
      clientOpts: { client },
      contextCallback: (ctx) => {
        context = ctx;
      },
      message,
      props: { getMuteUserSuccessNotification },
      render,
    });

    await context.handleMute(mouseEventMock);

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
    let context;

    await renderComponent({
      channelActionOpts: { addNotification },
      channelStateOpts: { mutes: [{ target: { id: bob.id } }] },
      clientOpts: { client },
      contextCallback: (ctx) => {
        context = ctx;
      },
      message,
      render,
    });

    await context.handleMute(mouseEventMock);

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
    let context;

    await renderComponent({
      channelActionOpts: { addNotification },
      channelStateOpts: { mutes: [{ target: { id: bob.id } }] },
      clientOpts: { client },
      contextCallback: (ctx) => {
        context = ctx;
      },
      message,
      props: { getMuteUserErrorNotification },
      render,
    });

    await context.handleMute(mouseEventMock);

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
    let context;

    await renderComponent({
      channelActionOpts: { addNotification },
      channelStateOpts: { mutes: [{ target: { id: bob.id } }] },
      clientOpts: { client },
      contextCallback: (ctx) => {
        context = ctx;
      },
      message,
      render,
    });

    await context.handleMute(mouseEventMock);

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
      let context;

      await renderComponent({
        contextCallback: (ctx) => {
          context = ctx;
        },
        message,
        props: { messageActions },
      });

      expect(context.getMessageActions()).toStrictEqual([]);
    },
  );

  it('should allow user to edit and delete message when message is from the user', async () => {
    const message = generateMessage({ user: alice });
    let context;

    await renderComponent({
      channelStateOpts: {
        channelCapabilities: { 'delete-own-message': true, 'update-own-message': true },
      },
      contextCallback: (ctx) => {
        context = ctx;
      },
      message,
    });

    expect(context.getMessageActions()).toContain(MESSAGE_ACTIONS.edit);
    expect(context.getMessageActions()).toContain(MESSAGE_ACTIONS.delete);
  });

  it.each([
    ['moderator', 'moderator'],
    ['channel moderator', 'channel_moderator'],
  ])('should allow user to edit and delete message when user is %s', async (_, role) => {
    const message = generateMessage({ user: bob });
    let context;

    await renderComponent({
      channelStateOpts: {
        channelCapabilities: { 'delete-any-message': true, 'update-any-message': true },
        state: { members: {}, membership: { role }, watchers: {} },
      },
      contextCallback: (ctx) => {
        context = ctx;
      },
      message,
    });

    expect(context.getMessageActions()).toContain(MESSAGE_ACTIONS.edit);
    expect(context.getMessageActions()).toContain(MESSAGE_ACTIONS.delete);
  });

  it('should not allow user to edit and delete messages when user is the channel owner', async () => {
    const message = generateMessage({ user: bob });
    let context;

    await renderComponent({
      channelStateOpts: { state: { members: {}, membership: { role: 'owner' }, watchers: {} } },
      contextCallback: (ctx) => {
        context = ctx;
      },
      message,
    });

    expect(context.getMessageActions()).not.toContain(MESSAGE_ACTIONS.edit);
    expect(context.getMessageActions()).not.toContain(MESSAGE_ACTIONS.delete);
  });

  it('should allow user to edit and delete message when moderator role is set on client', async () => {
    const amin = generateUser({ name: 'amin', role: 'channel_moderator' });
    const client = await getTestClientWithUser(amin);
    const message = generateMessage({ user: bob });
    let context;

    await renderComponent({
      channelStateOpts: {
        channelCapabilities: { 'delete-any-message': true, 'update-any-message': true },
      },
      clientOpts: { client },
      contextCallback: (ctx) => {
        context = ctx;
      },
      message,
    });

    expect(context.getMessageActions()).toContain(MESSAGE_ACTIONS.edit);
    expect(context.getMessageActions()).toContain(MESSAGE_ACTIONS.delete);
  });

  it('should allow user to edit and delete message when user is admin', async () => {
    const message = generateMessage({ user: bob });
    let context;

    await renderComponent({
      channelStateOpts: {
        channelCapabilities: { 'delete-any-message': true, 'update-any-message': true },
        state: { members: {}, membership: { role: 'admin' }, watchers: {} },
      },
      contextCallback: (ctx) => {
        context = ctx;
      },
      message,
    });

    expect(context.getMessageActions()).toContain(MESSAGE_ACTIONS.edit);
    expect(context.getMessageActions()).toContain(MESSAGE_ACTIONS.delete);
  });

  it('should not allow user to edit or delete message when user message is not from user and user has no special role', async () => {
    const message = generateMessage({ user: bob });
    let context;

    await renderComponent({
      contextCallback: (ctx) => {
        context = ctx;
      },
      message,
    });

    expect(context.getMessageActions()).not.toContain(MESSAGE_ACTIONS.edit);
    expect(context.getMessageActions()).not.toContain(MESSAGE_ACTIONS.delete);
  });

  it('should allow user to flag others messages', async () => {
    const message = generateMessage({ user: bob });
    let context;

    await renderComponent({
      channelStateOpts: { channelCapabilities: { 'flag-message': true } },
      contextCallback: (ctx) => {
        context = ctx;
      },
      message,
    });

    expect(context.getMessageActions()).toContain(MESSAGE_ACTIONS.flag);
  });

  it('should allow user to mute others messages', async () => {
    const message = generateMessage({ user: bob });
    let context;

    await renderComponent({
      channelStateOpts: { channelCapabilities: { 'mute-channel': true } },
      contextCallback: (ctx) => {
        context = ctx;
      },
      message,
    });

    expect(context.getMessageActions()).toContain(MESSAGE_ACTIONS.mute);
  });

  it('should allow to flag a message and notify with custom success notification when it is successful', async () => {
    const message = generateMessage();
    const client = await getTestClientWithUser(alice);
    const addNotification = jest.fn();
    const flagMessage = jest.fn(() => Promise.resolve());
    client.flagMessage = flagMessage;
    const messageFlaggedNotification = 'Message flagged!';
    const getFlagMessageSuccessNotification = jest.fn(() => messageFlaggedNotification);
    let context;

    await renderComponent({
      channelActionOpts: { addNotification },
      clientOpts: { client },
      contextCallback: (ctx) => {
        context = ctx;
      },
      message,
      props: { getFlagMessageSuccessNotification },
      render,
    });

    await context.handleFlag(mouseEventMock);

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
    let context;

    await renderComponent({
      channelActionOpts: { addNotification },
      clientOpts: { client },
      contextCallback: (ctx) => {
        context = ctx;
      },
      message,
      render,
    });

    await context.handleFlag(mouseEventMock);

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
    let context;

    await renderComponent({
      channelActionOpts: { addNotification },
      clientOpts: { client },
      contextCallback: (ctx) => {
        context = ctx;
      },
      message,
      props: { getFlagMessageErrorNotification },
      render,
    });

    await context.handleFlag(mouseEventMock);

    expect(flagMessage).toHaveBeenCalledWith(message.id);
    expect(addNotification).toHaveBeenCalledWith(messageFlagFailedNotification, 'error');
  });

  it('should allow to flag a user and notify with default error message when it fails', async () => {
    const message = generateMessage();
    const client = await getTestClientWithUser(alice);
    const addNotification = jest.fn();
    const flagMessage = jest.fn(() => Promise.reject());
    client.flagMessage = flagMessage;
    const defaultFlagMessageFailedNotification = 'Error adding flag';
    let context;

    await renderComponent({
      channelActionOpts: { addNotification },
      clientOpts: { client },
      contextCallback: (ctx) => {
        context = ctx;
      },
      message,
      render,
    });

    await context.handleFlag(mouseEventMock);

    expect(flagMessage).toHaveBeenCalledWith(message.id);
    expect(addNotification).toHaveBeenCalledWith(defaultFlagMessageFailedNotification, 'error');
  });

  it('should allow user to pin messages when permissions allow', async () => {
    const message = generateMessage({ user: bob });
    let context;

    await renderComponent({
      channelStateOpts: {
        channelCapabilities: { 'pin-message': true },
        state: { members: {}, membership: { role: 'user' }, watchers: {} },
        type: 'messaging',
      },
      contextCallback: (ctx) => {
        context = ctx;
      },
      message,
    });

    expect(context.getMessageActions()).toContain(MESSAGE_ACTIONS.pin);
  });

  it('should not allow user to pin messages when permissions do not allow', async () => {
    const message = generateMessage({ user: bob });
    let context;

    await renderComponent({
      channelStateOpts: {
        channelCapabilities: { 'pin-message': false },
        state: { members: {}, membership: {}, watchers: {} },
        type: 'messaging',
      },
      contextCallback: (ctx) => {
        context = ctx;
      },
      message,
    });

    expect(context.getMessageActions()).not.toContain(MESSAGE_ACTIONS.pin);
  });

  it('should allow user to retry sending a message', async () => {
    const message = generateMessage();
    const retrySendMessage = jest.fn(() => Promise.resolve());
    let context;

    await renderComponent({
      channelActionOpts: { retrySendMessage },
      contextCallback: (ctx) => {
        context = ctx;
      },
      message,
    });

    context.handleRetry(message);
    expect(retrySendMessage).toHaveBeenCalledWith(message);
  });

  it('should allow user to open a thread', async () => {
    const message = generateMessage();
    const openThread = jest.fn();
    let context;

    await renderComponent({
      channelActionOpts: { openThread },
      contextCallback: (ctx) => {
        context = ctx;
      },
      message,
    });

    context.handleOpenThread(mouseEventMock);
    expect(openThread).toHaveBeenCalledWith(message, mouseEventMock);
  });

  it('should correctly tell if message belongs to currently set user', async () => {
    const message = generateMessage({ user: alice });
    const client = await getTestClientWithUser(alice);
    let context;

    await renderComponent({
      clientOpts: { client },
      contextCallback: (ctx) => {
        context = ctx;
      },
      message,
    });

    expect(context.isMyMessage(message)).toBe(true);
  });

  it('should pass channel configuration to UI rendered UI component', async () => {
    const message = generateMessage({ user: alice });
    const channelConfigMock = { mutes: false, replies: false };
    let context;

    await renderComponent({
      channelStateOpts: { channelConfig: channelConfigMock },
      contextCallback: (ctx) => {
        context = ctx;
      },
      message,
    });

    expect(context.getMessageActions()).not.toContain(MESSAGE_ACTIONS.mute);
    expect(context.getMessageActions()).not.toContain(MESSAGE_ACTIONS.reply);
  });

  it('should rerender if message changes', async () => {
    const message = generateMessage({ text: 'Hello!', user: alice });
    const UIMock = jest.fn(() => <div>UI mock</div>);

    const { rerender } = await renderComponent({
      components: { Message: UIMock },
      message,
    });

    const updatedMessage = generateMessage({ text: 'Hello*', user: alice });
    expect(UIMock).toHaveBeenCalledTimes(1);
    UIMock.mockClear();

    await renderComponent({
      components: { Message: UIMock },
      message: updatedMessage,
      render: rerender,
    });

    expect(UIMock).toHaveBeenCalledTimes(1);
  });

  it('should rerender if readBy changes', async () => {
    const message = generateMessage({ user: alice });
    const UIMock = jest.fn(() => <div>UI mock</div>);

    const { rerender } = await renderComponent({
      components: { Message: UIMock },
      message,
    });

    expect(UIMock).toHaveBeenCalledTimes(1);
    UIMock.mockClear();

    await renderComponent({
      components: { Message: UIMock },
      message,
      props: { readBy: [bob] },
      render: rerender,
    });

    expect(UIMock).toHaveBeenCalledTimes(1);
  });

  it('should rerender if groupStyles change', async () => {
    const message = generateMessage({ user: alice });
    const UIMock = jest.fn(() => <div>UI mock</div>);

    const { rerender } = await renderComponent({
      components: { Message: UIMock },
      message,
      props: { groupStyles: ['bottom'] },
    });

    expect(UIMock).toHaveBeenCalledTimes(1);
    UIMock.mockClear();

    await renderComponent({
      components: { Message: UIMock },
      message,
      props: { groupStyles: ['bottom', 'left'] },
      render: rerender,
    });

    expect(UIMock).toHaveBeenCalledTimes(1);
  });

  it('should last received id changes', async () => {
    const message = generateMessage({ user: alice });
    const UIMock = jest.fn(() => <div>UI mock</div>);

    const { rerender } = await renderComponent({
      components: { Message: UIMock },
      message,
      props: { lastReceivedId: 'last-received-id-1' },
    });

    expect(UIMock).toHaveBeenCalledTimes(1);
    UIMock.mockClear();

    await renderComponent({
      components: { Message: UIMock },
      message,
      props: { lastReceivedId: 'last-received-id-2' },
      render: rerender,
    });

    expect(UIMock).toHaveBeenCalledTimes(1);
  });

  it('should rerender if message list changes position', async () => {
    const message = generateMessage({ user: alice });
    const UIMock = jest.fn(() => <div>UI mock</div>);

    const { rerender } = await renderComponent({
      components: { Message: UIMock },
      message,
      props: {
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
      components: { Message: UIMock },
      message,
      props: {
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
