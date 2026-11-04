import { useEffect, useState } from 'react';
import type { MouseEvent } from 'react';
import { nsToDate } from 'stream-chat';
import type {
  PaginatorState,
  ReminderManager,
  ReminderResponseData,
  ReminderState,
} from 'stream-chat';
import {
  Button,
  LoadingIndicator,
  LoadMoreButton,
  useChatContext,
  useComponentContextIcons,
  useMessageReminder,
  useStateStore,
  useWorkspaceNavigation,
} from 'stream-chat-react';
import './SavedItems.css';

/** Which of the user's saved messages the panel lists. */
type Kind = 'reminders' | 'saved';

const KINDS: { kind: Kind; label: string }[] = [
  { kind: 'reminders', label: 'Reminders' },
  { kind: 'saved', label: 'Saved' },
];

/**
 * Points the client's one reminder paginator at one kind and loads its first page. Setting
 * `filters` or `sort` empties the paginator, so the new kind starts from its first page.
 */
const showKind = (reminders: ReminderManager, kind: Kind) => {
  const { paginator } = reminders;
  if (kind === 'reminders') {
    // Reminders have a time: the next one due first, so overdue ones lead.
    paginator.filters = { remind_at: { $exists: true } };
    paginator.sort = [{ direction: 1, field: 'remind_at' }];
  } else {
    // Saved for later has no time: the most recently saved first.
    paginator.filters = { remind_at: { $exists: false } };
    paginator.sort = [{ direction: -1, field: 'created_at' }];
  }
  void reminders.queryNextReminders();
};

const paginatorSelector = ({
  hasMoreTail,
  isLoading,
  items,
  lastQueryError,
}: PaginatorState<ReminderResponseData>) => ({
  hasMoreTail,
  isLoading,
  items,
  lastQueryError,
});

type ListState = ReturnType<typeof paginatorSelector>;

/** The first page failed, so there is nothing to list. A failed later page keeps what loaded. */
const failedToLoad = ({ items, lastQueryError }: ListState) =>
  !!lastQueryError && !items?.length;

/** The first page hasn't arrived yet: the paginator has no `items` before its first query ends. */
const isFirstLoad = ({ items }: ListState) => !items;

const timeLeftSelector = ({ timeLeftMs }: ReminderState) => ({ timeLeftMs });

/** The reminder's time has passed. `timeLeftMs` goes negative then, and is `null` without a time. */
const isOverdue = (timeLeftMs: number | null | undefined) =>
  timeLeftMs != null && timeLeftMs <= 0;

// Date and 24-hour time. The panel's own text is English, so its dates are too.
const timeFormat = new Intl.DateTimeFormat('en-US', {
  day: 'numeric',
  hour: '2-digit',
  hourCycle: 'h23',
  minute: '2-digit',
  month: 'short',
  year: 'numeric',
});

/**
 * The channel's name from the query's copy of it. The reminder's channel may not be loaded, so
 * there's no `Channel` to name with `useChannelDisplayName()`.
 */
const channelNameOf = ({ channel }: ReminderResponseData) => {
  const name = channel && 'name' in channel.custom ? channel.custom.name : undefined;
  return typeof name === 'string' ? name : channel?.id;
};

/** Opens the message's channel in the layout and scrolls to the message. */
const useOpenSavedMessage = () => {
  const { channelManager, client } = useChatContext();
  const { openChannel } = useWorkspaceNavigation();

  return (item: ReminderResponseData, event: MouseEvent) => {
    if (!item.channel) return;
    // The channel the client holds, or a new instance for one it hasn't loaded yet. It replaces a
    // channel that is being disposed, so the one it returns can always be opened.
    const channel = client.channel(item.channel.type, item.channel.id);
    openChannel(channel, { event });
    channelManager.ingestChannel(channel);
    // Highlights the message, loading the page around it and watching the channel when needed.
    channel.messagePaginator
      .jumpToMessage(item.message_id, { watchChannel: true })
      .catch((error: Error) =>
        client.notifications.addError({
          message: 'Failed to load the channel',
          options: { originalError: error },
          origin: { context: { panel: 'channel' }, emitter: 'SavedItems' },
        }),
      );
  };
};

/** Deletes the reminder, then drops it from the list, which only changes on its own queries. */
const useRemoveSavedMessage = () => {
  const { client } = useChatContext();

  return async (messageId: string) => {
    try {
      await client.reminders.deleteReminder(messageId);
      client.reminders.paginator.removeItem({ id: messageId });
    } catch (error) {
      client.notifications.addError({
        message: 'Failed to remove the saved message',
        options: { originalError: error as Error },
        origin: { context: { panel: 'channel' }, emitter: 'SavedItems' },
      });
    }
  };
};

type SavedItemProps = {
  /** Takes focus when it renders, as the first item of a page Load more fetched. */
  autoFocus?: boolean;
  item: ReminderResponseData;
};

/** One saved message: who wrote it, where, its text, and its time when it has one. */
const SavedItem = ({ autoFocus, item }: SavedItemProps) => {
  const { IconBookmarkRemove, IconCheckmark } = useComponentContextIcons();
  const openSavedMessage = useOpenSavedMessage();
  const removeSavedMessage = useRemoveSavedMessage();
  // The manager's `Reminder` for the message, whose timer keeps `timeLeftMs` current.
  const reminder = useMessageReminder(item.message_id);
  const { timeLeftMs } = useStateStore(reminder?.state, timeLeftSelector) ?? {};
  const overdue = isOverdue(timeLeftMs);

  const author = item.message?.user?.name ?? item.message?.user?.id;
  const channelName = channelNameOf(item);
  const remindAt = item.remind_at != null ? nsToDate(item.remind_at) : undefined;
  const actionLabel = remindAt ? 'Mark done' : 'Remove';

  return (
    <li className='cookbook-saved-item' data-overdue={overdue || undefined}>
      <button
        autoFocus={autoFocus}
        className='cookbook-saved-item__open'
        data-message-id={item.message_id}
        onClick={(event) => openSavedMessage(item, event)}
        type='button'
      >
        <span className='cookbook-saved-item__header'>
          <span className='cookbook-saved-item__author'>{author}</span>
          <span className='cookbook-saved-item__channel'>{channelName}</span>
        </span>
        <span className='cookbook-saved-item__text'>{item.message?.text}</span>
        {remindAt && (
          <span className='cookbook-saved-item__due'>
            {overdue && <span className='cookbook-saved-item__overdue'>Overdue</span>}
            <time dateTime={remindAt.toISOString()}>{timeFormat.format(remindAt)}</time>
          </span>
        )}
      </button>
      <Button
        appearance='ghost'
        aria-label={`${actionLabel}: ${author} in ${channelName}`}
        circular
        className='cookbook-saved-item__action'
        onClick={() => void removeSavedMessage(item.message_id)}
        size='sm'
        title={actionLabel}
        variant='secondary'
      >
        {remindAt ? <IconCheckmark /> : <IconBookmarkRemove />}
      </Button>
    </li>
  );
};

/**
 * The side panel's body: the user's reminders or the messages they saved for later, one kind at a
 * time from the client's reminder paginator. Load more fetches the next page.
 */
export const SavedItems = () => {
  const { client } = useChatContext();
  const { reminders } = client;
  const state = useStateStore(reminders.paginator.state, paginatorSelector);
  const [kind, setKind] = useState<Kind>('reminders');
  // The index of the first item Load more fetches, which takes focus from the button it disables.
  const [focusIndex, setFocusIndex] = useState<number>();

  useEffect(() => {
    setFocusIndex(undefined);
    showKind(reminders, kind);
  }, [kind, reminders]);

  const renderList = () => {
    if (failedToLoad(state)) {
      return (
        <div className='cookbook-saved-items__note' role='alert'>
          <p>Couldn’t load your saved messages.</p>
          <Button
            appearance='outline'
            onClick={() => showKind(reminders, kind)}
            size='sm'
            variant='secondary'
          >
            Try again
          </Button>
        </div>
      );
    }
    if (isFirstLoad(state)) return <LoadingIndicator />;
    if (!state.items?.length) {
      return (
        <p className='cookbook-saved-items__note'>
          {kind === 'reminders'
            ? 'No reminders. Pick Remind me in a message’s menu to set one.'
            : 'Nothing saved. Pick Save for later in a message’s menu to keep one here.'}
        </p>
      );
    }
    return (
      <>
        <ul className='cookbook-saved-items__list'>
          {state.items.map((item, index) => (
            <SavedItem
              autoFocus={index === focusIndex}
              item={item}
              key={item.message_id}
            />
          ))}
        </ul>
        {state.hasMoreTail && (
          <LoadMoreButton
            isLoading={state.isLoading}
            onClick={() => {
              setFocusIndex(state.items?.length);
              void reminders.queryNextReminders();
            }}
          />
        )}
      </>
    );
  };

  return (
    <div className='cookbook-saved-items'>
      <div aria-label='Show' className='cookbook-saved-items__kinds' role='group'>
        {KINDS.map(({ kind: option, label }) => (
          <Button
            appearance='outline'
            aria-pressed={kind === option}
            className='cookbook-saved-items__kind'
            key={option}
            onClick={() => setKind(option)}
            size='xs'
            variant='secondary'
          >
            {label}
          </Button>
        ))}
      </div>
      {renderList()}
    </div>
  );
};
