// @ts-nocheck
import React, { useEffect, useState, useCallback } from 'react';
import { DefaultStreamChatGenerics } from '../../types';
import { StreamMessage, useChatContext } from '../../context';

interface PollProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
> {
  message: StreamMessage<StreamChatGenerics>;
}

export const PollVotesModal = <
StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>(props: PollProps<StreamChatGenerics>) => {
  const message = props.message;
  const poll = message.poll;
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(poll.options[0].id);
  const [votes, setVotes] = useState<any[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const { client } = useChatContext<StreamChatGenerics>();

  useEffect(() => {
    const fetchData = async () => {
      const res = await client.queryPollVotes(poll.id, { option_id: selectedOptionId }, [], { limit: 10 });
      setVotes(res.votes);

      if (res.next) {
        setNextCursor(res.next);
        setHasMore(true);
      } else {
        setHasMore(false);
      }
    };

    fetchData();
  }, [selectedOptionId])

  const loadMore = useCallback(async () => {
    const res = await client.queryPollVotes(poll.id, { option_id: selectedOptionId }, [], { limit: 10, next: nextCursor});
    setVotes([...votes, ...res.votes]);

    if (res.next) {
      setNextCursor(res.next);
      setHasMore(true);
    } else {
      setHasMore(false);
    }
  }, [selectedOptionId, votes, nextCursor])

  return (
    <div>
      <div>
        <label>List of Poll Votes</label>
      </div>
      <div style={{ display: 'flex', flexDirection: 'row' }}>
          {poll.options.map((option) => {
            return (
                <div key={option.id}>
                    <button onClick={() => {
                      setSelectedOptionId(option.id);
                    }}
                    style={
                      selectedOptionId === option.id ? { backgroundColor: 'lightblue' } : {}
                    }
                    >{option.text}</button>
                </div>
            );
          })}
      </div>
      <div style={{ overflow: 'scroll', height: 300 }}>
        {votes.map((vote) => {
          return (
            <div key={vote.user.id} style={{ display:'flex', flexDirection: 'row', alignItems: 'center', marginBottom: '5px' }}>
              <img src={vote.user.image} alt={vote.user.name} style={{ width: '30px', height: '30px', borderRadius: '50%' }} />
              <div>{vote.user.name}</div>
            </div>
          );
        })}
        {
          hasMore && <button onClick={loadMore}>Load More</button>
        }
      </div>
    </div>
  );
};
