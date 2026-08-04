import { useMemo } from 'react';
import type { OwnCapabilitiesState } from 'stream-chat';
import { useChannel } from '../../../context';
import { useStateStore } from '../../../store';

const ownCapabilitiesSelector = ({ ownCapabilities }: OwnCapabilitiesState) => ({
  ownCapabilities,
});

export const useChannelCapabilities = ({ cid }: { cid: string | undefined }) => {
  const channel = useChannel();
  const { ownCapabilities } =
    useStateStore(channel.state.ownCapabilitiesStore, ownCapabilitiesSelector) ?? {};

  return useMemo(() => {
    if (!cid || channel.cid !== cid) return new Set<string>();
    return new Set(ownCapabilities ?? []);
  }, [channel.cid, cid, ownCapabilities]);
};
