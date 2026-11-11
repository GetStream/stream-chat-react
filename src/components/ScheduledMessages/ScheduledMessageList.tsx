import React, { useEffect, useMemo } from 'react';
import type {
  ChannelDataState,
  OwnCapabilitiesState,
  PaginatorState,
  ScheduledMessageResponse,
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
import { getChannelByCid, searchScheduledMessages } from './utils';

export type ScheduledMessageListProps = Pick<ScheduledMessageItemProps, 'onEdit'> & {
  /** The channel whose scheduled messages to list; all of them without it. */
  cid?: string;
  parentId?: string;
  /** Lists only the messages whose text contains it. */
  searchQuery?: string;
};

const selectLoadState = (state: PaginatorState<ScheduledMessageResponse>) => ({
  firstPageLoadError: getFirstPageLoadError(state),
  hasMoreTail: state.hasMoreTail,
  isFirstPageLoading: state.items === undefined && !state.lastQueryError,
  isLoading: state.isLoading,
  lastQueryFailed: !!state.lastQueryError,
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

const NoSearchResults = () => {
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

const ScheduledMessageListBody = ({
  cid,
  onEdit,
  parentId,
  searchQuery,
}: ScheduledMessageListProps) => {
  const { t } = useTranslationContext();
  const {
    EmptyListIndicator = DefaultEmptyListIndicator,
    FirstPageLoadingIndicator = DefaultFirstPageLoadingIndicator,
    ListLoadErrorIndicator = DefaultListLoadErrorIndicator,
    LoadingNextPageIndicator = DefaultLoadingNextPageIndicator,
    ScheduledMessageItem = DefaultScheduledMessageItem,
  } = useComponentContext();
  const { paginator, scheduledMessages } = useScheduledMessages({ cid, parentId });
  const {
    firstPageLoadError,
    hasMoreTail,
    isFirstPageLoading,
    isLoading,
    lastQueryFailed,
  } = useStateStore(paginator.state, selectLoadState);
  const firstPageLoadRetry = useFirstPageLoadRetry({
    firstPageLoadError,
    loadedMessage: t('scheduledMessages.loaded', 'Scheduled messages loaded'),
    paginator,
    reload: paginator.reload,
  });
  // in the paginator's order: earliest first, so failed messages, sent in the past, come first
  const shownMessages = useMemo(
    () => searchScheduledMessages(scheduledMessages, searchQuery),
    [scheduledMessages, searchQuery],
  );
  const showsNothing = !isFirstPageLoading && !shownMessages.length;
  // stops at a failed page instead of retrying it
  const loadsFurther = showsNothing && hasMoreTail && !lastQueryFailed;

  // the matches may be on a page not loaded yet
  useEffect(() => {
    if (loadsFurther && !isLoading) paginator.toTail();
  }, [isLoading, loadsFurther, paginator]);

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
  if (showsNothing) {
    if (loadsFurther) return <LoadingNextPageIndicator isLoading />;
    return scheduledMessages.length ? <NoSearchResults /> : <EmptyListIndicator />;
  }

  return (
    <InfiniteScrollPaginator
      className='str-chat__scheduled-message-list'
      data-testid='scheduled-message-list'
      loadNextOnScrollToBottom={paginator.toTail}
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

/**
 * Scheduled messages, earliest first, paginated on scroll.
 * Loading, failing and empty states use the list-state components `ChannelList` uses. Scoping to a
 * thread and searching filter the loaded messages, so further pages load while none of them match.
 */
export const ScheduledMessageList = (props: ScheduledMessageListProps) => (
  <>
    {props.cid && <SchedulingUnavailableNotice cid={props.cid} />}
    <ScheduledMessageListBody {...props} />
  </>
);
