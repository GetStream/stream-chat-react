import { useEffect, useState } from 'react';
import type { MessageComposerState, Poll, PollState } from 'stream-chat';
import type { MessageComposerPreviewSetItem } from 'stream-chat-react';
import {
  defaultMessageComposerPreviewSet,
  MessageComposerPreviews,
  RemoveAttachmentPreviewButton,
  useChatContext,
  useMessageComposerController,
  useStateStore,
} from 'stream-chat-react';
import { removePendingPoll } from './removePendingPoll';
import './ComposerPollPreview.css';

const composerPollSelector = ({ pollId }: MessageComposerState) => ({ pollId });
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
const ComposerPollPreview = () => {
  const messageComposer = useMessageComposerController();
  const { pollId } = useStateStore(messageComposer.state, composerPollSelector);
  const poll = usePendingPoll(pollId);
  if (!pollId) return null;

  return (
    <PollPreviewCard
      // Takes the poll out of the composer, without deleting it.
      onRemove={() => removePendingPoll(messageComposer)}
      poll={poll}
    />
  );
};

const pollPreviewItem: MessageComposerPreviewSetItem = {
  Component: ComposerPollPreview,
  // An edited message keeps its poll, so the preview shows only for a new message.
  isVisible: ({ editedMessage, pollId }) => !editedMessage && !!pollId,
  type: 'poll',
};

// The poll comes right after a quoted message, before the attachments, as in the sent message.
const quotedMessageIndex = defaultMessageComposerPreviewSet.findIndex(
  ({ type }) => type === 'quotedMessage',
);
const previewSetWithPoll = [
  ...defaultMessageComposerPreviewSet.slice(0, quotedMessageIndex + 1),
  pollPreviewItem,
  ...defaultMessageComposerPreviewSet.slice(quotedMessageIndex + 1),
];

/** The composer's previews, with the poll among them. */
export const MessageComposerPreviewsWithPoll = () => (
  <MessageComposerPreviews messageComposerPreviewSet={previewSetWithPoll} />
);
