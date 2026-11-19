import React from 'react';
import type { PaginatorState, Thread } from 'stream-chat';

import {
  type ListLoadErrorUIProps,
  type ListLoadingNextPageUIProps,
  ListLoadErrorUI as SharedListLoadErrorUI,
} from '../../ListStates';
import { renderWithDeprecatedKey } from '../../ListStates/utils';
import { LoadingChannels } from '../../Loading';
import { LoadingIndicator as DefaultLoadingIndicator } from '../../Loading/LoadingIndicator';
import {
  useChatContext,
  useComponentContext,
  useComponentContextIcons,
  useTranslationContext,
} from '../../../context';
import { useStateStore } from '../../../store';

// The thread list's list states: the `ThreadList<State>UI` components the list renders, and the
// list's own `ThreadList<State>` defaults. Each `…UI` component renders the deprecated thread list
// key for its state while set, else the shared `List<State>UI` key, else the default.

/** The props Virtuoso passes to its `EmptyPlaceholder` and `Footer` components. */
type VirtuosoSlotProps = { context?: unknown };

/** While the first page loads: `ListFirstPageLoadingUI`, or the skeleton. */
export const ThreadListFirstPageLoadingUI = () => {
  const { FirstPageLoadingIndicator, ListFirstPageLoadingUI = LoadingChannels } =
    useComponentContext();
  return renderWithDeprecatedKey(
    FirstPageLoadingIndicator,
    {},
    <ListFirstPageLoadingUI />,
  );
};

/** The thread list's empty state: an icon and "Reply to a message to start a thread". */
export const ThreadListEmpty = () => {
  const { IconMessageBubbles } = useComponentContextIcons();
  const { t } = useTranslationContext();

  return (
    <div className='str-chat__thread-list-empty-placeholder'>
      <IconMessageBubbles />
      <p>{t('threadList.empty.text', 'Reply to a message to start a thread')}</p>
    </div>
  );
};

/**
 * Virtuoso's empty slot: the deprecated `ThreadListEmptyPlaceholder` key while set, else the
 * `ListEmptyUI` key or the thread list's own empty placeholder.
 */
export const ThreadListEmptyUI = (props: VirtuosoSlotProps) => {
  const {
    ListEmptyUI = ThreadListEmpty,
    ThreadListEmptyPlaceholder: DeprecatedThreadListEmptyPlaceholder,
  } = useComponentContext();
  return (
    <>
      {renderWithDeprecatedKey(
        DeprecatedThreadListEmptyPlaceholder,
        props,
        <ListEmptyUI />,
      )}
    </>
  );
};

/** A page of threads loads below threads already loaded. */
const isLoadingNextThreadsPageSelector = (state: PaginatorState<Thread>) => ({
  isLoadingNext: state.isLoading && !!state.items?.length,
});

/**
 * The thread list's own next-page loading state: the `LoadingIndicator` below the threads while
 * `isLoading`.
 */
const ThreadListLoadingNextPage = ({ isLoading }: ListLoadingNextPageUIProps) => {
  // The default applies only to an unset key, so `null` stays `null` and hides the spinner.
  const { LoadingIndicator = DefaultLoadingIndicator } = useComponentContext();
  if (!isLoading || !LoadingIndicator) return null;
  return (
    <div className='str-chat__thread-list-loading-indicator'>
      <LoadingIndicator />
    </div>
  );
};

/**
 * Virtuoso's footer: the deprecated `ThreadListLoadingIndicator` while set, else the
 * `ListLoadingNextPageUI` key or the thread list's own, shown while a next page loads.
 */
export const ThreadListLoadingNextPageUI = (props: VirtuosoSlotProps) => {
  const { client } = useChatContext();
  const {
    ListLoadingNextPageUI = ThreadListLoadingNextPage,
    ThreadListLoadingIndicator,
  } = useComponentContext();
  const { isLoadingNext } = useStateStore(
    client.threads.paginator.state,
    isLoadingNextThreadsPageSelector,
  );
  return (
    <>
      {renderWithDeprecatedKey(
        ThreadListLoadingIndicator,
        props,
        <ListLoadingNextPageUI isLoading={isLoadingNext} position='bottom' />,
      )}
    </>
  );
};

const ThreadListLoadErrorTitle = () => {
  const { t } = useTranslationContext();
  return <>{t('threadList.loadError.text', "Couldn't load threads")}</>;
};

/** The thread list's error in place of a failed first page: "Couldn't load threads". */
export const ThreadListLoadError = (props: ListLoadErrorUIProps) => (
  <SharedListLoadErrorUI
    {...props}
    className='str-chat__thread-list-load-error'
    Title={ThreadListLoadErrorTitle}
  />
);

/**
 * In place of a failed first page: the deprecated `ListLoadErrorIndicator` key while set, else
 * `ListLoadErrorUI`, or "Couldn't load threads".
 */
export const ThreadListLoadErrorUI = (props: ListLoadErrorUIProps) => {
  const { ListLoadErrorIndicator, ListLoadErrorUI = ThreadListLoadError } =
    useComponentContext();
  return renderWithDeprecatedKey(
    ListLoadErrorIndicator,
    props,
    <ListLoadErrorUI {...props} />,
  );
};
