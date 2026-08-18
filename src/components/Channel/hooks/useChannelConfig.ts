import type { Channel, ChannelConfig } from 'stream-chat';
import { useChannelInstanceContext } from '../../../context/ChannelInstanceContext';
import { useThreadContext } from '../../Threads';
import { useStateStore } from '../../../store';

const identity = (state: ChannelConfig) => state;

/**
 * A channel's **resolved** configuration, reactively.
 *
 * Replaces the previous implementation, which read the channel *type's* raw server configuration out of
 * `client.channelConfigsByTypeStore`. That answered only the server's half: every gate here is the
 * server flag ANDed with whatever the integrator registered through `client.config`, so a UI reading the
 * raw flag offered features the client had already disabled.
 *
 * Resolves the channel from context without `useChannel`, which *throws* when there is none — `Channel`
 * itself calls this hook while it is still establishing that context, and a config read is not a reason
 * to fail a render. Pass `channel` explicitly to use it outside a channel subtree.
 */
export const useChannelConfig = ({
  channel: channelFromProps,
  cid,
}: {
  cid: string | undefined;
  channel?: Channel;
}) => {
  const thread = useThreadContext();
  const { channel: channelFromContext } = useChannelInstanceContext() ?? {};
  const channel = channelFromProps ?? thread?.channel ?? channelFromContext;

  // `useStateStore` tolerates an absent store, which is what keeps this callable before the context
  // exists — the hook order stays stable either way.
  const config = useStateStore(channel?.configState, identity);

  if (!cid || channel?.cid !== cid) return undefined;

  return config;
};
