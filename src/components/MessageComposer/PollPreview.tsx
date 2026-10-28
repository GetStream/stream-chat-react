import React, { useEffect, useState } from 'react';
import type { MessageComposerState, Poll, PollState } from 'stream-chat';

import { useChatContext } from '../../context/ChatContext';
import { useComponentContextIcons, useTranslationContext } from '../../context';
import { useStateStore } from '../../store';
import { useMessageComposerController } from './hooks';
import { RemoveAttachmentPreviewButton } from './RemoveAttachmentPreviewButton';

const messageComposerStateSelector = ({ pollId }: MessageComposerState) => ({ pollId });

const pollStateSelector = ({ name, options }: PollState) => ({ name, options });

const PollPreviewImage = () => {
  const { IconPoll } = useComponentContextIcons();

  return (
    <div className='str-chat__poll-preview-image'>
      <IconPoll />
    </div>
  );
};

const PollPreviewData = ({ poll }: { poll: Poll }) => {
  const { name, options } = useStateStore(poll.state, pollStateSelector);

  return (
    <div className='str-chat__poll-preview__data'>
      <div className='str-chat__poll-preview__data__title' title={name}>
        {name}
      </div>
      <div className='str-chat__poll-preview__data__subtitle'>
        {options?.map(({ text }) => text).join(', ')}
      </div>
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
