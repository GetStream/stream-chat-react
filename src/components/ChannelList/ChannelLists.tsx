import React from 'react';
import type { ChannelManagerState } from 'stream-chat';

import { ChannelListContextProvider } from '../../context/ChannelListContext';
import { useChatContext } from '../../context/ChatContext';
import { useComponentContext } from '../../context/ComponentContext';
import { useStateStore } from '../../store';
import { ChannelList as DefaultChannelList } from './ChannelList';

const paginatorsSelector = (state: ChannelManagerState) => ({
  paginators: state.paginators,
});

/**
 * Renders the `ChannelList` slot (`ChannelList` by default) once per paginator held by the
 * `ChannelManager` on `ChatContext`, so an override can give each list its own components. The
 * primary paginator (`paginators[0]`) is exposed through `ChannelListContext`, so descendants can
 * read and mutate the loaded list without knowing about the channel manager.
 */
export const ChannelLists = () => {
  const { channelManager } = useChatContext();
  const { ChannelList = DefaultChannelList } = useComponentContext();
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
