import type { StreamChat } from 'stream-chat';

/**
 * Registry of server-side entities and the methods this dialog can invoke on them.
 *
 * Only `channel.updateMemberPartial` is wired up so far — the use case is setting another
 * member's channel-specific data, which a browser client cannot do.
 *
 * Everything goes through `client.api.sendRequest` rather than the generated helpers, for two
 * reasons: `client.channel(...)` throws without a connected user, and the generated
 * `updateMemberPartial` sends no `user_id`, so it can only ever write the caller's own
 * membership. `sendRequest` is the same primitive the generated APIs use internally and it
 * accepts query params, which is where `user_id` belongs.
 *
 * To add a method: append an entry below. `entity`, `payloadTemplate` and `invoke` are all it
 * needs — the dialog derives its selects from this list.
 */

export type ServerSideEntity = 'channel' | 'client';

export type ServerSideMethodContext = {
  /** Present only for entity `channel`. Full `type:id` cid. */
  cid?: string;
  client: StreamChat;
  payload: unknown;
};

export type ServerSideMethodDescriptor = {
  description: string;
  entity: ServerSideEntity;
  id: string;
  invoke: (context: ServerSideMethodContext) => Promise<unknown>;
  label: string;
  /** Pretty-printed into the payload textarea when the method is selected. */
  payloadTemplate: unknown;
  /**
   * The method addresses a single channel member through a `user_id` payload key. The dialog
   * offers a member picker that writes that key, so the id does not have to be looked up by hand.
   */
  targetsMember?: boolean;
};

/** Payload key the member picker writes into. */
export const MEMBER_USER_ID_KEY = 'user_id';

export const serverSideEntities: {
  description: string;
  label: string;
  value: ServerSideEntity;
}[] = [
  {
    description: 'Operates on a single channel. Requires a CID.',
    label: 'Channel',
    value: 'channel',
  },
  {
    description: 'App-wide operations. No methods registered yet.',
    label: 'Client',
    value: 'client',
  },
];

const parseCid = (cid: string | undefined) => {
  const [type, ...rest] = (cid ?? '').split(':');
  const id = rest.join(':');

  if (!type || !id) {
    throw new Error(
      `Invalid CID "${cid ?? ''}". Expected the form "type:id", e.g. "messaging:general".`,
    );
  }

  return { id, type };
};

const asRecord = (payload: unknown) => {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new Error('The payload must be a JSON object.');
  }

  return payload as Record<string, unknown>;
};

export type ChannelMemberSummary = {
  name?: string;
  userId: string;
};

/**
 * Server-side member lookup for a CID the local client has not loaded — the only way to resolve
 * ids for an arbitrary channel. Channels the app already has are read straight off
 * `channel.state.members` instead, which needs no secret and no request.
 */
export const fetchChannelMembers = async ({
  cid,
  client,
  limit = 100,
}: {
  cid: string | undefined;
  client: StreamChat;
  limit?: number;
}): Promise<ChannelMemberSummary[]> => {
  const { id, type } = parseCid(cid);
  const { body } = await client.api.sendRequest<{
    members: { name?: string; user?: { id?: string; name?: string }; user_id?: string }[];
  }>('GET', '/api/v2/chat/members', undefined, {
    payload: JSON.stringify({ filter_conditions: {}, id, limit, type }),
  });

  return (body.members ?? [])
    .map((member) => ({
      name: member.user?.name,
      userId: member.user_id ?? member.user?.id ?? '',
    }))
    .filter((member) => !!member.userId);
};

export const serverSideMethods: ServerSideMethodDescriptor[] = [
  {
    description:
      'Partial-updates a channel member. `user_id` selects whose membership is written — that parameter is the whole reason this needs a server-side client, and the generated SDK method omits it. Custom member fields go at the top level of `set`; `custom` itself is reserved and will be rejected.',
    entity: 'channel',
    id: 'channel.updateMemberPartial',
    invoke: async ({ cid, client, payload }) => {
      const { id, type } = parseCid(cid);
      const { user_id: userId, ...updates } = asRecord(payload);

      if (typeof userId !== 'string' || !userId) {
        throw new Error('The payload needs a non-empty string `user_id`.');
      }

      if (!('set' in updates) && !('unset' in updates)) {
        throw new Error('The payload needs a `set` object and/or an `unset` array.');
      }

      const { body } = await client.api.sendRequest(
        'PATCH',
        '/api/v2/chat/channels/{type}/{id}/member',
        { id, type },
        { user_id: userId },
        updates,
        'application/json',
      );

      return body;
    },
    label: 'updateMemberPartial — write another member’s data',
    payloadTemplate: {
      set: { nickname: 'sharpshooter' },
      user_id: '',
    },
    targetsMember: true,
  },
];

export const getMethodsForEntity = (entity: ServerSideEntity) =>
  serverSideMethods.filter((method) => method.entity === entity);

export const findMethod = (id: string) =>
  serverSideMethods.find((method) => method.id === id);

export const formatPayloadTemplate = (template: unknown) =>
  `${JSON.stringify(template, null, 2)}\n`;
