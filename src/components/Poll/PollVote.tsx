import React, { useState } from 'react';
import { Avatar } from '../Avatar';
import { PopperTooltip } from '../Tooltip';
import { useEnterLeaveHandlers } from '../Tooltip/hooks';
import { useChatContext, useTranslationContext } from '../../context';

import type { PollVote as PollVoteType } from 'stream-chat';
import type { DefaultStreamChatGenerics } from '../../types';

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
      {t<string>('timestamp/PollVote', { timestamp: timestampDate })}
      <PopperTooltip
        offset={[0, 5]}
        placement='bottom'
        referenceElement={referenceElement}
        visible={tooltipVisible}
      >
        {t<string>('timestamp/PollVoteTooltip', { timestamp: timestampDate })}
      </PopperTooltip>
    </div>
  );
};

type PollVoteProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = {
  vote: PollVoteType<StreamChatGenerics>;
};

const PollVoteAuthor = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>({
  vote,
}: PollVoteProps<StreamChatGenerics>) => {
  const { t } = useTranslationContext();
  const { client } = useChatContext();
  const { handleEnter, handleLeave, tooltipVisible } =
    useEnterLeaveHandlers<HTMLSpanElement>();
  const [referenceElement, setReferenceElement] = useState<HTMLSpanElement | null>(null);
  const displayName =
    client.user?.id && client.user.id === vote.user?.id
      ? t<string>('You')
      : vote.user?.name || t<string>('Anonymous');

  return (
    <div
      className='str-chat__poll-vote__author'
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      ref={setReferenceElement}
    >
      {vote.user && (
        <Avatar
          className='str-chat__avatar--poll-vote-author'
          image={vote.user.image}
          key={`poll-vote-${vote.id}-avatar-${vote.user.id}`}
          name={vote.user.name}
        />
      )}
      <div className='str-chat__poll-vote__author__name'>{displayName}</div>
      <PopperTooltip
        offset={[0, 5]}
        placement='bottom'
        referenceElement={referenceElement}
        visible={tooltipVisible}
      >
        {displayName}
      </PopperTooltip>
    </div>
  );
};

export const PollVote = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>({
  vote,
}: PollVoteProps<StreamChatGenerics>) => (
  <div className='str-chat__poll-vote'>
    <PollVoteAuthor vote={vote} />
    <PollVoteTimestamp timestamp={vote.created_at} />
  </div>
);

export type PollVoteListingProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = {
  votes: PollVoteType<StreamChatGenerics>[];
};

export const PollVoteListing = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>({
  votes,
}: PollVoteListingProps<StreamChatGenerics>) => (
  <div className='str-chat__poll-vote-listing'>
    {votes.map((vote) => (
      <PollVote key={`poll-vote-${vote.id}`} vote={vote} />
    ))}
  </div>
);
