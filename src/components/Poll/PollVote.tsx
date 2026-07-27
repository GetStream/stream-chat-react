import React, { useState } from 'react';
import { Avatar as DefaultAvatar } from '../Avatar';
import { extractDisplayInfo as defaultExtractDisplayInfo } from '../Avatar/utils';
import { PopperTooltip } from '../Tooltip';
import { useEnterLeaveHandlers } from '../Tooltip/hooks';
import {
  useChatContext,
  useComponentContext,
  useTranslationContext,
} from '../../context';

import type { PollVote as PollVoteType } from 'stream-chat';

const PollVoteTimestamp = ({ timestamp }: { timestamp: string }) => {
  const { t } = useTranslationContext();
  const { handleEnter, handleLeave, tooltipVisible } =
    useEnterLeaveHandlers<HTMLSpanElement>();
  const [referenceElement, setReferenceElement] = useState<HTMLSpanElement | null>(null);
  const timestampDate = new Date(timestamp);
  return (
    <div
      className='str-chat__poll-vote__timestamp'
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      ref={setReferenceElement}
    >
      {t('timestamp/PollVote', { timestamp: timestampDate })}
      <PopperTooltip
        offset={[0, 5]}
        placement='bottom'
        referenceElement={referenceElement}
        visible={tooltipVisible}
      >
        {t('timestamp/PollVoteTooltip', { timestamp: timestampDate })}
      </PopperTooltip>
    </div>
  );
};

type PollVoteProps = {
  vote: PollVoteType;
};

type PollVoteAuthor = PollVoteProps;

const PollVoteAuthor = ({ vote }: PollVoteAuthor) => {
  const { t } = useTranslationContext();
  const { client } = useChatContext();
  const { Avatar = DefaultAvatar, extractDisplayInfo = defaultExtractDisplayInfo } =
    useComponentContext();
  const displayName =
    client.user?.id && client.user.id === vote.user?.id
      ? t('You')
      : vote.user?.name || vote.user?.id || t('Anonymous');

  return (
    <div className='str-chat__poll-vote__author'>
      {vote.user && (
        <Avatar
          {...extractDisplayInfo({ user: vote.user })}
          className='str-chat__avatar--poll-vote-author'
          key={`poll-vote-${vote.id}-avatar-${vote.user.id}`}
          size='md'
        />
      )}
      <div className='str-chat__poll-vote__author__name'>{displayName}</div>
    </div>
  );
};

export const PollVote = ({ vote }: PollVoteProps) => (
  <div className='str-chat__poll-vote'>
    <PollVoteAuthor vote={vote} />
    <PollVoteTimestamp timestamp={vote.created_at} />
  </div>
);

export type PollVoteListingProps = {
  votes: PollVoteType[];
};

export const PollVoteListing = ({ votes }: PollVoteListingProps) => (
  <div className='str-chat__poll-vote-listing'>
    {votes.map((vote) => (
      <PollVote key={`poll-vote-${vote.id}`} vote={vote} />
    ))}
  </div>
);
