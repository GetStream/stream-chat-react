import type { Channel, Thread } from 'stream-chat';

const instanceKeys = new WeakMap<object, string>();
let nextInstanceKey = 0;

/**
 * String identifying an object instance, usable as a React key. It keys on the instance, not on
 * `cid` or a thread ID, because distinct `Channel` instances can share a `cid` (the client cache
 * is dropped on `disconnectUser`, an app can hold channels from several clients, re-created
 * channels are new objects); an ID key would keep the stale instance's subscriptions and scroll
 * state. The label is for React DevTools, the counter identifies the instance.
 */
const getInstanceKey = (instance: object, label: string): string => {
  const existing = instanceKeys.get(instance);
  if (existing) return existing;

  nextInstanceKey += 1;
  const key = `${label}#${nextInstanceKey}`;
  instanceKeys.set(instance, key);

  return key;
};

/**
 * Key for the source a message list is bound to. It mirrors `useMessagePaginator()` (the thread's
 * paginator, else the channel's), so the list resets exactly when the paginator it reads from
 * changes, including between two threads of one channel.
 */
export const getMessageSourceKey = ({
  channel,
  thread,
}: {
  channel: Channel;
  thread?: Thread;
}): string =>
  thread
    ? getInstanceKey(thread, `thread:${thread.id}`)
    : getInstanceKey(channel, channel.cid);
