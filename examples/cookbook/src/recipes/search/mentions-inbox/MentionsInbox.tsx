import { useEffect, useMemo, useState } from 'react';
import type { MouseEvent } from 'react';
import { formatMessage, MessageSearchSource } from 'stream-chat';
import type { MessageResponse, SearchSourceState, StreamChat } from 'stream-chat';
import {
  Button,
  getRenderTextMentionEntities,
  LoadingIndicator,
  LoadMoreButton,
  MessageTimestamp,
  renderText,
  useChannelDisplayName,
  useChatContext,
  useStateStore,
  useWorkspaceNavigation,
} from 'stream-chat-react';
import './MentionsInbox.css';

/** The messages that mention the user, newest first, a few at a time. */
const createMentionsSource = (client: StreamChat) =>
  new MessageSearchSource(client, {
    // There's no search text: the filter alone picks the messages.
    allowEmptySearchString: true,
    // Nothing is typed, so the source queries right away.
    debounceMs: 0,
    messageSearchFilters: {
      'mentioned_users.id': { $contains: client.userId ?? '' },
    },
    pageSize: 3,
  });

const sourceSelector = ({
  hasNext,
  isLoading,
  items,
  lastQueryError,
}: SearchSourceState<MessageResponse>) => ({
  hasNext,
  isLoading,
  items,
  lastQueryError,
});

type MentionsState = ReturnType<typeof sourceSelector>;

/** The first page failed, so there is nothing to list. A failed later page keeps what loaded. */
const failedToLoad = ({ items, lastQueryError }: MentionsState) =>
  !!lastQueryError && !items?.length;

/** The first page hasn't arrived yet: a source has no `items` before its first query ends. */
const isFirstLoad = ({ items }: MentionsState) => !items;

// Inline formatting, emoji and mentions only, and no links: the text sits inside the item's button.
const allowedTagNames = ['em', 'strong', 'code', 'del', 'emoji', 'mention'];

/** Opens the message's channel in the layout and scrolls to the message. */
const useOpenMention = () => {
  const { channelManager, client } = useChatContext();
  const { openChannel } = useWorkspaceNavigation();

  return (message: MessageResponse, event: MouseEvent) => {
    // Message search stores every result's channel.
    const channel = message.cid ? channelManager.get(message.cid) : undefined;
    if (!channel || channel.pendingDisposal) return;
    openChannel(channel, { event });
    channelManager.ingestChannel(channel);
    // Highlights the message, loading the page around it and watching the channel when needed.
    channel.messagePaginator
      .jumpToMessage(message.id, { watchChannel: true })
      .catch((error: Error) =>
        client.notifications.addError({
          message: 'Failed to load the channel',
          options: { originalError: error },
          origin: { emitter: 'MentionsInbox' },
        }),
      );
  };
};

type MentionProps = {
  /** Takes focus when it renders, as the first item of a page Load more fetched. */
  autoFocus?: boolean;
  message: MessageResponse;
};

/** One mention: who wrote it, where and when, and the text with the mention highlighted. */
const Mention = ({ autoFocus, message }: MentionProps) => {
  const { channelManager } = useChatContext();
  const openMention = useOpenMention();
  const channel = message.cid ? channelManager.get(message.cid) : undefined;
  const channelName = useChannelDisplayName(channel);
  // Search returns the server's message; the SDK's components take the client's form of it.
  const localMessage = useMemo(() => formatMessage(message), [message]);

  return (
    <li>
      <button
        autoFocus={autoFocus}
        className='cookbook-mention'
        data-message-id={message.id}
        onClick={(event) => openMention(message, event)}
        type='button'
      >
        <span className='cookbook-mention__header'>
          <span className='cookbook-mention__author'>
            {message.user?.name ?? message.user?.id}
          </span>
          <span className='cookbook-mention__channel'>{channelName}</span>
          <MessageTimestamp
            calendar
            customClass='cookbook-mention__time'
            message={localMessage}
          />
        </span>
        <span className='cookbook-mention__text'>
          {renderText(localMessage.text, undefined, {
            allowedTagNames,
            messageMentionEntities: getRenderTextMentionEntities(localMessage),
          })}
        </span>
      </button>
    </li>
  );
};

/**
 * The side panel's body: the messages that mention the user. It searches once when it opens, and
 * Load more fetches the next page.
 */
export const MentionsInbox = () => {
  const { client } = useChatContext();
  const [source] = useState(() => createMentionsSource(client));
  const state = useStateStore(source.state, sourceSelector);
  // The index of the first item Load more fetches, which takes focus from the button it disables.
  const [focusIndex, setFocusIndex] = useState<number>();

  useEffect(() => {
    source.activate();
    void source.search('');
    // Closing the panel drops a scheduled search and aborts the one in flight.
    return () => {
      source.cancelScheduledQuery();
      source.deactivate();
    };
  }, [source]);

  if (failedToLoad(state)) {
    return (
      <div className='cookbook-mentions__note' role='alert'>
        <p>Couldn’t load your mentions.</p>
        <Button
          appearance='outline'
          onClick={() => void source.search('')}
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
    return <p className='cookbook-mentions__note'>No one has mentioned you yet.</p>;
  }

  return (
    <div className='cookbook-mentions'>
      <ul className='cookbook-mentions__list'>
        {state.items.map((message, index) => (
          <Mention autoFocus={index === focusIndex} key={message.id} message={message} />
        ))}
      </ul>
      {state.hasNext && (
        <LoadMoreButton
          isLoading={state.isLoading}
          onClick={() => {
            setFocusIndex(state.items?.length);
            void source.search();
          }}
        />
      )}
    </div>
  );
};
