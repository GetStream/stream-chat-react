import type { Channel } from 'stream-chat';

/**
 * Identity of a `Channel` *instance*, as a string that can be used as a React key.
 *
 * `cid` names a conversation, not the object representing it. Two different `Channel` instances can
 * carry the same `cid` -- the client's cache is dropped on `disconnectUser`, an app can hold
 * channels from more than one client, and re-created channels come back as new objects. Keying UI
 * on `cid` treats those as the same thing, so the subtree keeps state that belongs to an instance
 * nobody is using any more: subscriptions to the previous instance's stores, and a bootstrap that
 * never runs for the new one.
 *
 * The `cid` prefix is there to keep the key readable in React DevTools; the counter is what makes
 * it identify the instance.
 */
const instanceKeys = new WeakMap<Channel, string>();
let nextInstanceKey = 0;

export const getChannelInstanceKey = (channel: Channel): string => {
  const existing = instanceKeys.get(channel);
  if (existing) return existing;

  nextInstanceKey += 1;
  const key = `${channel.cid}#${nextInstanceKey}`;
  instanceKeys.set(channel, key);

  return key;
};
