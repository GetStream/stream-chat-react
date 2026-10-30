import type { PropsWithChildren } from 'react';
import { useState } from 'react';
import type { ChannelPaginator } from 'stream-chat';
import {
  useAriaLiveAnnouncer,
  useChannelListContext,
  useChannelPaginatorState,
  WithComponents,
} from 'stream-chat-react';
import { ChannelListLoadError } from './ChannelListLoadError';
import { ChannelListSkeleton } from './ChannelListSkeleton';
import { EmptyChannelList } from './EmptyChannelList';

type QueryState = { isLoading: boolean; lastQueryError?: Error };

/** The query failed and the paginator stopped trying: its retries are spent and nothing is loading. */
const hasGivenUp = ({ isLoading, lastQueryError }: QueryState) =>
  !!lastQueryError && !isLoading;

/** The paginator holds a first page, even an empty one. */
const hasFirstPage = (paginator: ChannelPaginator) => paginator.items !== undefined;

/**
 * Shows the error once the paginator has given up, and the skeleton otherwise. While a Retry the user
 * started runs, the error stays, so the focused Retry button isn't swapped out.
 */
const FirstPageFromPaginator = ({ paginator }: { paginator: ChannelPaginator }) => {
  const state = useChannelPaginatorState(paginator);
  const announce = useAriaLiveAnnouncer();
  const [isRetrying, setIsRetrying] = useState(false);

  const retry = () => {
    if (isRetrying) return;
    setIsRetrying(true);
    // A paginator created with `throwErrors: true` rejects here; the error is in its state either way.
    void paginator
      .reload()
      .catch(() => undefined)
      .finally(() => {
        setIsRetrying(false);
        if (hasFirstPage(paginator)) announce('Conversations loaded');
      });
  };

  if (!hasGivenUp(state) && !isRetrying) return <ChannelListSkeleton />;
  return <ChannelListLoadError isRetrying={isRetrying} onRetry={retry} />;
};

/** What the channel list shows until its first page arrives. */
const ChannelListFirstPage = () => {
  const { paginator } = useChannelListContext();
  if (!paginator) return <ChannelListSkeleton />;
  return <FirstPageFromPaginator paginator={paginator} />;
};

// Declared once, so WithComponents gets the same object on every render.
const overrides = {
  EmptyListIndicator: EmptyChannelList,
  FirstPageLoadingIndicator: ChannelListFirstPage,
};

/** Replaces the channel list's loading, error and empty states for every list inside it. */
export const WithChannelListStates = ({ children }: PropsWithChildren) => (
  <WithComponents overrides={overrides}>{children}</WithComponents>
);
