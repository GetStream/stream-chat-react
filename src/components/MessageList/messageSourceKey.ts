import type { Channel, Thread } from 'stream-chat';

/**
 * Identity of the object a message list renders -- a `Channel` or a `Thread` -- as a string usable
 * as a React key.
 *
 * Keyed on the *instance*, not on `cid` or a thread id. Those name a conversation; they do not name
 * the object representing it. Two different `Channel` instances can carry the same `cid` (the
 * client's cache is dropped on `disconnectUser`, an app can hold channels from more than one
 * client, and re-created channels come back as new objects), so keying on the id treats them as the
 * same thing and the list keeps state belonging to an instance nobody uses any more: subscriptions
 * to the previous instance's stores, scroll position, virtualization accounting.
 *
 * The readable prefix is there for React DevTools; the counter is what identifies the instance.
 */
const instanceKeys = new WeakMap<object, string>();
let nextInstanceKey = 0;

const getInstanceKey = (instance: object, label: string): string => {
  const existing = instanceKeys.get(instance);
  if (existing) return existing;

  nextInstanceKey += 1;
  const key = `${label}#${nextInstanceKey}`;
  instanceKeys.set(instance, key);

  return key;
};

/**
 * Key for the source a message list is bound to.
 *
 * Mirrors `useMessagePaginator()` -- `thread?.messagePaginator ?? channel.messagePaginator` -- so
 * the list resets exactly when the paginator it reads from changes. A thread list bound to the
 * channel would not reset between two threads of the same channel, which is what keying on the
 * channel alone used to do.
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
