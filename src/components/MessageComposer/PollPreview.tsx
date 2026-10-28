import React, { useEffect, useState } from 'react';
import type { MessageComposerState, Poll, PollState } from 'stream-chat';

import { useChatContext } from '../../context/ChatContext';
import { useComponentContextIcons, useTranslationContext } from '../../context';
import { useStateStore } from '../../store';
import { useMessageComposerController } from './hooks';
import { RemoveAttachmentPreviewButton } from './RemoveAttachmentPreviewButton';

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

/** Options named in the preview. A poll holds up to 100, and the rest are only counted. */
const LISTED_OPTION_COUNT = 3;

const PollPreviewImage = () => {
  const { IconPoll } = useComponentContextIcons();

  return (
    <div className='str-chat__poll-preview-image'>
      <IconPoll />
    </div>
  );
};

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
        ? t('messageComposer.pollPreview.maxVotes.text', {
            count: max_votes_allowed,
            defaultValue_one: 'Up to {{ count }} vote',
            defaultValue_other: 'Up to {{ count }} votes',
          })
        : t('messageComposer.pollPreview.multipleVotes.text', 'Multiple votes')),
    voting_visibility === 'anonymous' &&
      t('messageComposer.pollPreview.anonymous.text', 'Anonymous'),
    allow_user_suggested_options &&
      t('messageComposer.pollPreview.suggestOptions.text', 'Others can add options'),
    allow_answers && t('messageComposer.pollPreview.comments.text', 'Comments'),
  ].filter((setting): setting is string => !!setting);

  return (
    <div className='str-chat__poll-preview__data'>
      <div className='str-chat__poll-preview__data__title' title={name}>
        {name}
      </div>
      {options.length > 0 && (
        <div className='str-chat__poll-preview__data__options'>
          <span className='str-chat__poll-preview__data__options-count'>
            {t('messageComposer.pollPreview.optionCount.text', {
              count: options.length,
              defaultValue_one: '{{ count }} option',
              defaultValue_other: '{{ count }} options',
            })}
          </span>
          <span className='str-chat__poll-preview__data__options-list'>
            {unlistedOptionCount > 0
              ? t('messageComposer.pollPreview.listedOptions.withMore.text', {
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
            'messageComposer.pollPreview.settings.ariaLabel',
            'Poll settings',
          )}
          className='str-chat__poll-preview__data__settings'
        >
          {settings.map((setting) => (
            <li className='str-chat__poll-preview__data__setting' key={setting}>
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
 * the message. Shows the poll's question and options, fetching a poll that is not in
 * `client.polls` yet, e.g. one restored from a draft.
 */
export const PollPreview = () => {
  const { client } = useChatContext();
  const { t } = useTranslationContext();
  const messageComposer = useMessageComposerController();
  const { pollId } = useStateStore(messageComposer.state, messageComposerStateSelector);
  const [fetchedPoll, setFetchedPoll] = useState<Poll | undefined>();

  const cachedPoll = pollId ? client.polls.fromState(pollId) : undefined;
  const poll = cachedPoll ?? (fetchedPoll?.id === pollId ? fetchedPoll : undefined);

  useEffect(() => {
    if (!pollId || client.polls.fromState(pollId)) return;
    let cancelled = false;
    client.polls
      .getPoll(pollId)
      .then((poll) => {
        if (!cancelled) setFetchedPoll(poll);
      })
      .catch(() => {
        // The preview keeps its placeholder; the poll still goes out with the message.
      });
    return () => {
      cancelled = true;
    };
  }, [client, pollId]);

  if (!pollId) return null;

  return (
    <div className='str-chat__poll-preview' data-testid='poll-preview'>
      <PollPreviewImage />
      {poll ? (
        <PollPreviewData poll={poll} />
      ) : (
        <div className='str-chat__poll-preview__data'>
          <div className='str-chat__poll-preview__data__title'>
            {t('common.poll.label', 'Poll')}
          </div>
        </div>
      )}
      <RemoveAttachmentPreviewButton
        aria-label={t('messageComposer.pollPreview.removePoll.ariaLabel', 'Remove poll')}
        className='str-chat__attachment-preview__remove-button'
        data-testid='poll-preview-delete-button'
        onClick={() => messageComposer.state.partialNext({ pollId: null })}
      />
    </div>
  );
};
