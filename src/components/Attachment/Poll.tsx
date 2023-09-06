import React, { useEffect, useState } from 'react';
import { useChatContext } from '../../context';

export const Poll = (props) => {
  const { id: pollId, is_closed: isClosed, name, options } = props.poll;
  const { client } = useChatContext();
  const [saturated, setSaturated] = useState(false);
  const [optionByPercentage, setOptionByPercentage] = useState({});
  const ownVotes = props.poll.own_votes.map((vote) => vote.option_id);

  const [selectedOptions, setSelectedOptions] = useState(ownVotes);

  const [renderCount, setRenderCount] = useState(0);

  useEffect(() => {
    console.log('renderCount', renderCount);
    setRenderCount((prev) => prev + 1);
  }, [props.poll.vote_count]);

  //   const handleOptionChange = async (e) => {
  //     console.log(e);
  //     setSelectedOption(e.target.value);
  //     const response = await client.vote(props.poll.id, [
  //       {
  //         option_id: e.target.value,
  //       },
  //     ]);

  //     console.log(response);
  //   };
  const handleOptionChange = async (e) => {
    const optionId = e.target.value;
    const isChecked = e.target.checked;

    let newSelectedOptions = [];
    if (isChecked) {
      newSelectedOptions = [...selectedOptions, optionId];
      const response = await client.voteOnPoll(
        props.poll.id,
        newSelectedOptions.map((id) => ({ option_id: id })),
      );
    } else {
      newSelectedOptions = selectedOptions.filter((id) => id !== optionId);
      const response = await client.removeVote(props.poll.id, optionId);
    }

    setSelectedOptions(newSelectedOptions);

    // ... rest of the code
  };
  const handleSubmit = (e) => {
    e.preventDefault();
    // Process and submit the vote here
    // You can access the selectedOption state value to send to your API or handle the vote submission
    console.log('Selected Option:', selectedOption);
  };

  useEffect(() => {
    // Event listener for following poll events
    // poll.updated
    // poll.deleted
    // poll.vote_casted
    // poll.closed
    const { unsubscribe: u1 } = client.on('poll.updated', (event) => {
      console.log('poll.updated', event);
    });
    const { unsubscribe: u2 } = client.on('poll.deleted', (event) => {
      console.log('poll.deleted', event);
    });
    const { unsubscribe: u3 } = client.on('poll.vote_casted', (event) => {
      console.log('poll.vote_casted', event);
    });
    const { unsubscribe: u4 } = client.on('poll.closed', (event) => {
      console.log('poll.closed', event);
    });

    const { unsubscribe: u5 } = client.on('message.updated', (event) => {
      console.log('message.updated', event);
    });

    return () => {
      // Clean up the event listeners
      u1();
      u2();
      u3();
      u4();
      u5();
    };
  }, []);

  useEffect(() => {
    if (selectedOptions.length >= props.poll.max_votes_allowed) {
      setSaturated(true);
    } else {
      setSaturated(false);
    }
  }, [selectedOptions.join(',')]);
  console.log('props.poll.vote_count', props.poll.vote_count);
  useEffect(() => {
    const optionByPercentage = options.reduce((acc, option) => {
      const percentage = props.poll.vote_count
        ? Math.round((option.vote_count / props.poll.vote_count) * 100)
        : 0;
      acc[option.id] = percentage;

      return acc;
    }, {});

    setOptionByPercentage(optionByPercentage);
  }, [props.poll.vote_count]);

  return (
    <div>
      <h2>{name}</h2>
      {isClosed && <strong>This poll is closed</strong>}
      <form onSubmit={handleSubmit}>
        {options.map((option) => (
          <div key={option.id}>
            <label>
              <input
                checked={selectedOptions.includes(option.id)}
                disabled={isClosed || (saturated && !selectedOptions.includes(option.id))}
                onChange={handleOptionChange}
                type='checkbox'
                value={option.id}
              />
              {option.text}
              {` (${option.vote_count} votes, ${optionByPercentage[option.id]}%)`}
            </label>
          </div>
        ))}
      </form>
      {props.poll.created_by_id === client.userID && !isClosed && (
        <button
          onClick={() =>
            client.partialUpdatePoll(pollId, {
              set: {
                is_closed: true,
              },
            })
          }
        >
          Close Poll
        </button>
      )}
    </div>
  );
};
