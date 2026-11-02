import { useCallback, useEffect, useState } from 'react';
import { flushSync } from 'react-dom';
import { convertTimestampToDate } from 'stream-chat';
import type { DraftResponse } from 'stream-chat';
import {
  Button,
  LoadingIndicator,
  LoadMoreButton,
  useChannelDisplayName,
  useChatContext,
  useComponentContextIcons,
  useNotificationApi,
  useWorkspaceNavigation,
} from 'stream-chat-react';
import './DraftsList.css';

const PAGE_SIZE = 3;

// Day and 24-hour time, like the message list's timestamps.
const timeFormat = new Intl.DateTimeFormat('en-US', {
  day: 'numeric',
  hour: '2-digit',
  hourCycle: 'h23',
  minute: '2-digit',
  month: 'short',
});

/** A thread's draft names the message that started the thread; a channel's draft names none. */
const isThreadDraft = (draft: DraftResponse) => !!draft.parent_id;

/** Each channel and each thread holds at most one draft, so the two ids name a draft. */
const isSameDraft = (a: DraftResponse, b: DraftResponse) =>
  a.channel_cid === b.channel_cid && a.parent_id === b.parent_id;

/** The key a list item and the screenshots know a draft by. */
const draftKey = (draft: DraftResponse) =>
  `${draft.channel_cid}/${draft.parent_id ?? ''}`;

type DraftsState = {
  drafts?: DraftResponse[];
  error?: Error;
  isLoading: boolean;
  /** The cursor of the next page; none when the last page has loaded. */
  next?: string;
};

/**
 * The user's drafts across channels and threads, newest first, a page at a time. `draft.updated`
 * and `draft.deleted` keep the loaded ones current, for example when the user leaves a channel
 * and its composer saves a draft.
 */
const useDrafts = () => {
  const { client } = useChatContext();
  const [state, setState] = useState<DraftsState>({ isLoading: true });

  /** Loads the first page, or the page after `next`, which is added to the loaded ones. */
  const load = useCallback(
    (next?: string) => {
      setState((current) => ({ ...current, error: undefined, isLoading: true }));
      client
        .queryDrafts({
          limit: PAGE_SIZE,
          next,
          sort: [{ direction: -1, field: 'created_at' }],
        })
        .then((page) =>
          setState((current) => ({
            drafts: [...(next ? (current.drafts ?? []) : []), ...page.drafts],
            isLoading: false,
            next: page.next,
          })),
        )
        .catch((error: Error) =>
          setState((current) => ({ ...current, error, isLoading: false })),
        );
    },
    [client],
  );

  /** Takes a draft out of the list: it was sent, cleared or deleted. */
  const remove = useCallback(
    (gone: DraftResponse) =>
      setState((current) => ({
        ...current,
        drafts: current.drafts?.filter((draft) => !isSameDraft(draft, gone)),
      })),
    [],
  );

  useEffect(() => load(), [load]);

  useEffect(() => {
    // A saved draft moves to the top, in place of the one it replaces.
    const updated = client.on('draft.updated', ({ draft }) => {
      if (!draft) return;
      setState((current) => ({
        ...current,
        drafts: [
          draft,
          ...(current.drafts ?? []).filter((loaded) => !isSameDraft(loaded, draft)),
        ],
      }));
    });
    const deleted = client.on('draft.deleted', ({ draft }) => draft && remove(draft));
    return () => {
      updated.unsubscribe();
      deleted.unsubscribe();
    };
  }, [client, remove]);

  return { ...state, load, remove };
};

/** Puts focus in the composer of the open channel or thread, found by the SDK's class for it. */
const focusComposerIn = (container: 'str-chat__channel' | 'str-chat__thread') =>
  document.querySelector<HTMLTextAreaElement>(`.${container} textarea`)?.focus();

/**
 * Opens the draft's channel, and its thread for a thread's draft, puts focus in that composer and
 * loads the draft into it.
 */
const useOpenDraft = () => {
  const { client } = useChatContext();
  const { addNotification } = useNotificationApi();
  const { openChannel, openThread } = useWorkspaceNavigation();

  return async (draft: DraftResponse) => {
    const [type, id] = draft.channel_cid.split(':');
    try {
      const channel = await client.channel(type, id).watch();
      // flushSync renders what opens right away, so its composer is there to take focus.
      flushSync(() => openChannel(channel));
      let composer = channel.messageComposer;
      if (draft.parent_id) {
        const parentMessage =
          draft.parent_message ??
          (await client.getMessage({ id: draft.parent_id })).message;
        const thread = client.threads.ensure({ channel, parentMessage });
        flushSync(() => openThread(thread));
        composer = thread.messageComposer;
      }
      focusComposerIn(draft.parent_id ? 'str-chat__thread' : 'str-chat__channel');
      // A composer is emptied when it closes, and a loaded channel isn't queried again, so the
      // composer fetches its draft itself.
      await composer.getDraft();
    } catch (error) {
      addNotification({
        emitter: 'DraftsList',
        error: error as Error,
        message: 'Failed to open the draft',
        severity: 'error',
        // The side panel has no notification list, so the channel beside it shows the error.
        targetPanels: ['channel'],
      });
    }
  };
};

type DraftProps = {
  /** Takes focus when it renders, as the first item of a page Load more fetched. */
  autoFocus?: boolean;
  draft: DraftResponse;
  onDeleted: (draft: DraftResponse) => void;
};

/** One draft: where it is, when it was last saved, its text, and a button that deletes it. */
const Draft = ({ autoFocus, draft, onDeleted }: DraftProps) => {
  const { client } = useChatContext();
  const { addNotification } = useNotificationApi();
  const { IconDelete } = useComponentContextIcons();
  const openDraft = useOpenDraft();
  const [type, id] = draft.channel_cid.split(':');
  const channel = client.channel(type, id);
  const channelName = useChannelDisplayName(channel);
  const where = isThreadDraft(draft) ? `Thread in ${channelName}` : channelName;
  const savedAt = convertTimestampToDate(draft.created_at);

  const deleteDraft = () =>
    channel
      .deleteDraft({ parent_id: draft.parent_id })
      .then(() => onDeleted(draft))
      .catch((error: Error) =>
        addNotification({
          emitter: 'DraftsList',
          error,
          message: 'Failed to delete the draft',
          severity: 'error',
          targetPanels: ['channel'],
        }),
      );

  return (
    <li className='cookbook-draft'>
      <button
        autoFocus={autoFocus}
        className='cookbook-draft__open'
        data-draft-key={draftKey(draft)}
        onClick={() => void openDraft(draft)}
        type='button'
      >
        <span className='cookbook-draft__header'>
          <span className='cookbook-draft__where'>{where}</span>
          {savedAt && (
            <time className='cookbook-draft__time' dateTime={savedAt.toISOString()}>
              {timeFormat.format(savedAt)}
            </time>
          )}
        </span>
        {draft.parent_message && (
          <span className='cookbook-draft__parent'>{draft.parent_message.text}</span>
        )}
        <span className='cookbook-draft__text'>{draft.message.text}</span>
      </button>
      <Button
        appearance='ghost'
        aria-label={`Delete draft: ${where}`}
        circular
        className='cookbook-draft__delete'
        onClick={deleteDraft}
        size='sm'
        variant='secondary'
      >
        <IconDelete />
      </Button>
    </li>
  );
};

/**
 * The side panel's body: the user's unsent drafts. Clicking one opens it in its channel or thread;
 * Load more fetches the next page.
 */
export const DraftsList = () => {
  const { drafts, error, isLoading, load, next, remove } = useDrafts();
  // The index of the first item Load more fetches, which takes focus from the button it disables.
  const [focusIndex, setFocusIndex] = useState<number>();

  if (error && !drafts?.length) {
    return (
      <div className='cookbook-drafts__note' role='alert'>
        <p>Couldn’t load your drafts.</p>
        <Button appearance='outline' onClick={() => load()} size='sm' variant='secondary'>
          Try again
        </Button>
      </div>
    );
  }
  if (!drafts) return <LoadingIndicator />;
  if (!drafts.length) {
    return (
      <p className='cookbook-drafts__note'>No drafts. Unsent messages show up here.</p>
    );
  }

  return (
    <div className='cookbook-drafts'>
      <ul className='cookbook-drafts__list'>
        {drafts.map((draft, index) => (
          <Draft
            autoFocus={index === focusIndex}
            draft={draft}
            key={draftKey(draft)}
            onDeleted={remove}
          />
        ))}
      </ul>
      {next && (
        <LoadMoreButton
          isLoading={isLoading}
          onClick={() => {
            setFocusIndex(drafts.length);
            load(next);
          }}
        />
      )}
    </div>
  );
};
