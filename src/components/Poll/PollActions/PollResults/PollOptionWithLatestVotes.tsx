import React from 'react';
import { PollOptionWithVotesHeader } from './PollOptionWithVotesHeader';
import { PollVoteListing } from '../../PollVote';
import { useStateStore } from '../../../../store';
import { useChannelStateContext, usePollContext, useTranslationContext } from '../../../../context';
import type { PollOption, PollState, PollVote } from 'stream-chat';
import type { DefaultStreamChatGenerics } from '../../../../types';

type PollStateSelectorReturnValue<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
> = { latest_votes_by_option: Record<string, PollVote<StreamChatGenerics>[]> };

const pollStateSelector = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>(
  nextValue: PollState<StreamChatGenerics>,
): PollStateSelectorReturnValue => ({ latest_votes_by_option: nextValue.latest_votes_by_option });

export type PollOptionWithVotesProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
> = {
  option: PollOption<StreamChatGenerics>;
  countVotesPreview?: number;
  showAllVotes?: () => void;
};

export const PollOptionWithLatestVotes = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>({
  countVotesPreview = 5,
  option,
  showAllVotes,
}: PollOptionWithVotesProps<StreamChatGenerics>) => {
  const { t } = useTranslationContext();
  const { channelCapabilities = {} } = useChannelStateContext<StreamChatGenerics>(
    'PollOptionWithLatestVotes',
  );
  const { poll } = usePollContext<StreamChatGenerics>();
  const { latest_votes_by_option } = useStateStore(poll.state, pollStateSelector);

  const votes = latest_votes_by_option && latest_votes_by_option[option.id];

  return (
    <div className='str-chat__poll-option'>
      <PollOptionWithVotesHeader option={option} />
      {votes && <PollVoteListing votes={votes.slice(0, countVotesPreview)} />}
      {channelCapabilities['query-poll-votes'] &&
        showAllVotes &&
        votes?.length > countVotesPreview && (
          <button className='str-chat__poll-option__show-all-votes-button' onClick={showAllVotes}>
            {t<string>('Show all')}
          </button>
        )}
    </div>
  );
};
