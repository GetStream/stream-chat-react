import type { ChannelFilters } from 'stream-chat';
import demoData from './demo-data.json';

/**
 * The cookbook runs against Stream's public demo app. Its token endpoint signs a token for any
 * user id, so the app needs no secret. Everything in that app is public: keep the content neutral.
 */
export const apiKey = demoData.apiKey;

export const currentUser = demoData.users.find(
  (user) => user.id === demoData.currentUserId,
) as { id: string; name: string };

type DemoChannel = { id: string };
type DemoData = { channels?: DemoChannel[] };

const channelIdsOf = (data: DemoData) =>
  (data.channels ?? []).map((channel) => channel.id);

// A recipe that needs data of its own keeps it in its folder's demo-data.json, in the same shape.
// Keyed by recipe id (`<group>/<recipe>`).
const recipeDemoData = Object.fromEntries(
  Object.entries(
    import.meta.glob<DemoData>('../recipes/*/*/demo-data.json', {
      eager: true,
      import: 'default',
    }),
  ).map(([path, data]) => [
    path.replace(/^\.\.\/recipes\/|\/demo-data\.json$/g, ''),
    data,
  ]),
);

/** Every channel the cookbook owns: the base ones and every recipe's own. */
export const demoChannelIds = [demoData, ...Object.values(recipeDemoData)].flatMap(
  channelIdsOf,
);

/**
 * The channels the open recipe shows in its lists and search: the base ones plus that recipe's
 * own, so one recipe's channels never appear in another recipe's screenshots.
 */
export const visibleChannelIds = [
  ...channelIdsOf(demoData),
  ...channelIdsOf(
    recipeDemoData[new URLSearchParams(window.location.search).get('recipe') ?? ''] ?? {},
  ),
];

/**
 * The base app's channel filters: only the open recipe's channels with the user in them, so other
 * activity in the shared demo app never shows up. A recipe that registers its own paginators builds
 * its filters on these.
 */
export const channelFilters: ChannelFilters = {
  id: { $in: visibleChannelIds },
  members: { $in: [currentUser.id] },
  type: 'messaging',
};

export const fetchToken = async (userId: string): Promise<string> => {
  const url = new URL('https://pronto.getstream.io/api/auth/create-token');
  url.searchParams.set('environment', demoData.tokenEnvironment);
  url.searchParams.set('user_id', userId);
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Token request failed: ${response.status}`);
  return ((await response.json()) as { token: string }).token;
};

export const tokenProvider = () => fetchToken(currentUser.id);

/**
 * `Channel.watch()` creates a channel that doesn't exist yet. Helpers that take a channel id from the
 * URL open only the cookbook's own channels, so a typo never creates one in the shared demo app.
 */
export const isDemoChannelId = (id: string | null): id is string =>
  !!id && demoChannelIds.includes(id);
