import {
  ChannelSearchSource,
  MessageSearchSource,
  SearchController,
  UserSearchSource,
} from 'stream-chat';
import type { StreamChat } from 'stream-chat';
import { visibleChannelIds } from './client';
import demoData from './demo-data.json';

/**
 * The default sources, kept to the cookbook's own channels and cast, so results from other data
 * in the shared demo app never show up in a screenshot. The base app passes it to `Chat`; a recipe's
 * `chatProps` can replace it.
 */
export const createDemoSearchController = (client: StreamChat) =>
  new SearchController({
    client,
    sources: [
      new ChannelSearchSource(client, { filters: { id: { $in: visibleChannelIds } } }),
      new UserSearchSource(client, {
        filters: { id: { $in: demoData.users.map((user) => user.id) } },
      }),
      new MessageSearchSource(client, {
        messageSearchChannelFilters: { id: { $in: visibleChannelIds } },
      }),
    ],
  });
