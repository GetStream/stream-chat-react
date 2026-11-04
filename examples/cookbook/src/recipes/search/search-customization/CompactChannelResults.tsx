import type { PropsWithChildren } from 'react';
import type { Channel, ChannelStateData } from 'stream-chat';
import {
  DefaultSearchResultItems,
  SearchSourceResultList,
  useChannelDisplayName,
  useChatContext,
  useStateStore,
  useWorkspaceNavigation,
  WithComponents,
} from 'stream-chat-react';
import './CompactChannelResults.css';

const memberCountSelector = ({ memberCount }: ChannelStateData) => ({
  memberCount,
});

const CompactChannelResult = ({ item }: { item: Channel }) => {
  const { channelManager, client } = useChatContext();
  const { openChannel } = useWorkspaceNavigation();
  const name = useChannelDisplayName(item);
  const { memberCount } = useStateStore(item.state, memberCountSelector);

  return (
    <button
      className='cookbook-channel-result'
      onClick={(event) => {
        openChannel(item, { event });
        // Channel search doesn't watch its results, so watch the channel to receive its events.
        item.watch().catch((error: Error) =>
          client.notifications.addError({
            message: 'Failed to load the channel',
            options: { originalError: error },
            origin: { emitter: 'CompactChannelResult' },
          }),
        );
        // Add the channel to the channel lists whose filters it matches.
        channelManager.ingestChannel(item);
      }}
      role='option'
      type='button'
    >
      <span className='cookbook-channel-result__name'># {name}</span>
      <span className='cookbook-channel-result__members'>{memberCount} members</span>
    </button>
  );
};

const searchResultItems = {
  ...DefaultSearchResultItems,
  channels: CompactChannelResult,
};

const ResultList = () => <SearchSourceResultList SearchResultItems={searchResultItems} />;

// Declared once, so WithComponents gets the same object on every render.
const overrides = { SearchSourceResultList: ResultList };

export const WithCompactChannelResults = ({ children }: PropsWithChildren) => (
  <WithComponents overrides={overrides}>{children}</WithComponents>
);
