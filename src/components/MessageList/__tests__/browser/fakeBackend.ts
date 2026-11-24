import type { LocalMessage, StreamChat, UserResponse } from 'stream-chat';

import {
  generateChannel,
  generateMember,
  generateMessage,
} from '../../../../mock-builders';

type ChannelAPIResponse = ReturnType<typeof generateChannel>;
import type { Rng } from './prng';

/** One request the client made, reduced to what a trace compares. */
export type RequestRecord = {
  method: string;
  /** The path without host or query string, with the channel ID replaced by `:id`. */
  path: string;
  /** The `messages` pagination params of a channel query. */
  messages?: Record<string, unknown>;
};

export type FakeBackend = {
  channelResponse: ChannelAPIResponse;
  /** Every message the server holds, oldest first. */
  history: LocalMessage[];
  requests: RequestRecord[];
  /** Holds every channel query until the returned function is called. */
  holdQueries: () => () => void;
};

const BASE_TIME = Date.UTC(2026, 0, 5, 9, 0, 0);

export type MessageSpec = {
  /** Gap to the previous message, in minutes. */
  gapMinutes?: number;
  user: UserResponse;
};

/** Messages `m-0000`, `m-0001`, … from `users`, one every `gapMinutes` (default 1) minutes. */
export const buildHistory = ({
  count,
  gapMinutes = 1,
  rng,
  users,
}: {
  count: number;
  gapMinutes?: number;
  rng: Rng;
  users: UserResponse[];
}) => {
  const history: LocalMessage[] = [];
  for (let i = 0; i < count; i += 1) {
    history.push(
      generateMessage({
        id: `m-${String(i).padStart(4, '0')}`,
        text: `message ${i}`,
        timestamp: new Date(BASE_TIME + i * gapMinutes * 60_000),
        user: rng.pick(users),
      }),
    );
  }
  return history;
};

const sliceForQuery = (history: LocalMessage[], params: Record<string, unknown> = {}) => {
  const limit = typeof params.limit === 'number' ? params.limit : 100;
  const indexOf = (id: unknown) => history.findIndex((message) => message.id === id);
  if (params.id_lt) {
    const index = indexOf(params.id_lt);
    return history.slice(Math.max(0, index - limit), index);
  }
  if (params.id_gt) {
    const index = indexOf(params.id_gt);
    return history.slice(index + 1, index + 1 + limit);
  }
  if (params.id_around) {
    const index = indexOf(params.id_around);
    const start = Math.max(
      0,
      Math.min(history.length - limit, index - Math.floor(limit / 2)),
    );
    return history.slice(start, start + limit);
  }
  return history.slice(Math.max(0, history.length - limit));
};

/**
 * Answers the client's requests from an in-memory history: a channel query gets the page its
 * `messages` params select, every other request an empty success. Installed on
 * `client.axiosInstance.request`, the one funnel every `stream-chat` request goes through.
 */
export const installFakeBackend = ({
  channelId,
  client,
  history,
  users,
}: {
  channelId: string;
  client: StreamChat;
  history: LocalMessage[];
  users: UserResponse[];
}): FakeBackend => {
  const channelResponse = generateChannel({
    channel: { id: channelId, type: 'messaging' },
    members: users.map((user) => generateMember({ user })),
    messages: [],
  });
  const requests: RequestRecord[] = [];
  let hold: Promise<void> | null = null;

  const backend: FakeBackend = {
    channelResponse,
    history,
    holdQueries: () => {
      let release = () => undefined as void;
      hold = new Promise<void>((resolve) => {
        release = resolve;
      });
      return () => {
        hold = null;
        release();
      };
    },
    requests,
  };

  (vi.spyOn(client.axiosInstance as any, 'request') as any).mockImplementation(
    (async (config: { data?: unknown; method?: string; url?: string }) => {
      const method = String(config.method ?? 'get').toLowerCase();
      const url = new URL(String(config.url), 'http://localhost');
      const path = url.pathname.replace(channelId, ':id');
      const body =
        typeof config.data === 'string' ? JSON.parse(config.data) : (config.data ?? {});
      const isChannelQuery = /\/channels\/messaging\/:id\/query$/.test(path);
      requests.push({
        method,
        path,
        ...(isChannelQuery && { messages: body.messages ?? {} }),
      });

      let data: unknown = { duration: '0.01ms' };
      // A send echoes the message back the way the server confirms it.
      if (method === 'post' && /\/channels\/messaging\/:id\/message$/.test(path)) {
        const last = backend.history[backend.history.length - 1];
        const createdAt = Number(last?.created_at ?? 0) + 60_000 * 1e6;
        const sent = {
          ...body.message,
          cid: channelResponse.channel.cid,
          created_at: createdAt,
          status: 'received',
          type: 'regular',
          updated_at: createdAt,
          user: client.user,
        };
        backend.history.push(sent as LocalMessage);
        data = { duration: '0.01ms', message: sent };
      }
      if (isChannelQuery) {
        if (hold) await hold;
        const cid = channelResponse.channel.cid;
        data = {
          ...channelResponse,
          duration: '0.01ms',
          messages: sliceForQuery(backend.history, body.messages).map((message) => ({
            ...message,
            cid,
          })),
          read: [],
        };
      }
      return { config, data, headers: {}, request: {}, status: 200, statusText: '' };
    }) as never,
  );

  return backend;
};
