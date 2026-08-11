import React from 'react';
import type { ChannelManagerState } from 'stream-chat';

import { ChannelListContextProvider } from '../../context/ChannelListContext';
import { useChatContext } from '../../context/ChatContext';
import { useStateStore } from '../../store';
import { ChannelList } from './ChannelList';

const paginatorsSelector = (state: ChannelManagerState) => ({
  paginators: state.paginators,
});

/**
 * Renders one `<ChannelList/>` per paginator held by the `ChannelManager` on
 * `ChatContext` — i.e. its data source is the `ChannelManager` (the whole set of lists). Each child
 * `ChannelList` registers the (ref-counted) WS subscriptions. The primary (`paginators[0]`)
 * paginator is exposed through `ChannelListContext` so descendants (search results, member
 * actions, notification targeting) can read/mutate the loaded list without knowing about the
 * channel manager.
 */
export const ChannelLists = () => {
  const { channelManager } = useChatContext();
  const { paginators } = useStateStore(channelManager.state, paginatorsSelector);

  const lists = paginators.map((paginator) => (
    <ChannelList key={paginator.id} paginator={paginator} />
  ));

  const primaryPaginator = paginators[0];
  if (!primaryPaginator) return <>{lists}</>;

  return (
    <ChannelListContextProvider value={{ paginator: primaryPaginator }}>
      {lists}
    </ChannelListContextProvider>
  );
};
