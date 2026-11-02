import { useEffect, useState } from 'react';
import type { MessageComposerState, Poll, PollState } from 'stream-chat';
import {
  asDynamicKey,
  type MessageComposerPreviewSetItem,
  RemoveAttachmentPreviewButton,
  useChatContext,
  useComponentContextIcons,
  useMessageComposerController,
  useStateStore,
  useTranslationContext,
} from 'stream-chat-react';

const messageComposerStateSelector = ({ pollId }: MessageComposerState) => ({ pollId });

const pollStateSelector = ({
  allow_answers,
  allow_user_suggested_options,
  enforce_unique_vote,
  max_votes_allowed,
  name,
  options,
  voting_visibility,
}: PollState) => ({
  allow_answers,
  allow_user_suggested_options,
  enforce_unique_vote,
  max_votes_allowed,
  name,
  options,
  voting_visibility,
});

/** Stream API error code for a resource that does not exist. */
const DOES_NOT_EXIST_ERROR_CODE = 16;

/** Options named in the preview. A poll holds up to 100, and the rest are only counted. */
const LISTED_OPTION_COUNT = 3;

const PollPreviewData = ({ poll }: { poll: Poll }) => {
  const { t } = useTranslationContext();
  const {
    allow_answers,
    allow_user_suggested_options,
    enforce_unique_vote,
    max_votes_allowed,
    name,
    options = [],
    voting_visibility,
  } = useStateStore(poll.state, pollStateSelector);

  const listedOptions = options
    .slice(0, LISTED_OPTION_COUNT)
    .map(({ text }) => text)
    .join(', ');
  const unlistedOptionCount = options.length - LISTED_OPTION_COUNT;

  const settings = [
    !enforce_unique_vote &&
      (max_votes_allowed
        ? t(asDynamicKey('viteExample.pollPreview.maxVotes.text'), {
            count: max_votes_allowed,
            defaultValue_one: 'Up to {{ count }} vote',
            defaultValue_other: 'Up to {{ count }} votes',
          })
        : t(
            asDynamicKey('viteExample.pollPreview.multipleVotes.text'),
            'Multiple votes',
          )),
    voting_visibility === 'anonymous' &&
      t(asDynamicKey('viteExample.pollPreview.anonymous.text'), 'Anonymous'),
    allow_user_suggested_options &&
      t(
        asDynamicKey('viteExample.pollPreview.suggestOptions.text'),
        'Others can add options',
      ),
    allow_answers && t(asDynamicKey('viteExample.pollPreview.comments.text'), 'Comments'),
  ].filter((setting): setting is string => !!setting);

  return (
    <div className='app__poll-preview__data'>
      <div className='app__poll-preview__title' title={name}>
        {name}
      </div>
      {options.length > 0 && (
        <div className='app__poll-preview__options'>
          <span className='app__poll-preview__options-count'>
            {t(asDynamicKey('viteExample.pollPreview.optionCount.text'), {
              count: options.length,
              defaultValue_one: '{{ count }} option',
              defaultValue_other: '{{ count }} options',
            })}
          </span>
          <span className='app__poll-preview__options-list'>
            {unlistedOptionCount > 0
              ? t(asDynamicKey('viteExample.pollPreview.listedOptions.withMore.text'), {
                  count: unlistedOptionCount,
                  defaultValue_one: '{{ options }} and {{ count }} more',
                  defaultValue_other: '{{ options }} and {{ count }} more',
                  options: listedOptions,
                })
              : listedOptions}
          </span>
        </div>
      )}
      {settings.length > 0 && (
        <ul
          aria-label={t(
            asDynamicKey('viteExample.pollPreview.settings.ariaLabel'),
            'Poll settings',
          )}
          className='app__poll-preview__settings'
        >
          {settings.map((setting) => (
            <li className='app__poll-preview__setting' key={setting}>
              {setting}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

/**
 * Preview of the poll the composer holds (`messageComposer.state.pollId`), which goes out with
 * the message. Shows the poll's question, options and settings, fetching a poll that is not in
 * `client.polls` yet, e.g. one restored from a draft.
 */
export const PollPreview = () => {
  const { client } = useChatContext();
  const { t } = useTranslationContext();
  const { IconPoll } = useComponentContextIcons();
  const messageComposer = useMessageComposerController();
  const { pollId } = useStateStore(messageComposer.state, messageComposerStateSelector);
  const [fetchedPoll, setFetchedPoll] = useState<Poll | undefined>();

  const cachedPoll = pollId ? client.polls.fromState(pollId) : undefined;
  const poll = cachedPoll ?? (fetchedPoll?.id === pollId ? fetchedPoll : undefined);

  // Stopgap: a restored draft carries only `poll_id`, and `client.polls` is not reactive, so the
  // preview fetches the poll itself. Goes away once stream-chat keeps polls in a reactive store.
  useEffect(() => {
    if (!pollId || client.polls.fromState(pollId)) return;
    let cancelled = false;
    client.polls
      .getPoll(pollId)
      .then((poll) => {
        if (!cancelled) setFetchedPoll(poll);
      })
      .catch((error: { code?: number; status?: number }) => {
        // A poll that no longer exists (e.g. a restored draft's deleted poll) would fail the send,
        // so it is detached. Any other failure keeps the placeholder; the poll still goes out.
        if (
          cancelled ||
          (error?.code !== DOES_NOT_EXIST_ERROR_CODE && error?.status !== 404)
        )
          return;
        if (messageComposer.pollId === pollId) {
          messageComposer.state.partialNext({ pollId: null });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [client, messageComposer, pollId]);

  if (!pollId) return null;

  return (
    <div className='app__poll-preview' data-testid='poll-preview'>
      <div className='app__poll-preview__image'>
        <IconPoll />
      </div>
      {poll ? (
        <PollPreviewData poll={poll} />
      ) : (
        <div className='app__poll-preview__data'>
          <div className='app__poll-preview__title'>{t('common.poll.label', 'Poll')}</div>
        </div>
      )}
      <RemoveAttachmentPreviewButton
        aria-label={t(
          asDynamicKey('viteExample.pollPreview.removePoll.ariaLabel'),
          'Remove poll',
        )}
        className='str-chat__attachment-preview__remove-button'
        data-testid='poll-preview-delete-button'
        onClick={() =>
          // Detached, not deleted: the composer does not know whether it created the poll or
          // whether the poll was sent, e.g. a `poll_id` restored from a draft.
          messageComposer.state.partialNext({ pollId: null })
        }
      />
    </div>
  );
};

/** The composer preview item for `PollPreview`, added to the SDK's default preview set. */
export const pollPreviewItem: MessageComposerPreviewSetItem = {
  Component: PollPreview,
  // An edited message keeps its poll; it cannot be replaced or removed.
  isVisible: ({ editedMessage, pollId }) => !editedMessage && !!pollId,
  type: 'poll',
};
