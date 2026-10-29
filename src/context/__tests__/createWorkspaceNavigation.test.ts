import type { Channel as StreamChannel, StreamChat } from 'stream-chat';

import { generateMessage, getTestClientWithUser } from '../../mock-builders';
import { createWorkspaceNavigation } from '../createWorkspaceNavigation';

describe('createWorkspaceNavigation', () => {
  let client: StreamChat;
  let channelA: StreamChannel;
  let channelB: StreamChannel;

  beforeEach(async () => {
    client = await getTestClientWithUser({ id: 'ann' });
    channelA = client.channel('messaging', 'a');
    channelB = client.channel('messaging', 'b');
  });

  const ensureThread = (channel: StreamChannel, id: string) =>
    client.threads.ensure({ channel, parentMessage: generateMessage({ id }) });

  const setup = (
    state: Parameters<typeof createWorkspaceNavigation>[0] | object = {},
  ) => {
    const setChannel = vi.fn();
    const setThread = vi.fn();
    const navigation = createWorkspaceNavigation({ setChannel, setThread, ...state });
    return { navigation, setChannel, setThread };
  };

  it('reports nothing open without a channel or thread', () => {
    const { navigation } = setup();

    expect(navigation.openChannels).toEqual([]);
    expect(navigation.openThreads).toEqual([]);
    expect(navigation.isChannelActive('messaging:a')).toBe(false);
    expect(navigation.isThreadActive('t1')).toBe(false);
    expect(navigation.isThreadDismissable()).toBe(false);
    expect(navigation.isThreadsView).toBe(false);
  });

  it('derives the open entities and the active predicates from the state', () => {
    const thread = ensureThread(channelA, 'parent-1');
    const { navigation } = setup({ channel: channelA, thread });

    expect(navigation.openChannels).toEqual([channelA]);
    expect(navigation.openThreads).toEqual([thread]);
    expect(navigation.isChannelActive(channelA.cid)).toBe(true);
    expect(navigation.isChannelActive(channelB.cid)).toBe(false);
    expect(navigation.isChannelActive(undefined)).toBe(false);
    expect(navigation.isThreadActive(thread.id)).toBe(true);
    expect(navigation.isThreadActive('other')).toBe(false);
    expect(navigation.isThreadActive(undefined)).toBe(false);
  });

  it('makes the open thread dismissable and the channel panel not', () => {
    const thread = ensureThread(channelA, 'parent-1');
    const { navigation } = setup({ channel: channelA, thread });

    expect(navigation.isThreadDismissable(thread.id)).toBe(true);
    expect(navigation.isThreadDismissable()).toBe(true);
    expect(navigation.isThreadDismissable('other')).toBe(false);
    expect(navigation.isChannelDismissable(channelA.cid)).toBe(false);
  });

  it('has nothing to go back to', () => {
    const thread = ensureThread(channelA, 'parent-1');
    const { navigation, setChannel, setThread } = setup({ channel: channelA, thread });

    expect(navigation.canGoBack(channelA.cid)).toBe(false);
    expect(navigation.canGoBack(thread.id)).toBe(false);
    navigation.goBack(thread.id);
    expect(setChannel).not.toHaveBeenCalled();
    expect(setThread).not.toHaveBeenCalled();
  });

  it('closes the thread when opening a different channel', () => {
    const thread = ensureThread(channelA, 'parent-1');
    const { navigation, setChannel, setThread } = setup({ channel: channelA, thread });

    navigation.openChannel(channelB);

    expect(setChannel).toHaveBeenCalledWith(channelB);
    expect(setThread).toHaveBeenCalledWith(undefined);
  });

  it('keeps the thread when re-opening the open channel', () => {
    const thread = ensureThread(channelA, 'parent-1');
    const { navigation, setChannel, setThread } = setup({ channel: channelA, thread });

    navigation.openChannel(channelA);

    expect(setChannel).toHaveBeenCalledWith(channelA);
    expect(setThread).not.toHaveBeenCalled();
  });

  it('opens a thread instance as is', () => {
    const thread = ensureThread(channelA, 'parent-1');
    const { navigation, setThread } = setup({ channel: channelA });

    navigation.openThread(thread);

    expect(setThread).toHaveBeenCalledWith(thread);
  });

  it('resolves a { channel, message } target through client.threads.ensure', () => {
    const message = generateMessage({ id: 'parent-2' });
    const ensure = vi.spyOn(client.threads, 'ensure');
    const { navigation, setThread } = setup({ channel: channelA });

    navigation.openThread({ channel: channelA, message });

    expect(ensure).toHaveBeenCalledWith({ channel: channelA, parentMessage: message });
    expect(setThread).toHaveBeenCalledWith(ensure.mock.results[0].value);
  });

  it('closes the open thread by ID, or without one', () => {
    const thread = ensureThread(channelA, 'parent-1');
    const { navigation, setThread } = setup({ channel: channelA, thread });

    navigation.closeThread('other');
    expect(setThread).not.toHaveBeenCalled();

    navigation.closeThread(thread.id);
    expect(setThread).toHaveBeenLastCalledWith(undefined);

    setThread.mockClear();
    navigation.closeThread();
    expect(setThread).toHaveBeenCalledWith(undefined);
  });

  it('closes the open channel with its thread, and ignores other channels', () => {
    const thread = ensureThread(channelA, 'parent-1');
    const { navigation, setChannel, setThread } = setup({ channel: channelA, thread });

    navigation.closeChannel(channelB.cid);
    expect(setChannel).not.toHaveBeenCalled();

    navigation.closeChannel(channelA.cid);
    expect(setChannel).toHaveBeenCalledWith(undefined);
    expect(setThread).toHaveBeenCalledWith(undefined);
  });
});
