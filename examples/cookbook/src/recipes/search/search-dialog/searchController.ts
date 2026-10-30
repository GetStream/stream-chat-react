import {
  ChannelSearchSource,
  MessageSearchSource,
  SearchController,
  UserSearchSource,
} from 'stream-chat';
import type { SearchSource, SortParamRequest, StreamChat } from 'stream-chat';

/**
 * The values the message filters read: the author's id, and the first and last day, `YYYY-MM-DD`, as
 * days in the user's time zone.
 */
export type MessageFilterContext = {
  authorId?: string;
  sentFrom?: string;
  sentTo?: string;
};

export type DialogMessageSearchSource = MessageSearchSource<{
  messageSearchContext: MessageFilterContext;
}>;

export const channelSorts = {
  activity: [{ direction: -1, field: 'last_message_at' }],
  members: [{ direction: -1, field: 'member_count' }],
  newest: [{ direction: -1, field: 'created_at' }],
} satisfies Record<string, SortParamRequest[]>;

export const userSorts = {
  active: [{ direction: -1, field: 'last_active' }],
  name: [{ direction: 1, field: 'name' }],
} satisfies Record<string, SortParamRequest[]>;

export const messageSorts = {
  newest: [{ direction: -1, field: 'created_at' }],
  oldest: [{ direction: 1, field: 'created_at' }],
} satisfies Record<string, SortParamRequest[]>;

/** The first moment of a day in the user's time zone, `YYYY-MM-DD`, as an ISO date. */
const startOfLocalDay = (day: string) => new Date(`${day}T00:00`).toISOString();

/** The last moment of a day in the user's time zone, `YYYY-MM-DD`, as an ISO date. */
const endOfLocalDay = (day: string) => {
  const nextDay = new Date(`${day}T00:00`);
  nextDay.setDate(nextDay.getDate() + 1);
  return new Date(nextDay.getTime() - 1).toISOString();
};

// A few results per source; Load more fetches the next few.
const pageSize = 3;

export const createSearchController = (client: StreamChat) =>
  new SearchController({
    client,
    // Every source the user turns on searches at once.
    config: { keepSingleActiveSource: false },
    sources: [
      new ChannelSearchSource(
        client,
        { pageSize, sort: channelSorts.activity },
        {
          initialFilterConfig: {
            // Replaces the built-in `name` generator: a channel matches by its name or a member's.
            name: {
              enabled: true,
              generate: ({ searchQuery }) =>
                searchQuery
                  ? {
                      $or: [
                        { name: { $autocomplete: searchQuery } },
                        { 'member.user.name': { $autocomplete: searchQuery } },
                      ],
                    }
                  : null,
            },
            hideArchived: { enabled: true, generate: () => ({ archived: false }) },
            groupsOnly: {
              enabled: false,
              generate: () => ({ member_count: { $gt: 2 } }),
            },
          },
        },
      ),
      new UserSearchSource(client, { pageSize, sort: userSorts.name }),
      new MessageSearchSource<{ messageSearchContext: MessageFilterContext }>(
        client,
        { messageSearchSort: messageSorts.newest, pageSize },
        {
          messageSearch: {
            initialFilterConfig: {
              // Replaces the built-in `text` generator: a message matches when a word in it starts
              // with the search text.
              text: {
                enabled: true,
                generate: ({ searchQuery }) =>
                  searchQuery ? { text: { $autocomplete: searchQuery } } : null,
              },
              author: {
                enabled: true,
                generate: ({ authorId }) => (authorId ? { 'user.id': authorId } : null),
              },
              withAttachments: {
                enabled: false,
                generate: () => ({ attachments: { $exists: true } }),
              },
              // A field takes one operator per condition, so the two ends of the range are two
              // conditions under `$and`.
              sentBetween: {
                enabled: true,
                generate: ({ sentFrom, sentTo }) => {
                  const range = [
                    ...(sentFrom
                      ? [{ created_at: { $gte: startOfLocalDay(sentFrom) } }]
                      : []),
                    ...(sentTo ? [{ created_at: { $lte: endOfLocalDay(sentTo) } }] : []),
                  ];
                  return range.length ? { $and: range } : null;
                },
              },
            },
          },
        },
      ),
    ],
  });

/** The dialog's three sources, typed, from the controller `Chat` holds. */
export const getDialogSources = (searchController: SearchController) => {
  const find = <T extends SearchSource>(
    type: string,
    isType: (source: SearchSource) => source is T,
  ) => {
    const source = searchController.getSource(type);
    return source && isType(source) ? source : undefined;
  };
  return {
    channels: find(
      'channels',
      (source): source is ChannelSearchSource => source instanceof ChannelSearchSource,
    ),
    messages: find(
      'messages',
      (source): source is DialogMessageSearchSource =>
        source instanceof MessageSearchSource,
    ),
    users: find(
      'users',
      (source): source is UserSearchSource => source instanceof UserSearchSource,
    ),
  };
};

/**
 * Runs the current search text again in one source, from the first page. A new `sort` or filter
 * applies from the next query, and the source doesn't query on its own when they change.
 */
export const searchAgain = (searchController: SearchController, source: SearchSource) => {
  if (searchController.searchQuery) void source.search(searchController.searchQuery);
};
