import { useMemo } from 'react';
import type { Channel, OwnCapabilitiesState } from 'stream-chat';
import { useContextChannel } from '../../../context/useContextChannel';
import { useStateStore } from '../../../store';

const ownCapabilitiesSelector = ({ ownCapabilities }: OwnCapabilitiesState) => ({
  ownCapabilities,
});

export type UseChannelCapabilitiesParams = {
  /** Takes precedence over `cid`. */
  channel?: Channel | undefined;
  // TODO: remove `cid` in the next major release; `channel` covers it.
  /** Reads the channel in context when it has this cid. */
  cid?: string | undefined;
};

/** The current user's capabilities in the channel, as a `Set`; empty until they load. */
export const useChannelCapabilities = ({
  channel: channelParam,
  cid,
}: UseChannelCapabilitiesParams) => {
  const contextChannel = useContextChannel();
  const contextChannelWithCid =
    cid && contextChannel?.cid === cid ? contextChannel : undefined;
  const channel = channelParam ?? contextChannelWithCid;
  const { ownCapabilities } =
    useStateStore(channel?.state, ownCapabilitiesSelector) ?? {};

  return useMemo(() => new Set<string>(ownCapabilities ?? []), [ownCapabilities]);
};
