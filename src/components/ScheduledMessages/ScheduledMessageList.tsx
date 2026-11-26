import React, { useEffect, useMemo, useRef } from 'react';
import type { ComponentType } from 'react';
import type {
  ChannelDataState,
  PaginatorState,
  ScheduledMessageResponse,
  ScheduledMessagesView,
} from 'stream-chat';

import {
  useChatContext,
  useComponentContext,
  useTranslationContext,
} from '../../context';
import { useStateStore } from '../../store';
import { useChannelCapabilities } from '../Channel/hooks/useChannelCapabilities';
import { InfiniteScrollPaginator } from '../InfiniteScrollPaginator';
import { useFirstPageLoadRetry } from '../ListStates/hooks';
import { getFirstPageLoadError } from '../ListStates/utils';
import { SCHEDULE_MESSAGE_CAPABILITY } from './constants';
import { useScheduledMessages } from './hooks';
import {
  ScheduledMessageListEmptySearchResults,
  ScheduledMessageListEmptyUI,
  ScheduledMessageListFirstPageLoadingUI,
  ScheduledMessageListLoadErrorUI,
  ScheduledMessageListLoadingNextPageUI,
} from './ListStates';
import type { ScheduledMessageItemProps } from './ScheduledMessageItem';
import { ScheduledMessageItem as DefaultScheduledMessageItem } from './ScheduledMessageItem';
import { ScheduledMessagesNotice } from './ScheduledMessagesNotice';
import { getChannelByCid } from './utils';

export type ScheduledMessageListProps = Pick<
  ScheduledMessageItemProps,
  'openInComposer'
> & {
  /**
   * What to list: `channel.scheduledMessages`, `thread.scheduledMessages`, or a view of a list
   * registered with `client.scheduledMessagePaginators`. Further pages load on scroll. When its
   * paginator is a channel's, the list also says why the channel takes no scheduled messages, if
   * it doesn't. Its loading, empty and error states are the `ListFirstPageLoadingUI`,
   * `ListEmptyUI`, `ListLoadingNextPageUI` and `ListLoadErrorUI` slots.
   */
  scheduledMessages: ScheduledMessagesView;
  /** Lists only the messages it accepts, e.g. the search from `useScheduledMessagesSearch`. */
  filter?: (scheduledMessage: ScheduledMessageResponse) => boolean;
  /** Messages are scheduled, but none match the search. */
  EmptySearchResultsIndicator?: ComponentType;
};

const selectLoadState = (state: PaginatorState<ScheduledMessageResponse>) => ({
  firstPageLoadError: getFirstPageLoadError(state),
  hasMoreTail: state.hasMoreTail,
  isFirstPageLoading: state.items === undefined && !state.lastQueryError,
  isLoading: state.isLoading,
  lastQueryError: state.lastQueryError,
});

const selectFrozen = ({ data }: ChannelDataState) => ({ frozen: !!data?.frozen });

/** Why the channel takes no scheduled messages: frozen, or the user is not allowed to. */
const SchedulingUnavailableNotice = ({ cid }: { cid: string }) => {
  const { t } = useTranslationContext();
  const { client } = useChatContext();
  const channel = getChannelByCid(client, cid);
  const capabilities = useChannelCapabilities({ channel });
  const { frozen } = useStateStore(channel.state, selectFrozen);

  if (capabilities.has(SCHEDULE_MESSAGE_CAPABILITY)) return null;

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
  EmptySearchResultsIndicator = ScheduledMessageListEmptySearchResults,
  filter,
  openInComposer,
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
        <ScheduledMessageListLoadErrorUI
          error={firstPageLoadRetry.error}
          isRetrying={firstPageLoadRetry.isRetrying}
          retry={firstPageLoadRetry.retry}
        />
      );
    }
    if (isFirstPageLoading) return <ScheduledMessageListFirstPageLoadingUI />;
    if (loadsFurther) {
      return <ScheduledMessageListLoadingNextPageUI isLoading position='bottom' />;
    }
    if (furtherPageLoadError) {
      return (
        <ScheduledMessageListLoadErrorUI
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
        <ScheduledMessageListEmptyUI />
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
              <ScheduledMessageItem
                openInComposer={openInComposer}
                scheduledMessage={scheduledMessage}
              />
            </li>
          ))}
        </ul>
        <ScheduledMessageListLoadingNextPageUI isLoading={isLoading} position='bottom' />
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
