import type {
  Channel,
  ChannelMemberResponse,
  StreamChat,
  UserResponse,
} from 'stream-chat';

import { getFakeBackend } from './fakeChannelBackend';

/**
 * The channel the pagination scenarios run on. It exists only in this browser tab: the fake backend
 * answers its queries from the moment it is created, so no request for it reaches the Stream API.
 * The workspace URL never restores it (see `WorkspaceUrlSync`): a restored channel is watched for
 * real, and watching a channel the server does not have creates it.
 */

const TYPE = 'messaging';
const ID = 'pagination-scenarios-local';

export const SCENARIO_CHANNEL_CID = `${TYPE}:${ID}`;

const NAME = 'Pagination scenarios (local)';

/**
 * The test channel, created in the channel manager, loaded from the fake backend and shown in the
 * channel lists it matches, on first use. A list re-queried from the server drops it again, as the
 * server does not have it.
 */
export const ensureScenarioChannel = async (client: StreamChat) => {
  const channel = client.channel(TYPE, ID);
  channel.data = { ...channel.data, custom: { ...channel.data?.custom, name: NAME } };
  // You are its member, as in the channels you open from the list; the fake backend's answers
  // carry the channel's members on.
  const { user, userID } = client;
  if (user && userID && !channel.state.members[userID]) {
    // Only what the app reads; the rest are server bookkeeping a local channel has none of.
    const membership = {
      channel_role: 'channel_member',
      user: user as UserResponse,
      user_id: userID,
    } as ChannelMemberResponse;
    channel.state.members = { ...channel.state.members, [userID]: membership };
  }
  const backend = getFakeBackend(channel);
  await backend.install();
  client.channelManager.ingestChannel(channel);
  return { backend, channel };
};

/** Shows the test channel in the app or takes it away; each resolves once the channel says so. */
export type ScenarioChannelInApp = {
  close: () => Promise<void>;
  open: () => Promise<void>;
};

const SETTLE_TIMEOUT_MS = 3000;
const SETTLE_POLL_MS = 50;

/** Resolves once the app has activated (`true`) or deactivated (`false`) `channel`. */
export const untilActive = async (channel: Channel, active: boolean) => {
  for (let waited = 0; waited < SETTLE_TIMEOUT_MS; waited += SETTLE_POLL_MS) {
    if (channel.active === active) return;
    await new Promise((resolve) => setTimeout(resolve, SETTLE_POLL_MS));
  }
  throw new Error(`the app did not ${active ? 'open' : 'close'} ${channel.cid}`);
};
