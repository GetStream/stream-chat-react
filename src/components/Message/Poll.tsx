import React, { useEffect, useState } from 'react';
import { StreamMessage, useChatContext } from '../../context';
import { DefaultStreamChatGenerics } from '../../types';
import { Modal } from '../Modal';
import { PollSuggestionForm } from './PollSuggestionForm';
import { PollCommentForm } from './PollCommentForm';
import { PollVotesModal } from './PollVotesModal';

export interface PollProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
> {
  message: StreamMessage<StreamChatGenerics>;
}

// This is a simple progress bar component that takes a percentage prop
// In 0% state, it will be full width with grey background
// In 100% state, it will be full width with green background
// In between, it will be a percentage of the width with green background
// On the outside on right side of the entire container, it will show the percentage value. E.g.,<progress bar dom> | 50%
const PercentageProgressBar = ({ progress, percentage }: { progress: number; percentage: number }) => {
  return (
    <div style={{ display: 'flex', width: '100%', marginTop: 5 }}>
      <div
        style={{
          // display: 'flex',
          // width: '100%',
          height: '15px',
          border: '1px solid #b9b9b9',
          flex: 3
        }}
      >
        <div
          style={{
            width: `${progress}%`,
            backgroundColor: '#22bb33',
            height: '100%',
          }}
        />
        <div
          style={{
            position: 'absolute',
            right: '-40px',
            top: '0',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
          }}
        />
      </div>
      <div style={{ flex: 1, justifyContent: 'flex-end', display: 'flex' }}>
        {percentage > 0 ? `${percentage} %` : ''}
      </div>
    </div>
  );
}

const OverlappingUserAvatars = ({ images }: { images: (string | undefined)[] }) => {
  return (
    <div style={{ display: 'flex' }}>
      {images.slice(0, 3).map((image, index) => (
        <div
          key={index}
          style={{
            left: `${index * 10}px`,
            zIndex: index,
          }}
        >
          <img
            src={`${image}`}
            style={{ width: '20px', height: '20px', borderRadius: '50%' }}
          />
        </div>
      ))}
    </div>
  );
}

export const Poll = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>(props: PollProps<StreamChatGenerics>) => {
  const { message } = props;
  const poll = message.poll;
  console.log('updated poll >>> ', poll.own_votes);
  const { client } = useChatContext<StreamChatGenerics>();
  const [saturated, setSaturated] = useState(false);
  // const [optionByPercentage, setOptionByPercentage] = useState<Record<string, number>>({});
  // @ts-ignore
  const ownVotes = poll.own_votes?.map((vote) => vote.option_id) || [];

  const [creatingSuggestions, setCreatingSuggestion] = useState(false);
  const [addingComment, setAddingComment] = useState(false);
  const [viewingVotes, setViewingVotes] = useState(false);

  const [selectedOptions, setSelectedOptions] = useState(ownVotes);

  const [renderCount, setRenderCount] = useState(0);
  console.log('selectedOptions', selectedOptions);
  useEffect(() => {
    console.log('renderCount', renderCount);
    setRenderCount((prev) => prev + 1);
  }, [JSON.stringify(poll)]);

  useEffect(() => {
    if (poll.own_votes) {
      // @ts-ignore
      const ownVotes = poll.own_votes.map((vote) => vote.option_id);
      console.log('>> useEffect ownVotes', poll.own_votes)
      setSelectedOptions(ownVotes);
    }
  }, [JSON.stringify(poll.own_votes)])

  const handleOptionChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const optionId = e.target.value;
    const isChecked = e.target.checked;

    if (optionId === undefined) {
      return;
    }

    if (isChecked) {
      await client.castPollVote(
        message.id,
        poll.id,
        { option_id: optionId },
      );
    } else {

      if (!poll.own_votes) {
        return;
      }

      // TODO: For some reason typescript gives an error on the line below. So had to use traditional for loop.
      // const voteIdToRemove = poll.own_votes.find((vote) => vote.option_id === optionId)?.id;
      let voteIdToRemove;
      for (let i = 0; i < poll.own_votes.length; i++) {
        if (poll.own_votes[i].option_id === optionId) {
          voteIdToRemove = poll.own_votes[i].id;
          break;
        }
      }

      if (voteIdToRemove) {
        const response = await client.removePollVote(message.id, poll.id, voteIdToRemove);
        console.log('response', response);
      }
    }
  };
  const handleSubmit = (
    e: React.FormEvent<HTMLFormElement>,
    ) => {
    e.preventDefault();
    // Process and submit the vote here
    // You can access the selectedOption state value to send to your API or handle the vote submission
    // console.log('Selected Option:', selectedOption);
  };

  useEffect(() => {
    // Event listener for following poll events
    const subscriptions = [
      client.on('poll.updated', (event) => {
        console.log('poll.updated', event);
      }).unsubscribe,
      client.on('poll.deleted', (event) => {
        console.log('poll.deleted', event);
      }).unsubscribe,
      client.on('poll.vote_casted', (event) => {
        console.log('poll.vote_casted', event);
      }).unsubscribe,
      client.on('poll.vote_changed', (event) => {
        console.log('poll.vote_changed', event);
      }).unsubscribe,
      client.on('poll.closed', (event) => {
        console.log('poll.closed', event);
      }).unsubscribe,
      client.on('message.updated', (event) => {
        console.log('message.updated', event);
      }).unsubscribe,
    ]

    return () => {
      // Clean up the event listeners
      subscriptions.forEach((u) => u());
    };
  }, []);

  useEffect(() => {
    if (!poll.enforce_unique_vote && poll.max_votes_allowed !== null &&selectedOptions.length >= poll.max_votes_allowed) {
      setSaturated(true);
    } else {
      setSaturated(false);
    }
  }, [selectedOptions.join(',')]);
  console.log('poll.vote_count', poll.vote_count);

  // find the option id with highest number of votes
  const optionWithMaxVotes = Object.keys(poll.vote_counts_by_option).reduce((a, b) =>
    poll.vote_counts_by_option[a] > poll.vote_counts_by_option[b] ? a : b
  );
  return (
    <div style={{ margin: '10px' }}>
      {creatingSuggestions && (
        <Modal onClose={() => setCreatingSuggestion(false)} open={creatingSuggestions}>
          <PollSuggestionForm message={message}/>
        </Modal>
      )}
      {addingComment && (
        <Modal onClose={() => setAddingComment(false)} open={addingComment}>
          <PollCommentForm message={message}/>
        </Modal>
      )}
      {
        viewingVotes && (
          <Modal onClose={() => setViewingVotes(false)} open={viewingVotes}>
            <PollVotesModal message={message}/>
          </Modal>
        )
      }
      <h2 style={{ textDecoration: 'underline' }}>{poll.name}</h2>
      {poll.is_closed && <strong>This poll is closed</strong>}
      <p>Total votes: {poll.vote_count}</p>
      <form onSubmit={handleSubmit}>
        {poll.options.map((option) => (
          <div key={option.id} style={
            option.id === optionWithMaxVotes ? { border: '1px solid red', padding: '5px', borderRadius: '5px' } : {
              padding: '5px',
              borderRadius: '5px'
            }
          }>
            <div style={{ display: 'flex', flexDirection: 'column', marginTop: 10, marginBottom: 10 }}>
              <div style={{ display: 'flex', flexDirection: 'row' }}>
                <div style={{ flexGrow: 1 }}>
                  <label>
                    <input
                      checked={selectedOptions.includes(option.id)}
                      disabled={poll.is_closed || (saturated && !selectedOptions.includes(option.id))}
                      onChange={handleOptionChange}
                      type={poll.enforce_unique_vote ? 'radio' : 'checkbox'}
                      value={option.id}
                    />
                    {option.text}
                  </label>
                </div>
                <div style={{ display: 'flex', flexDirection: 'row' }}>
                  {
                    poll.latest_votes_by_option && poll.latest_votes_by_option[option.id]?.length > 0 && (
                      <OverlappingUserAvatars images={poll.latest_votes_by_option[option.id]?.map((vote) => vote.user?.image) || []} />
                    )
                  }
                  {`${(poll.vote_counts_by_option[option.id] || '')}`}
                </div>
              </div>
                <PercentageProgressBar
                  progress={poll.vote_count > 0 ? parseFloat(((poll.vote_counts_by_option[option.id] || 0) * 100 / poll.vote_counts_by_option[
                    optionWithMaxVotes
                  ]).toFixed(1)) : 0}
                  percentage={
                    poll.vote_count > 0 ? parseFloat(((poll.vote_counts_by_option[option.id] || 0) * 100 / poll.vote_count).toFixed(1)) : 0
                  }
                />
                {/* {` (${(poll.vote_counts_by_option[option.id] || 0)} votes, ${((poll.vote_counts_by_option[option.id] || 0) * 100 / poll.vote_count).toFixed(1)}%)`} */}
                {/* {
                  poll.latest_votes_by_option[option.id]?.length > 0 && (
                    <p>
                      <span style={{ fontWeight: 'bold', fontSize: '10px', fontStyle: 'italic' }}>Voted By:</span>
                      {
                        poll.latest_votes_by_option[option.id]?.map((vote) => (
                          <span key={vote.id} style={{ fontStyle: 'italic', fontSize: '10px' }}> {vote.user?.name}</span>
                        ))
                      }
                    </p>
                  )
                } */}
            </div>
          </div>
        ))}
      </form>
      {
        poll.latest_answers?.length > 0 && (
          <>
            <h3 style={{ textDecoration: 'underline' }}>Comments</h3>
            {
              poll.latest_answers.map((comment) => (
                <div key={comment.id}>
                  <p><span style={{ fontWeight: 'bold' }}>{comment.user?.name?.split(' ')[0]} : </span>{comment.answer_text}</p>
                </div>
              ))
            }
          </>
        )
      }
      {
        !poll.is_closed && poll.allow_user_suggested_options && (
          <button onClick={() => setCreatingSuggestion(true)}>Suggest an option</button>
        )
      }
      {
        !poll.is_closed && poll.allow_answers && (
          <button onClick={() => setAddingComment(true)}>Add a comment</button>
        )
      }
      {poll.created_by_id === client.userID && !poll.is_closed && (
        <button
          onClick={() =>
            client.partialUpdatePoll(poll.id, {
              set: {
                is_closed: true,
              },
            })
          }
        >
          Close Poll
        </button>
      )}
      <button onClick={() => setViewingVotes(true)}>View Votes</button>
    </div>
  );
};
