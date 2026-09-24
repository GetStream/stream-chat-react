import type { MessageComposer, StreamChat } from 'stream-chat';

export type ComposerEntry = {
  composer: MessageComposer;
  label: string;
  tag: string;
};

/**
 * Debug-only. `FixedSizeQueueCache` declares `keys`/`map` private, so enumerating the cached
 * thread and edit composers means reaching past the public API. Kept in one place so the one
 * unsupported access is obvious and easy to update if the cache implementation changes.
 */
const readCachedComposers = (client: StreamChat): ComposerEntry[] => {
  const cache = client.messageComposerCache as unknown as {
    map?: Map<string, MessageComposer>;
  };

  if (!(cache?.map instanceof Map)) return [];

  return [...cache.map.entries()].map(([tag, composer]) => ({
    composer,
    label: describeComposer(composer, tag),
    tag,
  }));
};

const describeComposer = (composer: MessageComposer, tag: string) => {
  if (composer.editedMessage) return `edit · ${composer.editedMessage.id.slice(0, 8)}`;
  if (composer.threadId) return `thread · ${composer.threadId.slice(0, 8)}`;
  return tag;
};

/**
 * Every composer instance currently reachable: each held channel's own composer, plus any
 * thread/edit composers the client is holding in its cache.
 *
 * v14 took the single active channel from `ChatContext`. v15 has no ambient active channel — a
 * `Channel` is addressed by instance, not through the client — so this enumerates what the client
 * is actually holding. For an inspector that is the better answer anyway: thread and edit
 * composers already come from a client-wide cache, so scoping only the channel composer to one
 * channel was the odd one out.
 */
export const listComposers = (client: StreamChat | undefined): ComposerEntry[] => {
  if (!client) return [];

  const entries: ComposerEntry[] = [];

  for (const channel of Object.values(client.activeChannels)) {
    if (!channel?.messageComposer) continue;
    entries.push({
      composer: channel.messageComposer,
      label: `channel · ${channel.cid}`,
      tag: channel.messageComposer.tag,
    });
  }

  for (const entry of readCachedComposers(client)) {
    if (entries.some(({ composer }) => composer === entry.composer)) continue;
    entries.push(entry);
  }

  return entries;
};

/**
 * Debug-only. Middleware arrays are private on `MiddlewareExecutor`; the ids are the single
 * most useful thing to see when a composition behaves unexpectedly (did a `replace()` keep its
 * slot? did an `insert()` run twice?), so the inspector digs them out.
 */
export const readMiddlewareIds = (executor: unknown): string[] => {
  if (!executor || typeof executor !== 'object') return [];

  for (const value of Object.values(executor as Record<string, unknown>)) {
    if (
      Array.isArray(value) &&
      value.every((entry) => entry && typeof entry === 'object' && 'id' in entry)
    ) {
      return value.map((entry) => String((entry as { id: unknown }).id));
    }
  }

  return [];
};
