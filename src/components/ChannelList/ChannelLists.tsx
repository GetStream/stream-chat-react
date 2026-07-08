import type { PropsWithChildren } from 'react';
import React, { useMemo } from 'react';
import type {
  ChannelPaginator,
  ChannelPaginatorsOrchestratorState,
  ChannelPaginatorState,
} from 'stream-chat';

import { ChannelListContextProvider } from '../../context/ChannelListContext';
import { useChatContext } from '../../context/ChatContext';
import { useStateStore } from '../../store';
import { ChannelList } from './ChannelList';

const paginatorsSelector = (state: ChannelPaginatorsOrchestratorState) => ({
  paginators: state.paginators,
});

const primaryPaginatorStateSelector = (state: ChannelPaginatorState) => ({
  items: state.items,
});

/**
 * Back-compat bridge: exposes the primary (`paginators[0]`) `ChannelPaginator` through
 * the legacy `ChannelListContext` so consumers that predate the orchestrator
 * (`SearchResultItem`, `ChannelMemberActions`, `useNotificationTarget`) keep working
 * without knowing about paginators. `setChannels` proxies to the paginator's `setItems`.
 */
const ChannelListCompatProvider = ({
  children,
  paginator,
}: PropsWithChildren<{ paginator: ChannelPaginator }>) => {
  const { items } = useStateStore(paginator.state, primaryPaginatorStateSelector);
  const value = useMemo(
    () => ({
      channels: items ?? [],
      hasNextPage: paginator.hasNext,
      loadNextPage: async () => {
        await paginator.next();
      },
      setChannels: (
        valueOrFactory: Parameters<typeof paginator.setItems>[0]['valueOrFactory'],
      ) => paginator.setItems({ valueOrFactory }),
    }),
    [items, paginator],
  );

  return (
    <ChannelListContextProvider value={value}>{children}</ChannelListContextProvider>
  );
};

/**
 * Renders one `<ChannelList/>` per paginator held by the
 * `ChannelPaginatorsOrchestrator` on `ChatContext` — i.e. its data source is the
 * orchestrator (the whole set of lists). Each child `ChannelList` registers the
 * (ref-counted) WS subscriptions.
 */
export const ChannelLists = () => {
  const { channelPaginatorsOrchestrator } = useChatContext('ChannelLists');
  const { paginators } = useStateStore(
    channelPaginatorsOrchestrator.state,
    paginatorsSelector,
  );

  const lists = (
    <>
      {paginators.map((paginator) => (
        <ChannelList key={paginator.id} paginator={paginator} />
      ))}
    </>
  );

  const primaryPaginator = paginators[0];
  if (!primaryPaginator) return lists;

  return (
    <ChannelListCompatProvider paginator={primaryPaginator}>
      {lists}
    </ChannelListCompatProvider>
  );
};
