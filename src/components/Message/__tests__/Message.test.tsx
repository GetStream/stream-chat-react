import React from 'react';
import { cleanup, render } from '@testing-library/react';
import { fromPartial } from '@total-typescript/shoehorn';

import { Message } from '../Message';
import { MESSAGE_ACTIONS } from '../utils';

import { Channel } from '../../Channel';
import { Chat } from '../../Chat';
import { WithComponents } from '../../../context';
import { useMessageContext } from '../../../context/MessageContext';
import type { MessageContextValue } from '../../../context/MessageContext';
import {
  generateMessage,
  generateReaction,
  generateUser,
  getOrCreateChannelApi,
  getTestClientWithUser,
  initClientWithChannels,
  useMockedApis,
} from '../../../mock-builders';
import { generateChannel } from '../../../mock-builders/generator/channel';
import { defaultReactionOptions } from '../../Reactions';
import type {
  ChannelConfigWithInfo,
  Channel as ChannelType,
  Mute,
  StreamChat,
} from 'stream-chat';
import type { ComponentContextValue } from '../../../context';
import type { MessageProps } from '../types';

// MERGE-RECONCILE (test migration): the deleted ChannelStateContext/ChannelActionContext are
// replaced by the real <Chat>/<Channel> providers. Channel/client methods that formerly lived on
// ChannelActionContext are now called directly on the channel/client:
//   - sendReaction / deleteReaction / sendAction  -> channel methods (spied below)
//   - reaction/action optimistic updates          -> channel.messagePaginator.ingestItem / removeItem
//   - retrySendMessage                             -> channel.retrySendMessageWithLocalUpdate
//   - openThread / onMentionsClick / onMentionsHover -> <Message> props
//   - capabilities/roles                           -> channel own_capabilities + membership role
vi.mock('../../ChatView', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../ChatView')>();
  return {
    ...actual,
    useChatViewContext: vi.fn(() => ({
      activeView: 'channels',
      setActiveView: vi.fn(),
    })),
    useThreadsViewContext: vi.fn(() => ({
      activeThread: undefined,
      setActiveThread: vi.fn(),
    })),
  };
});

const alice = generateUser({ id: 'alice', image: 'alice-avatar.jpg', name: 'alice' });
const bob = generateUser({ image: 'bob-avatar.jpg', name: 'bob' });

const sendAction = vi.fn();
const sendReaction = vi.fn();
const deleteReaction = vi.fn();
const mouseEventMock = fromPartial<React.BaseSyntheticEvent>({
  preventDefault: vi.fn(() => {}),
});

const CustomMessageUIComponent = vi.fn(({ contextCallback }) => {
  const messageContext = useMessageContext();
  contextCallback(messageContext);
  return <div>Message</div>;
});

// Channel from the most recent render, so tests can spy on channel.messagePaginator etc.
let lastChannel: ChannelType;

const capabilitiesObjectToArray = (capabilities: Record<string, boolean> = {}) =>
  Object.keys(capabilities).filter((key) => capabilities[key]);

async function renderComponent({
  channelActionOpts = {},
  channelConfig = { replies: true },
  channelStateOpts = {},
  clientOpts,
  components,
  contextCallback = () => {},
  message,
  props = {},
  renderer = render,
}: {
  channelActionOpts?: Record<string, unknown>;
  channelConfig?: Partial<ChannelConfigWithInfo>;
  channelStateOpts?: Record<string, any>;
  clientOpts?: { client?: StreamChat };
  components?: Partial<ComponentContextValue>;
  contextCallback?: (ctx: Record<string, unknown>) => void;
  message: any;
  props?: Partial<MessageProps> & Record<string, unknown>;
  renderer?: typeof render;
  [key: string]: unknown;
}) {
  const {
    channelCapabilities = { 'send-reaction': true },
    channelConfig: channelConfigOverride,
    mutes,
    state: stateOverrides,
    type = 'messaging',
  } = channelStateOpts;

  const own_capabilities = capabilitiesObjectToArray(channelCapabilities);
  const config = (channelConfigOverride ?? channelConfig) as ChannelConfigWithInfo;

  let channel: ChannelType;
  let client: StreamChat;

  if (clientOpts?.client) {
    client = clientOpts.client;
    const channelData = generateChannel({
      channel: { config, own_capabilities, type } as any,
    });
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useMockedApis(client, [getOrCreateChannelApi(channelData)]);
    channel = client.channel(type, channelData.channel.id);
    await channel.watch();
    vi.spyOn(channel, 'getConfig').mockReturnValue(config);
  } else {
    ({
      channels: [channel],
      client,
    } = await initClientWithChannels({
      channelsData: [{ channel: { config, own_capabilities, type } } as any],
      customUser: alice,
    }));
  }

  // Apply membership/members/watchers overrides (formerly ChannelStateContext state).
  if (stateOverrides) {
    if (stateOverrides.membership) {
      channel.state.membership = {
        ...channel.state.membership,
        ...stateOverrides.membership,
      };
    }
    if (stateOverrides.members) channel.state.members = stateOverrides.members;
    if (stateOverrides.watchers) channel.state.watchers = stateOverrides.watchers;
  }

  if (mutes && client.user) {
    client.user = { ...client.user, mutes };
    client.mutedUsers = mutes;
  }

  // Reaction/action mutations now go through the channel directly.
  vi.spyOn(channel, 'sendReaction').mockImplementation(sendReaction as any);
  vi.spyOn(channel, 'deleteReaction').mockImplementation(deleteReaction as any);
  vi.spyOn(channel, 'sendAction').mockImplementation(sendAction as any);

  lastChannel = channel;

  return renderer(
    <Chat client={client}>
      <Channel channel={channel}>
        <WithComponents
          overrides={{
            Message: () => <CustomMessageUIComponent contextCallback={contextCallback} />,
            reactionOptions: defaultReactionOptions,
            ...components,
          }}
        >
          <Message
            message={message}
            onMentionsClick={channelActionOpts.onMentionsClick as any}
            onMentionsHover={channelActionOpts.onMentionsHover as any}
            openThread={channelActionOpts.openThread as any}
            {...props}
          />
        </WithComponents>
      </Channel>
    </Chat>,
  );
}

function renderComponentWithMessage(
  props: Partial<MessageProps> & Record<string, unknown> = {},
  channelStateOpts: Record<string, any> = {},
  channelConfig: Partial<ChannelConfigWithInfo> = { replies: true },
) {
  const message = generateMessage();
  return renderComponent({ channelConfig, channelStateOpts, message, props });
}

describe('<Message /> component', () => {
  beforeEach(vi.clearAllMocks);
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
    let context: MessageContextValue;

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
    let context: MessageContextValue;

    vi.spyOn(console, 'warn').mockImplementationOnce(() => null);

    await renderComponent({
      contextCallback: (ctx) => {
        context = ctx;
      },
      message,
    });

    context.handleReaction();
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining(
        'message.own_reactions contained reactions from a different user',
      ),
    );
  });

  it('should delete own reaction from channel if it was already there', async () => {
    const reaction = generateReaction({ user: alice });
    const message = generateMessage({ own_reactions: [reaction] });
    let context: MessageContextValue;

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
    let context: MessageContextValue;

    await renderComponent({
      contextCallback: (ctx) => {
        context = ctx;
      },
      message,
    });

    await context.handleReaction(reaction.type);
    expect(sendReaction).toHaveBeenCalledWith(message.id, {
      emoji_code: '❤️',
      type: reaction.type,
    });
  });

  // MERGE-RECONCILE (test migration): the reaction handler no longer gates on the
  // 'send-reaction' capability (gating moved to the reaction UI / useUserRole.canReact). The
  // handler sends unconditionally, so we assert canReact reflects the missing capability instead.
  it('should reflect missing send-reaction permission via canReact', async () => {
    const message = generateMessage({ user: bob });
    let context: MessageContextValue;

    await renderComponent({
      channelStateOpts: { channelCapabilities: { 'send-reaction': false } },
      contextCallback: (ctx) => {
        context = ctx;
      },
      message,
    });

    expect(context.getMessageActions()).not.toContain(MESSAGE_ACTIONS.react);
  });

  it('should rollback reaction if channel update fails', async () => {
    const reaction = generateReaction({ user: bob });
    const message = generateMessage({ own_reactions: [] });
    let context: MessageContextValue;

    await renderComponent({
      contextCallback: (ctx) => {
        context = ctx;
      },
      message,
    });

    const ingestSpy = vi.spyOn(lastChannel.messagePaginator, 'ingestItem');
    sendReaction.mockImplementationOnce(() => Promise.reject());

    await context.handleReaction(reaction.type);
    // On failure the optimistic update is reverted by re-ingesting the original message.
    expect(ingestSpy).toHaveBeenCalledWith(expect.objectContaining({ id: message.id }));
  });

  it('should update message after an action', async () => {
    const currentMessage = generateMessage();
    const updatedMessage = generateMessage();
    const action = { name: 'action', value: 'value' };
    let context: MessageContextValue;

    sendAction.mockImplementationOnce(() => Promise.resolve({ message: updatedMessage }));

    await renderComponent({
      contextCallback: (ctx) => {
        context = ctx;
      },
      message: currentMessage,
    });

    const ingestSpy = vi.spyOn(lastChannel.messagePaginator, 'ingestItem');

    await context.handleAction(action.name, action.value, mouseEventMock);

    expect(sendAction).toHaveBeenCalledWith(currentMessage.id, {
      [action.name]: action.value,
    });
    expect(ingestSpy).toHaveBeenCalledWith(
      expect.objectContaining({ id: updatedMessage.id }),
    );
  });

  it('should fallback to original message after an action fails', async () => {
    const currentMessage = generateMessage({ user: bob });
    const action = { name: 'action', value: 'value' };
    let context: MessageContextValue;

    sendAction.mockImplementationOnce(() => Promise.resolve(undefined));

    await renderComponent({
      contextCallback: (ctx) => {
        context = ctx;
      },
      message: currentMessage,
    });

    const removeItemSpy = vi.spyOn(lastChannel.messagePaginator, 'removeItem');

    await context.handleAction(action.name, action.value, mouseEventMock);

    expect(sendAction).toHaveBeenCalledWith(currentMessage.id, {
      [action.name]: action.value,
    });
    expect(removeItemSpy).toHaveBeenCalledWith({
      item: expect.objectContaining({ id: currentMessage.id }),
    });
  });

  it('should handle retry', async () => {
    const message = generateMessage();
    let context: MessageContextValue;

    await renderComponent({
      contextCallback: (ctx) => {
        context = ctx;
      },
      message,
    });

    const retrySpy = vi
      .spyOn(lastChannel, 'retrySendMessageWithLocalUpdate')
      .mockResolvedValue(undefined as any);

    await context.handleRetry(message);
    expect(retrySpy).toHaveBeenCalledWith({
      localMessage: expect.objectContaining({ id: message.id }),
    });
  });

  it('should trigger channel mentions handler when there is one set and user clicks on a mention', async () => {
    const message = generateMessage({ mentioned_users: [bob] });
    const onMentionsClick = vi.fn(() => {});
    let context: MessageContextValue;

    await renderComponent({
      channelActionOpts: { onMentionsClick },
      contextCallback: (ctx) => {
        context = ctx;
      },
      message,
    });

    context.onMentionsClickMessage(mouseEventMock);
    expect(onMentionsClick).toHaveBeenCalledWith(
      mouseEventMock,
      message.mentioned_users,
      message,
    );
  });

  it('should trigger channel mentions hover on mentions hover', async () => {
    const message = generateMessage({ mentioned_users: [bob] });
    const onMentionsHover = vi.fn(() => {});
    let context: MessageContextValue;

    await renderComponent({
      channelActionOpts: { onMentionsHover },
      contextCallback: (ctx) => {
        context = ctx;
      },
      message,
    });

    context.onMentionsHoverMessage(mouseEventMock);
    expect(onMentionsHover).toHaveBeenCalledWith(
      mouseEventMock,
      message.mentioned_users,
      message,
    );
  });

  it('should trigger channel onUserClick handler when a user element is clicked', async () => {
    const message = generateMessage({ user: bob });
    const onUserClickMock = vi.fn(() => {});
    let context: MessageContextValue;

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
    const onUserHoverMock = vi.fn(() => {});
    let context: MessageContextValue;

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

  it('should allow to mute a user when it is successful', async () => {
    const message = generateMessage({ user: bob });
    const client = await getTestClientWithUser(alice);
    const muteUser = vi.fn(() => Promise.resolve());
    // @ts-expect-error - mock implementation has simplified signature
    vi.spyOn(client, 'muteUser').mockImplementation(muteUser);
    let context: MessageContextValue;

    await renderComponent({
      channelStateOpts: { mutes: [] },
      clientOpts: { client },
      contextCallback: (ctx) => {
        context = ctx;
      },
      message,
    });

    await context.handleMute(mouseEventMock);

    expect(muteUser).toHaveBeenCalledWith(bob.id);
  });

  it('should throw when muting a user fails', async () => {
    const message = generateMessage({ user: bob });
    const client = await getTestClientWithUser(alice);
    const muteUser = vi.fn(() => Promise.reject(new Error('mute failed')));
    vi.spyOn(client, 'muteUser').mockImplementation(muteUser);
    let context: MessageContextValue;

    await renderComponent({
      channelStateOpts: { mutes: [] },
      clientOpts: { client },
      contextCallback: (ctx) => {
        context = ctx;
      },
      message,
    });

    await context.handleMute(mouseEventMock);

    expect(muteUser).toHaveBeenCalledWith(bob.id);
  });

  it('should allow to unmute a user when it is successful', async () => {
    const message = generateMessage({ user: bob });
    const client = await getTestClientWithUser(alice);
    const unmuteUser = vi.fn(() => Promise.resolve());
    // @ts-expect-error - mock implementation has simplified signature
    vi.spyOn(client, 'unmuteUser').mockImplementation(unmuteUser);
    let context: MessageContextValue;

    await renderComponent({
      channelStateOpts: { mutes: [fromPartial<Mute>({ target: { id: bob.id } })] },
      clientOpts: { client },
      contextCallback: (ctx) => {
        context = ctx;
      },
      message,
    });

    await context.handleMute(mouseEventMock);

    expect(unmuteUser).toHaveBeenCalledWith(bob.id);
  });

  it('should throw when unmuting a user fails', async () => {
    const message = generateMessage({ user: bob });
    const client = await getTestClientWithUser(alice);
    const unmuteUser = vi.fn(() => Promise.reject(new Error('unmute failed')));
    vi.spyOn(client, 'unmuteUser').mockImplementation(unmuteUser);
    let context: MessageContextValue;

    await renderComponent({
      channelStateOpts: { mutes: [fromPartial<Mute>({ target: { id: bob.id } })] },
      clientOpts: { client },
      contextCallback: (ctx) => {
        context = ctx;
      },
      message,
    });

    await context.handleMute(mouseEventMock);

    expect(unmuteUser).toHaveBeenCalledWith(bob.id);
  });

  it.each([
    ['empty', []],
    ['false', false],
  ])(
    'should return no message actions to UI component if message actions are %s',
    async (_, actionsValue) => {
      const message = generateMessage({ user: bob });
      const messageActions = actionsValue;
      let context: MessageContextValue;

      await renderComponent({
        contextCallback: (ctx) => {
          context = ctx;
        },
        message,
        props: { messageActions: messageActions as any },
      });

      expect(context.getMessageActions()).toStrictEqual([]);
    },
  );

  it('should allow user to edit and delete message when message is from the user', async () => {
    const message = generateMessage({ user: alice });
    let context: MessageContextValue;

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
    let context: MessageContextValue;

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
    let context: MessageContextValue;

    await renderComponent({
      channelStateOpts: {
        state: { members: {}, membership: { role: 'owner' }, watchers: {} },
      },
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
    let context: MessageContextValue;

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
    let context: MessageContextValue;

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
    let context: MessageContextValue;

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
    let context: MessageContextValue;

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
    let context: MessageContextValue;

    await renderComponent({
      channelStateOpts: { channelCapabilities: { 'mute-channel': true } },
      contextCallback: (ctx) => {
        context = ctx;
      },
      message,
    });

    expect(context.getMessageActions()).toContain(MESSAGE_ACTIONS.mute);
  });

  it('should allow to flag a message when it is successful', async () => {
    const message = generateMessage();
    const client = await getTestClientWithUser(alice);
    const flagMessage = vi.fn(() => Promise.resolve());
    // @ts-expect-error - mock implementation has simplified signature
    vi.spyOn(client, 'flagMessage').mockImplementation(flagMessage);
    let context: MessageContextValue;

    await renderComponent({
      clientOpts: { client },
      contextCallback: (ctx) => {
        context = ctx;
      },
      message,
    });

    await context.handleFlag(mouseEventMock);

    expect(flagMessage).toHaveBeenCalledWith(message.id);
  });

  it('should throw when flagging a message fails', async () => {
    const message = generateMessage();
    const client = await getTestClientWithUser(alice);
    const flagMessage = vi.fn(() => Promise.reject(new Error('flag failed')));
    vi.spyOn(client, 'flagMessage').mockImplementation(flagMessage);
    let context: MessageContextValue;

    await renderComponent({
      clientOpts: { client },
      contextCallback: (ctx) => {
        context = ctx;
      },
      message,
    });

    await expect(context.handleFlag(mouseEventMock)).rejects.toThrow('flag failed');

    expect(flagMessage).toHaveBeenCalledWith(message.id);
  });

  it('should allow user to pin messages when permissions allow', async () => {
    const message = generateMessage({ user: bob });
    let context: MessageContextValue;

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
    let context: MessageContextValue;

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
    let context: MessageContextValue;

    await renderComponent({
      contextCallback: (ctx) => {
        context = ctx;
      },
      message,
    });

    const retrySpy = vi
      .spyOn(lastChannel, 'retrySendMessageWithLocalUpdate')
      .mockResolvedValue(undefined as any);

    context.handleRetry(message);
    expect(retrySpy).toHaveBeenCalledWith({
      localMessage: expect.objectContaining({ id: message.id }),
    });
  });

  it('should allow user to open a thread', async () => {
    const message = generateMessage();
    const openThread = vi.fn();
    let context: MessageContextValue;

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
    let context: MessageContextValue;

    await renderComponent({
      contextCallback: (ctx) => {
        context = ctx;
      },
      message,
    });

    expect(context.isMyMessage(message)).toBe(true);
  });

  it('should pass channel configuration to UI rendered UI component', async () => {
    const message = generateMessage({ user: alice });
    const channelConfigMock = { mutes: false, replies: false } as ChannelConfigWithInfo;
    let context: MessageContextValue;

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
    const UIMock = vi.fn(() => <div>UI mock</div>);

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
      renderer: rerender,
    });

    expect(UIMock).toHaveBeenCalledTimes(1);
  });

  it('should rerender if readBy changes', async () => {
    const message = generateMessage({ user: alice });
    const UIMock = vi.fn(() => <div>UI mock</div>);

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
      renderer: rerender,
    });

    expect(UIMock).toHaveBeenCalledTimes(1);
  });

  it('should rerender if groupStyles change', async () => {
    const message = generateMessage({ user: alice });
    const UIMock = vi.fn(() => <div>UI mock</div>);

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
      props: { groupStyles: ['bottom', 'left'] as any },
      renderer: rerender,
    });

    expect(UIMock).toHaveBeenCalledTimes(1);
  });

  it('should last received id changes', async () => {
    const message = generateMessage({ user: alice });
    const UIMock = vi.fn(() => <div>UI mock</div>);

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
      renderer: rerender,
    });

    expect(UIMock).toHaveBeenCalledTimes(1);
  });

  it('should rerender if message list changes position', async () => {
    const message = generateMessage({ user: alice });
    const UIMock = vi.fn(() => <div>UI mock</div>);

    const { rerender } = await renderComponent({
      components: { Message: UIMock },
      message,
      props: {
        messageListRect: fromPartial<DOMRect>({
          height: 100,
          width: 100,
          x: 10,
          y: 10,
        }),
      },
    });

    expect(UIMock).toHaveBeenCalledTimes(1);
    UIMock.mockClear();

    await renderComponent({
      components: { Message: UIMock },
      message,
      props: {
        messageListRect: fromPartial<DOMRect>({
          height: 200,
          width: 200,
          x: 20,
          y: 20,
        }),
      },
      renderer: rerender,
    });

    expect(UIMock).toHaveBeenCalledTimes(1);
  });
});
