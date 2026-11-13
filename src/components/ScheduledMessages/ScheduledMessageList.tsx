import React, { useEffect, useMemo, useRef } from 'react';
import type { ComponentType } from 'react';
import type {
  ChannelDataState,
  OwnCapabilitiesState,
  PaginatorState,
  ScheduledMessageResponse,
  ScheduledMessagesView,
} from 'stream-chat';

import {
  useChatContext,
  useComponentContext,
  useComponentContextIcons,
  useTranslationContext,
} from '../../context';
import { useStateStore } from '../../store';
import { EmptyStateIndicator } from '../EmptyStateIndicator';
import { InfiniteScrollPaginator } from '../InfiniteScrollPaginator';
import {
  ListLoadErrorIndicator as BaseListLoadErrorIndicator,
  LoadingIndicator,
} from '../Loading';
import type { ListLoadErrorIndicatorProps } from '../Loading';
import { getFirstPageLoadError } from '../Loading/getFirstPageLoadError';
import { useFirstPageLoadRetry } from '../Loading/hooks/useFirstPageLoadRetry';
import { SCHEDULE_MESSAGE_CAPABILITY, useScheduledMessages } from './hooks';
import type { ScheduledMessageItemProps } from './ScheduledMessageItem';
import { ScheduledMessageItem as DefaultScheduledMessageItem } from './ScheduledMessageItem';
import { ScheduledMessagesNotice } from './ScheduledMessagesNotice';
import { getChannelByCid } from './utils';

export type ScheduledMessageListProps = Pick<ScheduledMessageItemProps, 'onEdit'> & {
  /**
   * What to list: `channel.scheduledMessages`, `thread.scheduledMessages`, or a view of a list
   * registered with `client.scheduledMessagePaginators`. Further pages load on scroll. When its
   * paginator is a channel's, the list also says why the channel takes no scheduled messages, if
   * it doesn't.
   */
  scheduledMessages: ScheduledMessagesView;
  /** Lists only the messages it accepts, e.g. the search from `useScheduledMessagesSearch`. */
  filter?: (scheduledMessage: ScheduledMessageResponse) => boolean;
  /** Nothing is scheduled. */
  EmptyListIndicator?: ComponentType;
  /** Messages are scheduled, but none match the search. */
  EmptySearchResultsIndicator?: ComponentType;
  FirstPageLoadingIndicator?: ComponentType;
  ListLoadErrorIndicator?: ComponentType<ListLoadErrorIndicatorProps>;
  LoadingNextPageIndicator?: ComponentType<{ isLoading?: boolean }>;
};

const selectLoadState = (state: PaginatorState<ScheduledMessageResponse>) => ({
  firstPageLoadError: getFirstPageLoadError(state),
  hasMoreTail: state.hasMoreTail,
  isFirstPageLoading: state.items === undefined && !state.lastQueryError,
  isLoading: state.isLoading,
  lastQueryError: state.lastQueryError,
});

const DefaultListLoadErrorIndicator = (props: ListLoadErrorIndicatorProps) => (
  <BaseListLoadErrorIndicator {...props} listType='scheduled-message' />
);

const DefaultEmptyListIndicator = () => (
  <EmptyStateIndicator listType='scheduled-message' />
);

const DefaultFirstPageLoadingIndicator = () => {
  const { t } = useTranslationContext();
  return (
    <div
      aria-label={t(
        'scheduledMessages.loadingScheduledMessages',
        'Loading scheduled messages',
      )}
      className='str-chat__scheduled-message-list-loading'
      role='status'
    >
      <LoadingIndicator />
    </div>
  );
};

const DefaultLoadingNextPageIndicator = ({ isLoading }: { isLoading?: boolean }) =>
  isLoading ? <LoadingIndicator /> : null;

const DefaultEmptySearchResultsIndicator = () => {
  const { t } = useTranslationContext();
  const { IconSearch } = useComponentContextIcons();
  return (
    <div className='str-chat__scheduled-messages-empty-list'>
      <IconSearch className='str-chat__scheduled-messages-empty-list__icon' />
      <p className='str-chat__scheduled-messages-empty-list__title'>
        {t('scheduledMessages.noMessagesFound', 'No messages found')}
      </p>
    </div>
  );
};

const selectScheduling = ({
  data,
  ownCapabilities,
}: ChannelDataState & OwnCapabilitiesState) => ({
  // unknown until the channel is loaded
  canSchedule:
    ownCapabilities === undefined ||
    ownCapabilities.includes(SCHEDULE_MESSAGE_CAPABILITY),
  frozen: !!data?.frozen,
});

/** Why the channel takes no scheduled messages: frozen, or the user is not allowed to. */
const SchedulingUnavailableNotice = ({ cid }: { cid: string }) => {
  const { t } = useTranslationContext();
  const { client } = useChatContext();
  const channel = getChannelByCid(client, cid);
  const { canSchedule, frozen } = useStateStore(channel.state, selectScheduling);
  if (canSchedule) return null;
  return (
    <ScheduledMessagesNotice className='str-chat__scheduled-message-list-notice' isError>
      {frozen
        ? t(
            'scheduledMessages.channelFrozenNotice',
            "This channel is frozen. Scheduled messages won't be sent",
          )
        : t(
            'scheduledMessages.schedulingUnavailableNotice',
            "You can't schedule messages in this channel",
          )}
    </ScheduledMessagesNotice>
  );
};

/**
 * A scheduled-message view's messages, earliest first, loading further pages on scroll, with their
 * list states. A view of a thread and a `filter` (searching) narrow its paginator's loaded
 * messages, so while none of
 * them are shown and more pages exist, the list loads the next one: with nothing shown there is
 * nothing to scroll, and the messages to show may be on a page not loaded yet.
 */
export const ScheduledMessageList = ({
  EmptyListIndicator = DefaultEmptyListIndicator,
  EmptySearchResultsIndicator = DefaultEmptySearchResultsIndicator,
  filter,
  FirstPageLoadingIndicator = DefaultFirstPageLoadingIndicator,
  ListLoadErrorIndicator = DefaultListLoadErrorIndicator,
  LoadingNextPageIndicator = DefaultLoadingNextPageIndicator,
  onEdit,
  scheduledMessages: view,
}: ScheduledMessageListProps) => {
  const { ScheduledMessageItem = DefaultScheduledMessageItem } = useComponentContext();
  const { paginator } = view;
  const { scheduledMessages } = useScheduledMessages(view);
  const shownMessages = useMemo(
    () => (filter ? scheduledMessages.filter(filter) : scheduledMessages),
    [filter, scheduledMessages],
  );
  const { t } = useTranslationContext();
  const {
    firstPageLoadError,
    hasMoreTail,
    isFirstPageLoading,
    isLoading,
    lastQueryError,
  } = useStateStore(paginator.state, selectLoadState);
  const firstPageLoadRetry = useFirstPageLoadRetry({
    firstPageLoadError,
    loadedMessage: t('scheduledMessages.loaded', 'Scheduled messages loaded'),
    paginator,
    reload: paginator.reload,
  });
  const showsNothing = !isFirstPageLoading && !shownMessages.length;
  // stops at a failed page instead of retrying it
  const loadsFurther = showsNothing && hasMoreTail && !lastQueryError;
  // nothing matches so far, and the page that might have was not loaded
  const furtherPageLoadError =
    showsNothing && hasMoreTail && lastQueryError ? lastQueryError : undefined;

  useEffect(() => {
    if (loadsFurther && !isLoading) view.toTail();
  }, [isLoading, loadsFurther, view]);

  // A page that adds nothing to show changes nothing on screen, so no scroll or resize asks for
  // the next one: it is loaded here instead, until a page shows something or none is left.
  const shownCountAtLoadStartRef = useRef<number | undefined>(undefined);
  useEffect(() => {
    if (isLoading) {
      shownCountAtLoadStartRef.current ??= shownMessages.length;
      return;
    }
    const shownCountAtLoadStart = shownCountAtLoadStartRef.current;
    shownCountAtLoadStartRef.current = undefined;
    if (
      shownCountAtLoadStart !== undefined &&
      !showsNothing &&
      shownMessages.length === shownCountAtLoadStart &&
      hasMoreTail &&
      !lastQueryError
    ) {
      view.toTail();
    }
  }, [hasMoreTail, isLoading, lastQueryError, shownMessages.length, showsNothing, view]);

  const renderContent = () => {
    if (firstPageLoadRetry.error) {
      return (
        <ListLoadErrorIndicator
          error={firstPageLoadRetry.error}
          isRetrying={firstPageLoadRetry.isRetrying}
          retry={firstPageLoadRetry.retry}
        />
      );
    }
    if (isFirstPageLoading) return <FirstPageLoadingIndicator />;
    if (loadsFurther) return <LoadingNextPageIndicator isLoading />;
    if (furtherPageLoadError) {
      return (
        <ListLoadErrorIndicator
          error={furtherPageLoadError}
          isRetrying={isLoading}
          retry={view.toTail}
        />
      );
    }
    if (showsNothing) {
      // some are scheduled, but the filter accepts none of them
      return scheduledMessages.length ? (
        <EmptySearchResultsIndicator />
      ) : (
        <EmptyListIndicator />
      );
    }
    return (
      <InfiniteScrollPaginator
        className='str-chat__scheduled-message-list'
        data-testid='scheduled-message-list'
        loadNextOnScrollToBottom={view.toTail}
      >
        <ul className='str-chat__scheduled-message-list__items'>
          {shownMessages.map((scheduledMessage) => (
            <li
              className='str-chat__scheduled-message-list__item'
              key={scheduledMessage.id}
            >
              <ScheduledMessageItem onEdit={onEdit} scheduledMessage={scheduledMessage} />
            </li>
          ))}
        </ul>
        <LoadingNextPageIndicator isLoading={isLoading} />
      </InfiniteScrollPaginator>
    );
  };

  return (
    <>
      {paginator.cid && <SchedulingUnavailableNotice cid={paginator.cid} />}
      {renderContent()}
    </>
  );
};
