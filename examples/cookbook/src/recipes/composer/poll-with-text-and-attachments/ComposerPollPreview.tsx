import { useEffect, useState } from 'react';
import type { MessageComposerState, Poll, PollState } from 'stream-chat';
import {
  MessageComposerUI,
  RemoveAttachmentPreviewButton,
  useChatContext,
  useMessageComposerController,
  useStateStore,
} from 'stream-chat-react';
import { removePendingPoll } from './removePendingPoll';
import './ComposerPollPreview.css';

const composerPollSelector = ({ editedMessage, pollId }: MessageComposerState) => ({
  editedMessage,
  pollId,
});
const pollPreviewSelector = ({ name, options }: PollState) => ({ name, options });

/**
 * The poll `pollId` points to. `createPoll()` puts the created poll into `client.polls`; a poll
 * restored from a draft may not be there yet, so it's fetched once.
 */
const usePendingPoll = (pollId: string | null) => {
  const { client } = useChatContext();
  const cachedPoll = pollId ? client.polls.fromState(pollId) : undefined;
  const [fetchedPoll, setFetchedPoll] = useState<Poll>();

  useEffect(() => {
    if (!pollId || cachedPoll) return;
    let isCurrent = true;
    client.polls
      .getPoll(pollId)
      .then((poll) => {
        if (isCurrent) setFetchedPoll(poll);
      })
      .catch((error) => console.error('Loading the poll failed', error));
    return () => {
      isCurrent = false;
    };
  }, [cachedPoll, client, pollId]);

  return cachedPoll ?? (fetchedPoll?.id === pollId ? fetchedPoll : undefined);
};

type PollPreviewCardProps = {
  /** Shown only for a new message: an edited message keeps its poll. */
  onRemove?: () => void;
  /** Until it's known, the card shows only its label. */
  poll?: Poll;
};

const PollPreviewCard = ({ onRemove, poll }: PollPreviewCardProps) => {
  const preview = useStateStore(poll?.state, pollPreviewSelector);

  return (
    <div className='cookbook-poll-preview'>
      <div className='cookbook-poll-preview__body'>
        <span className='cookbook-poll-preview__label'>Poll</span>
        {preview && (
          <>
            <span className='cookbook-poll-preview__question'>{preview.name}</span>
            <ul className='cookbook-poll-preview__options'>
              {preview.options.map((option) => (
                <li className='cookbook-poll-preview__option' key={option.id}>
                  {option.text}
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
      {onRemove && (
        <RemoveAttachmentPreviewButton aria-label='Remove poll' onClick={onRemove} />
      )}
    </div>
  );
};

/** The poll waiting in the composer, while `messageComposer.state.pollId` is set. */
export const ComposerPollPreview = () => {
  const messageComposer = useMessageComposerController();
  const { editedMessage, pollId } = useStateStore(
    messageComposer.state,
    composerPollSelector,
  );
  const poll = usePendingPoll(pollId);
  if (!pollId) return null;

  return (
    <PollPreviewCard
      // Takes the poll out of the composer and deletes it on the server.
      onRemove={editedMessage ? undefined : () => removePendingPoll(messageComposer)}
      poll={poll}
    />
  );
};

/**
 * The default composer with the poll preview above it. The composer's own preview area renders
 * only for a quoted message, attachments, link previews, a location or an edit, never for a poll
 * alone, so the preview sits outside it.
 */
export const MessageComposerUIWithPoll = () => (
  <div className='cookbook-poll-composer'>
    <ComposerPollPreview />
    <MessageComposerUI />
  </div>
);
