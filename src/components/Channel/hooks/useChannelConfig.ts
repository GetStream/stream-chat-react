import { useChatContext } from '../../../context';
import { useStateStore } from '../../../store';
import type { ChannelConfigsState, ChannelConfigWithInfo, Configs } from 'stream-chat';

const channelConfigsSelector = (value: ChannelConfigsState) => ({
  configs: value.configs,
});

// todo: why is channel config stored on client?
export const useChannelConfig = ({ cid }: { cid: string | undefined }) => {
  const { client } = useChatContext('useChannelConfig');
  const channelConfigsState = useStateStore(client.configsStore, channelConfigsSelector);

  if (!cid) return undefined;

  return channelConfigsState?.configs[cid as keyof Configs] as
    | ChannelConfigWithInfo
    | undefined;
};
