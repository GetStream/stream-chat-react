import { useEffect, useState } from 'react';
import { ChannelPaginator } from 'stream-chat';
import type {
  ChannelFilters,
  PaginatorOwnershipResolver,
  SortParamRequest,
} from 'stream-chat';
import { useChatContext } from 'stream-chat-react';

type SectionKey = 'archived' | 'inbox' | 'pinned';

export type ChannelSections = Record<SectionKey, ChannelPaginator>;

// The most recently pinned channel first.
const byPinnedAt: SortParamRequest[] = [{ direction: -1, field: 'pinned_at' }];
// The channel with the latest message first.
const byLastMessage: SortParamRequest[] = [{ direction: -1, field: 'last_message_at' }];

// The sections in the order they show. A channel that matches several shows only in the first of
// them: a pinned channel matches the inbox too, and shows under Pinned. `pageSize` is the number of
// channels one query asks for, the first page and each click on a section's load-more button:
// pinned channels and the inbox 10 at a time, the archive, opened less often, 5.
const sectionDefinitions: {
  extraFilters: ChannelFilters;
  key: SectionKey;
  pageSize: number;
  sort: SortParamRequest[];
}[] = [
  {
    extraFilters: { archived: false, pinned: true },
    key: 'pinned',
    pageSize: 10,
    sort: byPinnedAt,
  },
  { extraFilters: { archived: false }, key: 'inbox', pageSize: 10, sort: byLastMessage },
  { extraFilters: { archived: true }, key: 'archived', pageSize: 5, sort: byLastMessage },
];

// Presence keeps members' online status current. A row previews only the latest message, so each
// channel comes with its newest 5 messages instead of the default 25: a few rather than one, since
// the preview skips some messages, such as system messages. Opening a channel loads its own page.
const requestOptions = { message_limit: 5, presence: true, state: true };

// Fixed ids, which `firstSectionOwns` uses to tell the sections from other paginators. The manager
// holds one ownership rule, so there is one set of sections.
const sectionId = (key: SectionKey) => `sections-${key}`;
const sectionIds = sectionDefinitions.map(({ key }) => sectionId(key));
const isSection = (id: string) => sectionIds.includes(id);

// Of the sections a channel matches, only the first owns it. Paginators that aren't sections keep
// every channel they match.
const firstSectionOwns: PaginatorOwnershipResolver = ({ matchingPaginators }) => {
  const owner = sectionIds.find((id) => matchingPaginators.some((p) => p.id === id));
  return matchingPaginators
    .filter(({ id }) => !isSection(id) || id === owner)
    .map(({ id }) => id);
};

/**
 * Creates the three paginators of a sectioned channel list and registers them on
 * `client.channelManager`, beside any paginators already there: the user's pinned channels, the
 * rest of their channels, and their archive. It also sets the manager's ownership rule: a channel
 * that matches several sections shows only in the first, and every other paginator keeps its
 * matches. The manager holds a single rule, so use one sectioned list per client. On unmount the
 * hook removes its paginators and resets the rule to the default. `filters` scope all three to the
 * user's channels; pass a stable object. Returns `undefined` until they are registered.
 */
export const useChannelSections = (filters: ChannelFilters) => {
  const { client } = useChatContext();
  const [sections, setSections] = useState<ChannelSections>();

  useEffect(() => {
    const entries = sectionDefinitions.map(
      ({ extraFilters, key, pageSize, sort }) =>
        [
          key,
          new ChannelPaginator({
            client,
            filters: { ...filters, ...extraFilters },
            id: sectionId(key),
            paginatorOptions: { pageSize },
            requestOptions,
            sort,
          }),
        ] as const,
    );
    const paginators = entries.map(([, paginator]) => paginator);

    const { channelManager } = client;
    channelManager.setPaginators([...channelManager.paginators, ...paginators]);
    channelManager.setOwnershipResolver(firstSectionOwns);
    setSections(Object.fromEntries(entries) as ChannelSections);

    return () => {
      channelManager.setPaginators(
        channelManager.paginators.filter((paginator) => !paginators.includes(paginator)),
      );
      // The manager doesn't expose the rule it had before, so the default takes its place.
      channelManager.setOwnershipResolver();
      setSections(undefined);
    };
  }, [client, filters]);

  return sections;
};
