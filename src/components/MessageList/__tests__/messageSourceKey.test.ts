import { getMessageSourceKey } from '../messageSourceKey';
import { initClientWithChannels } from '../../../mock-builders';
import { fromPartial } from '@total-typescript/shoehorn';

import type { Thread } from 'stream-chat';

/**
 * The key a message list resets on. It has to follow the same axis as `useMessagePaginator()` --
 * the thread when there is one, the channel otherwise -- or a list shows one source's messages with
 * another's scroll position.
 */
describe('getMessageSourceKey', () => {
  it('is stable for one channel instance and distinct per instance', async () => {
    const {
      channels: [first],
      client,
    } = await initClientWithChannels({
      channelsData: [{ channel: { id: 'channel-a', type: 'messaging' } }],
    });
    // A replacement instance for the same cid is a different object, and must key differently.
    delete client.activeChannels[first.cid];
    const second = client.channel('messaging', 'channel-a');

    expect(getMessageSourceKey({ channel: first })).toBe(
      getMessageSourceKey({ channel: first }),
    );
    expect(getMessageSourceKey({ channel: second })).not.toBe(
      getMessageSourceKey({ channel: first }),
    );
    // Readable in DevTools without being the identity.
    expect(getMessageSourceKey({ channel: first }).startsWith(`${first.cid}#`)).toBe(
      true,
    );
  });

  it('distinguishes two threads of the same channel', async () => {
    const {
      channels: [channel],
    } = await initClientWithChannels();
    const threadA = fromPartial<Thread>({ id: 'parent-a' });
    const threadB = fromPartial<Thread>({ id: 'parent-b' });

    // The case keying on the channel alone could not express: same channel, different replies.
    expect(getMessageSourceKey({ channel, thread: threadA })).not.toBe(
      getMessageSourceKey({ channel, thread: threadB }),
    );
    expect(getMessageSourceKey({ channel, thread: threadA })).toBe(
      getMessageSourceKey({ channel, thread: threadA }),
    );
  });

  it('keys a thread list separately from its own channel list', async () => {
    const {
      channels: [channel],
    } = await initClientWithChannels();
    const thread = fromPartial<Thread>({ id: 'parent-a' });

    expect(getMessageSourceKey({ channel, thread })).not.toBe(
      getMessageSourceKey({ channel }),
    );
  });
});
