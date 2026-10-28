import type { MouseEvent, PropsWithChildren, ReactNode, RefObject } from 'react';
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import type {
  ChannelFilters,
  ChannelPaginator,
  ChannelPaginatorState,
  SearchControllerState,
} from 'stream-chat';
import {
  Button,
  ChannelListContextProvider,
  ChannelListItem,
  ChannelListHeader as DefaultChannelListHeader,
  NotificationList as DefaultNotificationList,
  Search as DefaultSearch,
  LoadingChannels,
  LoadingIndicator,
  LoadMoreButton,
  useChannelListKeyboardNavigation,
  useChatContext,
  useComponentContext,
  useComponentContextIcons,
  useStateStore,
} from 'stream-chat-react';
import type { ChannelSections } from './useChannelSections';
import { useChannelSections } from './useChannelSections';
import './SectionedChannelNavigation.css';

const searchSelector = ({ isActive }: SearchControllerState) => ({ isActive });
const sectionSelector = ({
  hasMoreTail,
  isLoading,
  items,
  lastQueryError,
}: ChannelPaginatorState) => ({ hasMoreTail, isLoading, items, lastQueryError });

type SectionState = ReturnType<typeof sectionSelector>;

/**
 * Has no page loaded yet: the paginator holds no items, or holds only channels events put there
 * before it ever queried.
 */
const needsFirstPage = (paginator: ChannelPaginator) =>
  paginator.items === undefined || !paginator.isInitialized;

/** Found no channels and has no further page to load. */
const isEmpty = ({ hasMoreTail, items }: SectionState) =>
  items?.length === 0 && !hasMoreTail;

/** The last query failed, and the section has no channels to show. */
const failedWithoutChannels = ({ items, lastQueryError }: SectionState) =>
  !!lastQueryError && !items?.length;

/** Reports each failed query as an error notification, as `ChannelList` does. */
const useQueryErrorNotification = (lastQueryError: Error | undefined) => {
  const { client } = useChatContext();

  useEffect(() => {
    if (!lastQueryError) return;
    client.notifications.addError({
      message: lastQueryError.message,
      origin: {
        context: { reason: 'channel query error' },
        emitter: 'SectionedChannelNavigation',
      },
    });
  }, [client, lastQueryError]);
};

/**
 * Returns the paginator's state, reports its failed queries, and loads the first page while
 * `enabled` and the paginator has none: on mount, after a reset, or while it holds only event
 * items. Every later page waits for the user's click. A first page that failed waits for the
 * user's "Try again" too, or, in Archived, for the user to open the section again.
 */
const useSectionState = (paginator: ChannelPaginator, enabled = true) => {
  const state = useStateStore(paginator.state, sectionSelector);
  useQueryErrorNotification(state.lastQueryError);

  useEffect(() => {
    if (enabled && needsFirstPage(paginator)) void paginator.toTail();
  }, [enabled, paginator, state.items]);

  return state;
};

/** Nothing has focus: the page body holds it, as after the focused button turned disabled. */
const hasLostFocus = () =>
  document.activeElement === null || document.activeElement === document.body;

/**
 * Returns the load-more click handler, which loads the paginator's next page. The button is
 * disabled while the page loads, which takes focus off it. The keyboard hook then moves focus to
 * the first row the page adds; when it adds none, this puts focus back on the button, or on the
 * last row once the button is gone. One of them is always there: with neither, the section shows
 * its empty state instead of the rows.
 */
const useRestoreFocusAfterPage = (
  navigationRef: RefObject<HTMLElement | null>,
  paginator: ChannelPaginator,
  isLoading: boolean,
) => {
  const pageRequestedRef = useRef(false);

  useEffect(() => {
    if (isLoading || !pageRequestedRef.current) return;
    pageRequestedRef.current = false;
    if (!hasLostFocus()) return;
    const focusTargets = navigationRef.current?.querySelectorAll<HTMLElement>(
      '[role="option"], .cookbook-channel-section__more button',
    );
    focusTargets?.[focusTargets.length - 1]?.focus();
  }, [isLoading, navigationRef]);

  const onLoadMore = () => {
    // The checks `toTail()` makes before it queries: only a query that starts ends in a focus move.
    if (paginator.isLoading || !paginator.hasMoreTail) return;
    pageRequestedRef.current = true;
    void paginator.toTail();
  };

  return onLoadMore;
};

/** The SDK's "Load more" button, shown only while the paginator has another page. */
const SectionLoadMore = ({
  onClick,
  state,
}: {
  onClick: () => void;
  state: SectionState;
}) =>
  state.hasMoreTail ? (
    <div className='cookbook-channel-section__more'>
      <LoadMoreButton isLoading={state.isLoading} onClick={onClick} />
    </div>
  ) : null;

/**
 * Says the section's channels didn't load, with a button that queries the first page again. The
 * button goes away once the query starts, so it first moves focus to the section's title.
 */
const SectionLoadError = ({ paginator }: { paginator: ChannelPaginator }) => {
  const retry = (event: MouseEvent<HTMLButtonElement>) => {
    event.currentTarget.closest('section')?.querySelector('h2')?.focus();
    void paginator.toTail();
  };

  return (
    <div className='cookbook-channel-section__error'>
      <p className='cookbook-channel-section__error-text'>Couldn’t load channels</p>
      <Button appearance='outline' onClick={retry} size='sm' variant='secondary'>
        Try again
      </Button>
    </div>
  );
};

/**
 * A section's channels as a listbox named by the section title, holding only the SDK's rows, and
 * the section's load-more button after it. The keyboard hook sits on the wrapper around both and
 * finds the rows and the button inside it: the arrow keys reach the button, and a click moves focus
 * to the first row it loads.
 */
const ChannelRows = ({
  paginator,
  state,
  titleId,
}: {
  paginator: ChannelPaginator;
  state: SectionState;
  titleId: string;
}) => {
  const navigationRef = useRef<HTMLDivElement>(null);
  const { onClickCapture, onKeyDown } = useChannelListKeyboardNavigation(navigationRef);
  const onLoadMore = useRestoreFocusAfterPage(navigationRef, paginator, state.isLoading);

  return (
    <div onClickCapture={onClickCapture} onKeyDown={onKeyDown} ref={navigationRef}>
      <div aria-labelledby={titleId} role='listbox'>
        {state.items?.map((channel) => (
          <ChannelListItem channel={channel} key={channel.cid} />
        ))}
      </div>
      <SectionLoadMore onClick={onLoadMore} state={state} />
    </div>
  );
};

/**
 * A section of one paginator, named by its title. Its `ChannelListContext` holds that paginator, as
 * `ChannelNavigation` gives each of its lists one: the rows' action notifications use it to show in
 * the channel-list panel.
 */
const Section = ({
  children,
  paginator,
  title,
  titleId,
}: PropsWithChildren<{
  paginator: ChannelPaginator;
  title: ReactNode;
  titleId: string;
}>) => {
  const value = useMemo(() => ({ paginator }), [paginator]);

  return (
    <ChannelListContextProvider value={value}>
      <section aria-labelledby={titleId} className='cookbook-channel-section'>
        <h2 className='cookbook-channel-section__title' id={titleId} tabIndex={-1}>
          {title}
        </h2>
        {children}
      </section>
    </ChannelListContextProvider>
  );
};

/** The user's pinned channels. Shows nothing while it loads or has none, unless a query failed. */
const PinnedSection = ({ paginator }: { paginator: ChannelPaginator }) => {
  const titleId = useId();
  const state = useSectionState(paginator);
  const failed = failedWithoutChannels(state);
  if (!failed && !state.items?.length) return null;

  return (
    <Section paginator={paginator} title='Pinned' titleId={titleId}>
      {failed ? (
        <SectionLoadError paginator={paginator} />
      ) : (
        <ChannelRows paginator={paginator} state={state} titleId={titleId} />
      )}
    </Section>
  );
};

/** The rest of the user's channels. */
const InboxSection = ({ paginator }: { paginator: ChannelPaginator }) => {
  const titleId = useId();
  const state = useSectionState(paginator);

  return (
    <Section paginator={paginator} title='Channels' titleId={titleId}>
      {failedWithoutChannels(state) ? (
        <SectionLoadError paginator={paginator} />
      ) : needsFirstPage(paginator) ? (
        <LoadingChannels />
      ) : isEmpty(state) ? (
        <p className='cookbook-channel-section__empty'>No channels</p>
      ) : (
        <ChannelRows paginator={paginator} state={state} titleId={titleId} />
      )}
    </Section>
  );
};

/**
 * The archive, collapsed until the user opens it. Opening it loads the first page, also when an
 * event already put a channel in the paginator.
 */
const ArchivedSection = ({ paginator }: { paginator: ChannelPaginator }) => {
  const { IconArchive, IconChevronDown } = useComponentContextIcons();
  const [open, setOpen] = useState(false);
  const titleId = useId();
  const bodyId = useId();
  const state = useSectionState(paginator, open);

  const toggle = (
    <button
      aria-controls={bodyId}
      aria-expanded={open}
      className='cookbook-channel-section__toggle'
      onClick={() => setOpen(!open)}
      type='button'
    >
      <IconArchive />
      Archived
      <IconChevronDown className='cookbook-channel-section__chevron' />
    </button>
  );

  return (
    <Section paginator={paginator} title={toggle} titleId={titleId}>
      <div id={bodyId}>
        {open &&
          (failedWithoutChannels(state) ? (
            <SectionLoadError paginator={paginator} />
          ) : needsFirstPage(paginator) ? (
            <LoadingIndicator />
          ) : isEmpty(state) ? (
            <p className='cookbook-channel-section__empty'>No archived channels</p>
          ) : (
            <ChannelRows paginator={paginator} state={state} titleId={titleId} />
          ))}
      </div>
    </Section>
  );
};

// One scroll container for every section, in the order of `useChannelSections()`. The archive,
// used least and opened by the user, comes last: opening it or loading more of it pushes none of
// the channels the user works in out of view. The cost is that it sits after every loaded channel.
const Sections = ({ sections }: { sections: ChannelSections }) => (
  <div className='cookbook-channel-sections'>
    <PinnedSection paginator={sections.pinned} />
    <InboxSection paginator={sections.inbox} />
    <ArchivedSection paginator={sections.archived} />
  </div>
);

/**
 * `ChannelNavigation` with the channel list split into Pinned, Channels and a collapsible Archived
 * section that share one scroll, meant to sit inside `ChatView`, which gives it the theme scope.
 * Each section loads its next page only when the user clicks its button. `filters` scope every
 * section to the user's channels; pass a stable object.
 */
export const SectionedChannelNavigation = ({ filters }: { filters: ChannelFilters }) => {
  const {
    ChannelListHeader = DefaultChannelListHeader,
    NotificationList = DefaultNotificationList,
    Search = DefaultSearch,
  } = useComponentContext();
  const { searchController } = useChatContext();
  const { isActive } = useStateStore(searchController.state, searchSelector);
  // Registered here rather than in the sections, so a search keeps what they loaded.
  const sections = useChannelSections(filters);

  return (
    <div className='str-chat__channel-list'>
      <ChannelListHeader />
      <Search />
      {!isActive && sections && <Sections sections={sections} />}
      <NotificationList panel='channel-list' />
    </div>
  );
};
