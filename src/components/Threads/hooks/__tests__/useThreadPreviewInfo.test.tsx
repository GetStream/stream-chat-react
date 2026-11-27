import React from 'react';
import { act, renderHook } from '@testing-library/react';
import { fromPartial } from '@total-typescript/shoehorn';
import { StateStore } from '@stream-io/state-store';
import type { Channel, LocalMessage, Thread, ThreadState } from 'stream-chat';

import { ChatContext } from '../../../../context/ChatContext';
import type { ChatContextValue } from '../../../../context/ChatContext';
import { TranslationProvider } from '../../../../context/TranslationContext';
import {
  generateChannel,
  generateMember,
  generateUser,
  getOrCreateChannelApi,
  getTestClientWithUser,
  mockTranslationContextValue,
  useMockedApis,
} from '../../../../mock-builders';
import { useThreadPreviewInfo } from '../useThreadPreviewInfo';

const me = generateUser({ id: 'me', name: undefined });

const watchChannel = async (options: Parameters<typeof generateChannel>[0]) => {
  const client = await getTestClientWithUser(me);
  const response = generateChannel(options);
  /* eslint-disable-next-line react-hooks/rules-of-hooks */
  useMockedApis(client, [getOrCreateChannelApi(response)]);
  const channel = client.channel('messaging', response.channel.id);
  await channel.watch();
  return { channel, client };
};

const createThread = (channel: Channel, author?: { id: string; name?: string }) =>
  fromPartial<Thread>({
    state: new StateStore<ThreadState>(
      fromPartial<ThreadState>({
        channel,
        parentMessage: fromPartial<LocalMessage>({ id: 'parent', user: author }),
      }),
    ),
  });

const wrapper =
  (client: ChatContextValue['client']) =>
  // eslint-disable-next-line react/display-name
  ({ children }: { children: React.ReactNode }) => (
    <ChatContext.Provider value={fromPartial<ChatContextValue>({ client })}>
      <TranslationProvider value={mockTranslationContextValue()}>
        {children}
      </TranslationProvider>
    </ChatContext.Provider>
  );

const unnamedGroup = {
  members: [
    generateMember({ user: me }),
    generateMember({ user: generateUser({ id: 'bob', name: undefined }) }),
    generateMember({ user: generateUser({ id: 'carol', name: undefined }) }),
  ],
};

describe('useThreadPreviewInfo', () => {
  it("is titled after the thread's channel", async () => {
    const { channel, client } = await watchChannel({
      channel: { custom: { name: 'Design Review' } },
      members: [generateMember({ user: me })],
    });

    const { result } = renderHook(
      () =>
        useThreadPreviewInfo({
          thread: createThread(channel, { id: 'alice', name: 'Alice' }),
        }),
      { wrapper: wrapper(client) },
    );

    expect(result.current.displayTitle).toBe('Design Review');
  });

  it('falls back to the parent message author for an unnamed channel', async () => {
    const { channel, client } = await watchChannel(unnamedGroup);

    const { result } = renderHook(
      () =>
        useThreadPreviewInfo({
          thread: createThread(channel, { id: 'alice', name: 'Alice' }),
        }),
      { wrapper: wrapper(client) },
    );

    expect(result.current.displayTitle).toBe('Alice');
  });

  it('is undefined when neither the channel nor the author has a name', async () => {
    const { channel, client } = await watchChannel(unnamedGroup);

    const { result } = renderHook(
      () => useThreadPreviewInfo({ thread: createThread(channel, { id: 'alice' }) }),
      { wrapper: wrapper(client) },
    );

    expect(result.current.displayTitle).toBeUndefined();
  });

  it('prefers overrideTitle, then the given channel over the thread channel', async () => {
    const { channel: threadChannel, client } = await watchChannel(unnamedGroup);
    const { channel: other } = await watchChannel({
      channel: { custom: { name: 'Other' } },
      members: [generateMember({ user: me })],
    });
    const thread = createThread(threadChannel, { id: 'alice', name: 'Alice' });

    const { rerender, result } = renderHook(
      (props: { overrideTitle?: string }) =>
        useThreadPreviewInfo({ channel: other, thread, ...props }),
      { initialProps: {}, wrapper: wrapper(client) },
    );
    expect(result.current.displayTitle).toBe('Other');

    rerender({ overrideTitle: 'Custom' });
    expect(result.current.displayTitle).toBe('Custom');
  });

  it('follows a renamed parent message author', async () => {
    const { channel, client } = await watchChannel(unnamedGroup);
    const thread = createThread(channel, { id: 'alice', name: 'Alice' });

    const { result } = renderHook(() => useThreadPreviewInfo({ thread }), {
      wrapper: wrapper(client),
    });

    act(() => {
      thread.state.partialNext({
        parentMessage: fromPartial<LocalMessage>({
          id: 'parent',
          user: { id: 'alice', name: 'Alice Smith' },
        }),
      });
    });

    expect(result.current.displayTitle).toBe('Alice Smith');
  });
});
