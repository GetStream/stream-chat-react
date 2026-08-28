import type { Channel, MessageComposer, StreamChat } from 'stream-chat';

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
 * Every composer instance currently reachable: the active channel's own composer, plus any
 * thread/edit composers the client is holding in its cache.
 */
export const listComposers = (
  client: StreamChat | undefined,
  activeChannel: Channel | undefined,
): ComposerEntry[] => {
  if (!client) return [];

  const entries: ComposerEntry[] = [];

  if (activeChannel?.messageComposer) {
    entries.push({
      composer: activeChannel.messageComposer,
      label: `channel · ${activeChannel.cid}`,
      tag: activeChannel.messageComposer.tag,
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
